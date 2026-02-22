/**
 * SwarmToolRouter
 *
 * Replaces MCPRestClient. Instead of making HTTP calls to an MCP server,
 * this queries the shared Prisma database directly for workflow operations.
 */

import { prisma } from '@/lib/prisma/client'
import { processImportedWorkflow } from '@/lib/utils/workflowImport'

interface ToolResult {
  success: boolean
  result?: unknown
  error?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface SwarmToolRouterOptions {
  canvasMode?: boolean
}

export class SwarmToolRouter {
  private userId: string
  private options: SwarmToolRouterOptions

  constructor(userId: string, options?: SwarmToolRouterOptions) {
    this.userId = userId
    this.options = options || {}
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    try {
      switch (name) {
        case 'list_workflows':
          return await this.listWorkflows(args)
        case 'get_workflow':
          return await this.getWorkflow(args)
        case 'create_workflow':
          return await this.createWorkflow(args)
        case 'update_workflow':
          return await this.updateWorkflow(args)
        case 'get_favorites':
          return await this.getFavorites()
        case 'toggle_favorite':
          return await this.toggleFavorite(args)
        case 'get_categories':
          return await this.getCategories()
        case 'get_workflow_progress':
          return await this.getWorkflowProgress(args)
        case 'save_step_result':
          return await this.saveStepResult(args)
        case 'get_step_context':
          return await this.getStepContext(args)
        default:
          return { success: false, error: `Unknown tool: ${name}` }
      }
    } catch (error) {
      console.error(`SwarmToolRouter error (${name}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      }
    }
  }

  private async listWorkflows(args: Record<string, unknown>): Promise<ToolResult> {
    const search = args.search as string | undefined
    const categorySlug = args.categorySlug as string | undefined
    const limit = Math.min((args.limit as number) || 20, 50)
    const sortBy = (args.sortBy as string) || 'recent'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { is_public: true, isDeleted: false }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (categorySlug) {
      where.category = { slug: categorySlug }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any
    switch (sortBy) {
      case 'popular':
        orderBy = { downloads_count: 'desc' as const }
        break
      case 'rating':
        orderBy = { rating_avg: 'desc' as const }
        break
      default:
        orderBy = { createdAt: 'desc' as const }
    }

    const swarms = await prisma.swarm.findMany({
      where,
      orderBy,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        views_count: true,
        downloads_count: true,
        favorites_count: true,
        rating_avg: true,
        rating_count: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
        user: { select: { name: true } },
      },
    })

    return {
      success: true,
      result: {
        workflows: swarms.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description,
          author: s.user.name,
          category: s.category?.name || null,
          categorySlug: s.category?.slug || null,
          stats: {
            views: s.views_count,
            downloads: s.downloads_count,
            favorites: s.favorites_count,
            rating: s.rating_avg,
            ratingCount: s.rating_count,
          },
          createdAt: s.createdAt,
        })),
        total: swarms.length,
      },
    }
  }

  private async getWorkflow(args: Record<string, unknown>): Promise<ToolResult> {
    const slug = args.slug as string
    if (!slug) return { success: false, error: 'slug is required' }

    const swarm = await prisma.swarm.findFirst({
      where: { slug, isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        workflowNodes: true,
        workflowEdges: true,
        workflowMetadata: true,
        workflowVersion: true,
        views_count: true,
        downloads_count: true,
        favorites_count: true,
        rating_avg: true,
        createdAt: true,
        userId: true,
        category: { select: { name: true, slug: true } },
        user: { select: { name: true } },
      },
    })

    if (!swarm) return { success: false, error: `Workflow "${slug}" not found` }

    let nodes: unknown[] = []
    let edges: unknown[] = []
    let metadata: unknown = {}

    try { nodes = JSON.parse(swarm.workflowNodes || '[]') } catch { /* empty */ }
    try { edges = JSON.parse(swarm.workflowEdges || '[]') } catch { /* empty */ }
    try { metadata = JSON.parse(swarm.workflowMetadata || '{}') } catch { /* empty */ }

    return {
      success: true,
      result: {
        id: swarm.id,
        name: swarm.name,
        slug: swarm.slug,
        description: swarm.description,
        author: swarm.user.name,
        isOwner: swarm.userId === this.userId,
        category: swarm.category?.name || null,
        nodes,
        edges,
        metadata,
        version: swarm.workflowVersion,
        stats: {
          views: swarm.views_count,
          downloads: swarm.downloads_count,
          favorites: swarm.favorites_count,
          rating: swarm.rating_avg,
        },
        createdAt: swarm.createdAt,
      },
    }
  }

  private async createWorkflow(args: Record<string, unknown>): Promise<ToolResult> {
    const name = args.name as string
    const description = args.description as string
    const nodes = args.nodes as unknown[] | undefined
    const edges = args.edges as unknown[] | undefined
    const metadata = args.metadata as Record<string, unknown> | undefined
    const categorySlug = args.categorySlug as string | undefined

    if (!name) return { success: false, error: 'name is required' }
    if (!description) return { success: false, error: 'description is required' }

    // In canvasMode, return data without saving to DB
    // The frontend will render it on the canvas for the user to review and save
    if (this.options.canvasMode) {
      return {
        success: true,
        result: {
          canvasMode: true,
          name,
          description,
          nodes: nodes || [],
          edges: edges || [],
          metadata: metadata || {},
          categorySlug,
          message: `Workflow "${name}" generated. It's now displayed on the canvas for you to review and save.`,
        },
      }
    }

