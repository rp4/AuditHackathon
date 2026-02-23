import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { requireAdminApi } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'
import { processImportedWorkflow } from '@/lib/utils/workflowImport'

// Schema for validating import data - position is now optional (auto-layout if missing)
const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),  // OPTIONAL - will auto-layout if missing
  data: z.object({
    label: z.string(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    skills: z.array(z.string()).optional(),
    outputs: z.array(z.string()).optional(),
  }).passthrough(),  // Allow extra fields that will be stripped
})

const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  // All style fields optional - will be normalized
  type: z.string().optional(),
  animated: z.boolean().optional(),
  style: z.record(z.string(), z.unknown()).optional(),
}).passthrough()  // Allow extra fields that will be stripped

const workflowImportSchema = z.object({
  version: z.string().optional().default('1.0'),
  data: z.object({
    workflows: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      diagramJson: z.object({
        nodes: z.array(workflowNodeSchema).optional(),
        edges: z.array(workflowEdgeSchema).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    })),
  }),
})

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdminApi()
    if (authError) return authError

    const session = await getServerSession(authOptions)

    const body = await request.json()

    // Validate the import data
    const validated = workflowImportSchema.parse(body)

    const results: Array<{
      name: string
      success: boolean
      error?: string
      slug?: string
    }> = []

    // Process each workflow
    for (const workflow of validated.data.workflows) {
      try {
        // Generate a unique slug
        let baseSlug = generateSlug(workflow.name)
        let slug = baseSlug
        let counter = 1

        // Check for slug uniqueness
        while (await prisma.swarm.findFirst({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`
          counter++
        }

        // Process nodes and edges (auto-layout if needed + normalize styles)
        const { nodes, edges } = processImportedWorkflow(
          workflow.diagramJson.nodes || [],
          workflow.diagramJson.edges || []
        )

        // Create the swarm with processed data
        const swarm = await prisma.swarm.create({
          data: {
            name: workflow.name,
            slug,
            description: workflow.description || '',
            workflowNodes: JSON.stringify(nodes),
            workflowEdges: JSON.stringify(edges),
            workflowMetadata: JSON.stringify(workflow.diagramJson.metadata || {}),
            workflowVersion: validated.version,
            userId: session.user.id,
            is_public: true,
            publishedAt: new Date(),
          },
        })

        results.push({
          name: workflow.name,
          success: true,
          slug: swarm.slug,
        })
      } catch (error: any) {
        results.push({
          name: workflow.name,
          success: false,
          error: error.message || 'Failed to create workflow',
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      imported: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid import format', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error importing workflows:', error)
    return NextResponse.json(
      { error: 'Failed to import workflows' },
      { status: 500 }
    )
  }
}
