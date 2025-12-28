import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// Schema for validating import data
const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.string(), z.unknown()),
})

const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  animated: z.boolean().optional(),
  style: z.record(z.string(), z.unknown()).optional(),
})

const workflowImportSchema = z.object({
  version: z.string(),
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

        // Create the swarm
        const swarm = await prisma.swarm.create({
          data: {
            name: workflow.name,
            slug,
            description: workflow.description || '',
            workflowNodes: JSON.stringify(workflow.diagramJson.nodes || []),
            workflowEdges: JSON.stringify(workflow.diagramJson.edges || []),
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
          error: error.message || 'Failed to create swarm',
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