    // Generate unique slug
    let baseSlug = slugify(name)
    let slug = baseSlug
    let suffix = 1
    while (await prisma.swarm.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    // Resolve category
    let categoryId: string | null = null
    if (categorySlug) {
      const category = await prisma.category.findUnique({ where: { slug: categorySlug } })
      if (category) categoryId = category.id
    }

    // Apply dagre layout for proper node positioning
    const { nodes: layoutNodes, edges: layoutEdges } = processImportedWorkflow(
      (nodes || []) as any[],
      (edges || []) as any[],
      { forceLayout: true }
    )

    const swarm = await prisma.swarm.create({
      data: {
        name,
        slug,
        description,
        workflowNodes: JSON.stringify(layoutNodes),
        workflowEdges: JSON.stringify(layoutEdges),
        workflowMetadata: metadata ? JSON.stringify(metadata) : null,
        userId: this.userId,
        categoryId,
        is_public: true,
        publishedAt: new Date(),
      },
      select: { id: true, slug: true, name: true },
    })

    return {
      success: true,
      result: {
        id: swarm.id,
        slug: swarm.slug,
        name: swarm.name,
        message: `Workflow "${swarm.name}" created successfully. View at /swarms/${swarm.slug}`,
      },
    }
  }

  private async updateWorkflow(args: Record<string, unknown>): Promise<ToolResult> {
    const slug = args.slug as string
    if (!slug) return { success: false, error: 'slug is required' }

    const swarm = await prisma.swarm.findFirst({
      where: { slug, isDeleted: false },
      select: { id: true, userId: true },
    })

    if (!swarm) return { success: false, error: `Workflow "${slug}" not found` }
    if (swarm.userId !== this.userId) {
      return { success: false, error: 'You can only update your own workflows' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (args.name) data.name = args.name
    if (args.description) data.description = args.description
    if (args.nodes) data.workflowNodes = JSON.stringify(args.nodes)
    if (args.edges) data.workflowEdges = JSON.stringify(args.edges)
    if (args.metadata) data.workflowMetadata = JSON.stringify(args.metadata)

    const updated = await prisma.swarm.update({
      where: { id: swarm.id },
      data,
      select: { id: true, slug: true, name: true },
    })

    return {
      success: true,
      result: {
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
        message: `Workflow "${updated.name}" updated successfully.`,
      },
    }
  }

  private async getFavorites(): Promise<ToolResult> {
    const favorites = await prisma.favorite.findMany({
      where: { userId: this.userId },
      include: {
        swarm: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            rating_avg: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      success: true,
      result: {
        favorites: favorites.map((f) => ({
          swarmId: f.swarm.id,
          name: f.swarm.name,
          slug: f.swarm.slug,
          description: f.swarm.description,
          category: f.swarm.category?.name || null,
          rating: f.swarm.rating_avg,
          favoritedAt: f.createdAt,
        })),
        total: favorites.length,
      },
    }
  }

  private async toggleFavorite(args: Record<string, unknown>): Promise<ToolResult> {
    const swarmId = args.swarmId as string
    if (!swarmId) return { success: false, error: 'swarmId is required' }

    const existing = await prisma.favorite.findUnique({
      where: { userId_swarmId: { userId: this.userId, swarmId } },
    })

    if (existing) {
      await prisma.$transaction([
        prisma.favorite.delete({ where: { id: existing.id } }),
        prisma.swarm.update({
          where: { id: swarmId },
          data: { favorites_count: { decrement: 1 } },
        }),
      ])
      return { success: true, result: { favorited: false, message: 'Removed from favorites' } }
    } else {
      await prisma.$transaction([
        prisma.favorite.create({ data: { userId: this.userId, swarmId } }),
        prisma.swarm.update({
          where: { id: swarmId },
          data: { favorites_count: { increment: 1 } },
        }),
      ])
      return { success: true, result: { favorited: true, message: 'Added to favorites' } }
    }
  }

  private async getCategories(): Promise<ToolResult> {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { swarms: true } },
      },
      orderBy: { name: 'asc' },
    })

    return {
      success: true,
      result: {
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          workflowCount: c._count.swarms,
        })),
      },
    }
  }

  private async getWorkflowProgress(args: Record<string, unknown>): Promise<ToolResult> {
    const swarmId = args.swarmId as string
    if (!swarmId) return { success: false, error: 'swarmId is required' }

    // Get the workflow to know total steps
    const swarm = await prisma.swarm.findUnique({
      where: { id: swarmId },
      select: { id: true, name: true, workflowNodes: true, userId: true },
    })

    if (!swarm) return { success: false, error: 'Workflow not found' }
    if (swarm.userId !== this.userId) {
      return { success: false, error: 'Only the workflow owner can track step progress' }
    }

    let nodes: Array<{ id: string; data?: { label?: string } }> = []
    try { nodes = JSON.parse(swarm.workflowNodes || '[]') } catch { /* empty */ }

    // Get user's step results for this workflow
    const stepResults = await prisma.stepResult.findMany({
      where: { userId: this.userId, swarmId },
      select: {
        nodeId: true,
        completed: true,
        completedAt: true,
        updatedAt: true,
      },
    })

    const resultMap = new Map(stepResults.map((r) => [r.nodeId, r] as const))
    const totalSteps = nodes.length
    const completedSteps = stepResults.filter((r) => r.completed).length

    return {
      success: true,
      result: {
        workflowId: swarm.id,
        workflowName: swarm.name,
        totalSteps,
        completedSteps,
        progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
        steps: nodes.map((node) => {
          const result = resultMap.get(node.id)
          return {
            nodeId: node.id,
            label: node.data?.label || node.id,
            completed: result?.completed || false,
            completedAt: result?.completedAt || null,
            lastUpdated: result?.updatedAt || null,
          }
        }),
      },
    }
  }

  private async saveStepResult(args: Record<string, unknown>): Promise<ToolResult> {
    const swarmId = args.swarmId as string
    const nodeId = args.nodeId as string
    const result = args.result as string
    const completed = args.completed !== false // default true

    if (!swarmId) return { success: false, error: 'swarmId is required' }
    if (!nodeId) return { success: false, error: 'nodeId is required' }
    if (!result) return { success: false, error: 'result is required' }

    // Verify ownership
    const swarm = await prisma.swarm.findUnique({
      where: { id: swarmId },
      select: { userId: true },
    })
    if (!swarm) return { success: false, error: 'Workflow not found' }
    if (swarm.userId !== this.userId) {
      return { success: false, error: 'Only the workflow owner can save step results' }
    }

    const stepResult = await prisma.stepResult.upsert({
      where: {
        userId_swarmId_nodeId: {
          userId: this.userId,
          swarmId,
          nodeId,
        },
      },
      create: {
        userId: this.userId,
        swarmId,
        nodeId,
        result,
        completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        result,
        completed,
        completedAt: completed ? new Date() : null,
      },
      select: { id: true, completed: true, completedAt: true },
    })

    return {
      success: true,
      result: {
        id: stepResult.id,
        nodeId,
        completed: stepResult.completed,
        completedAt: stepResult.completedAt,
        message: completed
          ? `Step "${nodeId}" completed and result saved.`
          : `Step "${nodeId}" result saved (not yet marked complete).`,
      },
    }
  }

  private async getStepContext(args: Record<string, unknown>): Promise<ToolResult> {
    const swarmId = args.swarmId as string
    const nodeId = args.nodeId as string

    if (!swarmId) return { success: false, error: 'swarmId is required' }
    if (!nodeId) return { success: false, error: 'nodeId is required' }

    // Get workflow with nodes and edges
    const swarm = await prisma.swarm.findUnique({
      where: { id: swarmId },
      select: {
        id: true,
        name: true,
        userId: true,
        workflowNodes: true,
        workflowEdges: true,
      },
    })

    if (!swarm) return { success: false, error: 'Workflow not found' }
    if (swarm.userId !== this.userId) {
      return { success: false, error: 'Only the workflow owner can access step context' }
    }

    let nodes: Array<{
      id: string
      data?: { label?: string; description?: string; instructions?: string }
    }> = []
    let edges: Array<{ source: string; target: string }> = []
    try { nodes = JSON.parse(swarm.workflowNodes || '[]') } catch { /* empty */ }
    try { edges = JSON.parse(swarm.workflowEdges || '[]') } catch { /* empty */ }

    // Find the target node
    const targetNode = nodes.find((n) => n.id === nodeId)
    if (!targetNode) {
      return { success: false, error: `Step "${nodeId}" not found in workflow` }
    }

    // Find upstream node IDs (nodes that have edges pointing to this node)
    const upstreamNodeIds = edges
      .filter((e) => e.target === nodeId)
      .map((e) => e.source)

    // Get user's results for upstream steps
    const upstreamResults = upstreamNodeIds.length > 0
      ? await prisma.stepResult.findMany({
          where: {
            userId: this.userId,
            swarmId,
            nodeId: { in: upstreamNodeIds },
          },
          select: { nodeId: true, result: true, completed: true },
        })
      : []

    // Get user's current result for this step (if any)
    const currentResult = await prisma.stepResult.findUnique({
      where: {
        userId_swarmId_nodeId: { userId: this.userId, swarmId, nodeId },
      },
      select: { result: true, completed: true, completedAt: true },
    })

    // Map upstream nodes with their results
    const upstreamContext = upstreamNodeIds.map((id) => {
      const node = nodes.find((n) => n.id === id)
      const result = upstreamResults.find((r) => r.nodeId === id)
      return {
        nodeId: id,
        label: node?.data?.label || id,
        completed: result?.completed || false,
        result: result?.result || null,
      }
    })

    return {
      success: true,
      result: {
        workflowName: swarm.name,
        step: {
          nodeId: targetNode.id,
          label: targetNode.data?.label || '',
          description: targetNode.data?.description || '',
          instructions: targetNode.data?.instructions || '',
        },
        currentResult: currentResult
          ? {
              result: currentResult.result,
              completed: currentResult.completed,
              completedAt: currentResult.completedAt,
            }
          : null,
        upstreamSteps: upstreamContext,
        allUpstreamCompleted: upstreamContext.every((u) => u.completed),
      },
    }
  }
}
