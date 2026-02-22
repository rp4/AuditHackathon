/**
 * Judge Agent — LLM-as-a-Judge for Audit Scoring
 *
 * Evaluates the user's submitted audit findings against known issues
 * stored in the database. Tracks individual issue discoveries per user
 * and supports incremental scoring via report submissions.
 */

import { ADKAgent } from '../client'
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

const SUBMIT_AUDIT_REPORT_DECLARATION: FunctionDeclaration = {
  name: 'submit_audit_report',
  description:
    "Submit the user's audit findings for evaluation. Evaluates the report against the known issues database, credits newly discovered issues, and saves the report. Call this when the user submits their findings for scoring.",
  parametersJsonSchema: {
    type: 'object',
    properties: {
      reportContent: {
        type: 'string',
        description: "The full text of the user's submitted audit report/findings",
      },
      matchedIssueCodes: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Array of issue codes (e.g. ["AM-001", "SEC-004", "HR-001"]) that the user\'s report references. Only include codes for issues that the user has clearly identified.',
      },
    },
    required: ['reportContent', 'matchedIssueCodes'],
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
// Tool Router
// ============================================

async function judgeToolRouter(
  userId: string,
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

  if (name === 'submit_audit_report') {
    const reportContent = args.reportContent as string
    const matchedIssueCodes = args.matchedIssueCodes as string[]

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
        message:
          newlyFound.length > 0
            ? `${newlyFound.length} new issue(s) credited! You have now found ${totalDiscovered} of ${totalIssues} total issues.`
            : `No new issues found in this report. You have found ${totalDiscovered} of ${totalIssues} total issues.`,
      },
    }
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
  // Load all active issues from database
  const allIssues = await getAllIssues({ isActive: true })

  // Load user's already-found issues
  const foundCodes = await getDiscoveredIssueCodes(userId)

  // Group issues by category for the prompt
  const issuesByCategory: Record<string, typeof allIssues> = {}
  for (const issue of allIssues) {
    if (!issuesByCategory[issue.category]) issuesByCategory[issue.category] = []
    issuesByCategory[issue.category].push(issue)
  }

  // Build the issues list section
  let issuesSection = ''
  for (const [category, issues] of Object.entries(issuesByCategory)) {
    issuesSection += `\n### ${category} (${issues.length} findings)\n`
    for (const issue of issues) {
      const alreadyFound = foundCodes.has(issue.issueCode) ? ' [ALREADY FOUND]' : ''
      issuesSection += `- ${issue.issueCode}: ${issue.title} (${issue.severity})${alreadyFound}\n`
    }
  }

  return `You are the Audit Judge for the Bluth Company audit challenge. Your role is to evaluate a user's audit findings against the known set of ${allIssues.length} embedded issues and track their individual discoveries.

## How This Works

The user has been investigating the Bluth Company's data (querying databases, interviewing employees) and will submit their findings to you. You must:

1. Parse their submitted findings
2. Match each finding against the known issues list below
3. Use the submit_audit_report tool to credit newly discovered issues
4. Present a detailed score card showing new vs already-found issues
5. Optionally use save_audit_score for a holistic 1-10 score

## Issue Tracking Game

This is a competitive game where users earn credit for each SPECIFIC issue they discover.
- There are ${allIssues.length} total issues in the database
- The user has already found ${foundCodes.size} issues
- Only NEW discoveries count — issues marked [ALREADY FOUND] below do NOT increment their score
- When evaluating a report, identify which issue codes the user's findings correspond to
- Use submit_audit_report with the matched issue codes to credit new discoveries
- Use get_user_issue_status when the user asks about their progress

## Available Tools
1. **submit_audit_report** — Evaluate the user's findings, match to known issue codes, and credit new discoveries
2. **get_user_issue_status** — Show the user's progress (issues found, categories covered)
3. **save_audit_score** — Save a holistic 1-10 audit score (optional, for additional evaluation)

## Known Issues (${allIssues.length} total)
${issuesSection}

## Scoring Rubric (if using save_audit_score)

### Completeness (4 points max)
- 4.0 pts: 90%+ of issues found
- 3.5 pts: 75-89%
- 3.0 pts: 60-74%
- 2.5 pts: 45-59%
- 2.0 pts: 30-44%
- 1.5 pts: 15-29%
- 1.0 pt:  <15%

### Accuracy (3 points max)
- 3.0 pts: 90%+ correct severity classification
- 2.5 pts: 75-89%
- 2.0 pts: 60-74%
- 1.5 pts: 45-59%
- 1.0 pt:  <45%

### Evidence Quality (2 points max)
- 2.0 pts: Specific evidence for most findings
- 1.5 pts: Some specific, some general
- 1.0 pt:  Mostly general observations
- 0.5 pts: Vague descriptions only

### False Positive Penalty (1 point max, deducted)
- -0.1 per false positive
- Minimum 0.0

## Output Format

When presenting results after submit_audit_report, use this format:

# Audit Report — Results

**New Issues Found: X**
**Already Known: X**
**Total Progress: X / ${allIssues.length} (X%)**

| Category | Found | Total | Progress |
|----------|-------|-------|----------|
${Object.entries(issuesByCategory)
  .map(([cat, issues]) => `| ${cat} | ? | ${issues.length} | ?% |`)
  .join('\n')}

### Newly Credited Issues
[List the new issue codes and titles]

### Already Found (no new credit)
[List already-found codes]

### Improvement Suggestions
[Specific advice on what to investigate next]

## Rules
- Be fair and thorough in matching findings to issue codes
- Give credit if the user identified the core issue, even with different wording
- Don't penalize for organization or formatting — focus on substance
- ALWAYS call submit_audit_report when the user submits findings
- If the user asks to be evaluated but hasn't submitted findings, ask them to list their findings first
- Be encouraging — highlight progress and suggest next areas to explore`
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

  return new ADKAgent({
    model: config.model,
    systemInstruction,
    functionDeclarations: [
      SAVE_AUDIT_SCORE_DECLARATION,
      SUBMIT_AUDIT_REPORT_DECLARATION,
      GET_USER_ISSUE_STATUS_DECLARATION,
    ],
    toolRouter: (name, args) => judgeToolRouter(config.userId, name, args),
    userContext: { userId: config.userId, userEmail: config.userEmail },
    sessionId: config.sessionId,
  })
}
