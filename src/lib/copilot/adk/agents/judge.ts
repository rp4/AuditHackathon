/**
 * Judge Agent — LLM-as-a-Judge for Audit Scoring
 *
 * Evaluates the user's submitted audit findings against known issues
 * stored in the database. Uses a 2-phase architecture:
 *
 * 1. User-facing Judge agent — collects findings, presents results.
 *    Has NO access to the issues list (prevents answer-key leakage).
 *
 * 2. Isolated matching agent — created on-the-fly inside the tool router.
 *    Has the full issues list but NO user conversation history.
 *    Matches findings to issues and returns structured JSON.
 */

import { ADKAgent } from '../client'
import { loadSkillWithVars } from '../skill-loader'
import { prisma } from '@/lib/prisma/client'
import {
  getAllIssues,
  getDiscoveredIssueCodes,
  getUserDiscoveryCount,
  getUserReportCount,
  markIssuesFound,
  createReport,
  updateReport,
} from '@/lib/db/audit-issues'
import type { GeminiModel } from '@/lib/copilot/types'
import type { FunctionDeclaration } from '@google/genai'

// ============================================
// Tool Declarations
// ============================================

const SAVE_AUDIT_SCORE_DECLARATION: FunctionDeclaration = {
  name: 'save_audit_score',
  description:
    'Save the audit evaluation score to the database for the leaderboard. Call this AFTER you have computed and presented the score to the user.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      score: {
        type: 'number',
        description: 'Overall score from 1-10',
      },
      details: {
        type: 'string',
        description:
          'JSON string with the full scoring breakdown (categories, missed findings, etc.)',
      },
    },
    required: ['score', 'details'],
  },
}

const EXTRACT_AND_EVALUATE_DECLARATION: FunctionDeclaration = {
  name: 'extract_and_evaluate',
  description:
    "Submit the user's audit findings for server-side evaluation against the known issues database. The matching is performed entirely server-side — you do NOT need to identify issue codes yourself. Just pass the user's full report text.",
  parametersJsonSchema: {
    type: 'object',
    properties: {
      reportContent: {
        type: 'string',
        description: "The full text of the user's submitted audit report/findings. Include everything the user wrote.",
      },
    },
    required: ['reportContent'],
  },
}

const GET_USER_ISSUE_STATUS_DECLARATION: FunctionDeclaration = {
  name: 'get_user_issue_status',
  description:
    "Get the current user's issue discovery status — how many issues they have found, which categories they have covered, and their overall progress. Call this when the user asks about their progress or score.",
  parametersJsonSchema: {
    type: 'object',
    properties: {},
  },
}

// ============================================
// Isolated Matching Agent
// ============================================

/**
 * Create an isolated LLM agent to match user findings against the issues database.
 * This agent has its own context — it never sees the user's conversation history.
 */
async function matchFindings(
  reportContent: string,
  model: string,
  userContext?: { userId: string; userEmail: string }
): Promise<{ matchedIssueCodes: string[]; reasoning: string[] }> {
  const allIssues = await getAllIssues({ isActive: true })

  const issuesByCategory: Record<string, typeof allIssues> = {}
  for (const issue of allIssues) {
    if (!issuesByCategory[issue.category]) issuesByCategory[issue.category] = []
    issuesByCategory[issue.category].push(issue)
  }

  let issuesSection = ''
  for (const [category, issues] of Object.entries(issuesByCategory)) {
    issuesSection += `\n### ${category} (${issues.length} findings)\n`
    for (const issue of issues) {
      issuesSection += `- ${issue.issueCode}: ${issue.title} (${issue.severity}) — ${issue.description}\n`
    }
  }

  const systemInstruction = `You are an audit finding matcher. Your ONLY job is to compare user-submitted audit findings against a known list of issues and return structured JSON.

## Known Issues (${allIssues.length} total)
${issuesSection}

## Instructions
1. Read the user's submitted report carefully
2. For each finding in the report, determine if it matches any known issue
3. Be generous in matching — if the user identified the core problem, even with different wording, give credit
4. Return ONLY valid JSON in this exact format:

\`\`\`json
{
  "matchedIssueCodes": ["AM-001", "SEC-004"],
  "reasoning": ["AM-001: User identified ghost employees through duplicate bank accounts", "SEC-004: User found terminated employees with active access"]
}
\`\`\`

If no issues match, return:
\`\`\`json
{
  "matchedIssueCodes": [],
  "reasoning": ["No findings matched known issues"]
}
\`\`\`

Return ONLY the JSON block. No other text.`

  const isolatedAgent = new ADKAgent({
    model: 'gemini-2.0-flash',
    systemInstruction,
    functionDeclarations: [],
    toolRouter: async () => ({ success: false, error: 'No tools available' }),
    userContext,
  })

  const response = await isolatedAgent.sendMessage(reportContent)
  await isolatedAgent.close()

  try {
    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in matcher response')
    }
    const parsed = JSON.parse(jsonMatch[0])
    return {
      matchedIssueCodes: Array.isArray(parsed.matchedIssueCodes) ? parsed.matchedIssueCodes : [],
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
    }
  } catch (parseError) {
    console.error('Failed to parse matcher response:', parseError, response.text)
    return { matchedIssueCodes: [], reasoning: ['Failed to parse matching results'] }
  }
}

// ============================================
// Reusable Evaluation Pipeline
// ============================================

/**
 * Core evaluation pipeline — matches user findings against the known issues DB.
 * Used by both the judge agent's tool router and the orchestrator's submit_to_judge tool.
 */
export async function evaluateFindings(params: {
  userId: string
  model: string
  userContext: { userId: string; userEmail: string }
  reportContent: string
}): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const { userId, model, userContext, reportContent } = params

  // Use isolated LLM to match findings (separate context, no user conversation)
  const { matchedIssueCodes, reasoning } = await matchFindings(
    reportContent,
    model,
    userContext
  )

  // Create the report record
  const report = await createReport({
    userId,
    content: reportContent,
    totalMatched: matchedIssueCodes.length,
  })

  // Mark issues as found (idempotent)
  const { newlyFound, alreadyFound } = await markIssuesFound(
    userId,
    report.id,
    matchedIssueCodes
  )

  // Update the report with actual new count
  await updateReport(report.id, { newIssues: newlyFound.length })

  // Get updated totals
  const totalDiscovered = await getUserDiscoveryCount(userId)
  const totalIssues = await prisma.auditIssue.count({
    where: { isActive: true },
  })

  // Get category breakdown for the scorecard
  const allIssuesByCategory = await prisma.auditIssue.groupBy({
    by: ['category'],
    where: { isActive: true },
    _count: true,
  })
  const discoveries = await prisma.issueDiscovery.findMany({
    where: { userId },
    include: { issue: { select: { category: true } } },
  })
  const categoryBreakdown: Record<string, { found: number; total: number }> = {}
  for (const g of allIssuesByCategory) {
    categoryBreakdown[g.category] = { found: 0, total: g._count }
  }
  for (const d of discoveries) {
    if (categoryBreakdown[d.issue.category]) {
      categoryBreakdown[d.issue.category].found++
    }
  }

  return {
    success: true,
    result: {
      reportId: report.id,
      newlyFound,
      alreadyFound,
      newCount: newlyFound.length,
      alreadyFoundCount: alreadyFound.length,
      totalDiscovered,
      totalIssues,
      percentage: Math.round((totalDiscovered / Math.max(totalIssues, 1)) * 100),
      categoryBreakdown,
      reasoning,
      message:
        newlyFound.length > 0
          ? `${newlyFound.length} new issue(s) credited! You have now found ${totalDiscovered} of ${totalIssues} total issues.`
          : `No new issues found in this report. You have found ${totalDiscovered} of ${totalIssues} total issues.`,
    },
  }
}

// ============================================
// Tool Router
// ============================================

async function judgeToolRouter(
  userId: string,
  model: string,
  userContext: { userId: string; userEmail: string },
  name: string,
  args: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  if (name === 'save_audit_score') {
    const score = args.score as number
    const details = args.details as string

    const auditScore = await prisma.auditScore.create({
      data: { userId, score, details },
    })

    return {
      success: true,
      result: {
        id: auditScore.id,
        score: auditScore.score,
        message: 'Audit score saved to leaderboard.',
      },
    }
  }

  if (name === 'extract_and_evaluate') {
    const reportContent = args.reportContent as string
    return evaluateFindings({ userId, model, userContext, reportContent })
  }

  if (name === 'get_user_issue_status') {
    const [discoveries, totalIssues, reportCount] = await Promise.all([
      prisma.issueDiscovery.findMany({
        where: { userId },
        include: {
          issue: {
            select: { issueCode: true, title: true, category: true, severity: true },
          },
        },
      }),
      prisma.auditIssue.count({ where: { isActive: true } }),
      getUserReportCount(userId),
    ])

    // Group by category
    const allIssues = await prisma.auditIssue.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true,
    })
    const categoryTotals = Object.fromEntries(
      allIssues.map(g => [g.category, g._count])
    )

    const byCategory: Record<string, { found: number; total: number; codes: string[] }> =
      {}
    for (const [cat, total] of Object.entries(categoryTotals)) {
      byCategory[cat] = { found: 0, total, codes: [] }
    }
    for (const d of discoveries) {
      const cat = d.issue.category
      if (!byCategory[cat]) byCategory[cat] = { found: 0, total: 0, codes: [] }
      byCategory[cat].found++
      byCategory[cat].codes.push(d.issue.issueCode)
    }

    return {
      success: true,
      result: {
        totalFound: discoveries.length,
        totalIssues,
        reportsSubmitted: reportCount,
        percentage: Math.round((discoveries.length / Math.max(totalIssues, 1)) * 100),
        byCategory,
        foundIssueCodes: discoveries.map(d => d.issue.issueCode),
      },
    }
  }

  return { success: false, error: `Unknown tool: ${name}` }
}

// ============================================
// Dynamic System Instruction
// ============================================

async function getJudgeSystemInstruction(userId: string): Promise<string> {
  const foundCodes = await getDiscoveredIssueCodes(userId)

  let foundSummary: string
  if (foundCodes.size === 0) {
    foundSummary = 'No issues discovered yet.'
  } else {
    const foundIssues = await prisma.auditIssue.findMany({
      where: { issueCode: { in: Array.from(foundCodes) }, isActive: true },
      select: { issueCode: true, title: true, category: true },
      orderBy: [{ category: 'asc' }, { issueCode: 'asc' }],
    })
    foundSummary = foundIssues
      .map(i => `- ${i.issueCode}: ${i.title} (${i.category})`)
      .join('\n')
  }

  return loadSkillWithVars('judge-extract', {
    foundIssuesSummary: foundSummary,
  })
}

// ============================================
// Agent Factory
// ============================================

export async function createJudgeAgent(config: {
  model: GeminiModel
  userId: string
  userEmail: string
  sessionId?: string
}): Promise<ADKAgent> {
  const systemInstruction = await getJudgeSystemInstruction(config.userId)
  const userContext = { userId: config.userId, userEmail: config.userEmail }

  return new ADKAgent({
    model: config.model,
    systemInstruction,
    functionDeclarations: [
      SAVE_AUDIT_SCORE_DECLARATION,
      EXTRACT_AND_EVALUATE_DECLARATION,
      GET_USER_ISSUE_STATUS_DECLARATION,
    ],
    toolRouter: (name, args) =>
      judgeToolRouter(config.userId, config.model, userContext, name, args),
    userContext,
    sessionId: config.sessionId,
  })
}
