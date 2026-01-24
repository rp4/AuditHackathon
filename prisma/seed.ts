import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create categories
  console.log('Creating categories...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'preplanning' },
      update: {},
      create: {
        name: 'PrePlanning',
        slug: 'preplanning',
        description: 'Workflow templates for pre-planning phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'planning' },
      update: {},
      create: {
        name: 'Planning',
        slug: 'planning',
        description: 'Workflow templates for planning phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'fieldwork' },
      update: {},
      create: {
        name: 'Fieldwork',
        slug: 'fieldwork',
        description: 'Workflow templates for fieldwork phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'reporting' },
      update: {},
      create: {
        name: 'Reporting',
        slug: 'reporting',
        description: 'Workflow templates for reporting phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'other' },
      update: {},
      create: {
        name: 'Other',
        slug: 'other',
        description: 'Other audit-related workflow templates',
      },
    }),
  ])
  console.log(`✓ Created ${categories.length} categories`)

  // Create dev user (for email/password auth in dev)
  console.log('Creating dev user...')
  const devPasswordHash = await bcrypt.hash('devpassword123', 10)
  const devUser = await prisma.user.upsert({
    where: { email: 'dev@openauditswarms.com' },
    update: {},
    create: {
      email: 'dev@openauditswarms.com',
      name: 'Dev User',
      passwordHash: devPasswordHash,
      bio: 'Development test user',
      emailVerified: new Date(),
    },
  })
  console.log(`✓ Created dev user: ${devUser.email}`)

  // Create a sample swarm with workflow nodes
  console.log('Creating sample swarm...')

  const sampleNodes = [
    {
      id: 'node_1',
      type: 'step',
      position: { x: 100, y: 100 },
      data: {
        label: 'Gather Financial Statements',
        description: 'Collect all relevant financial statements from the client',
        instructions: 'Request balance sheet, income statement, and cash flow statement for the audit period.',
        linkedAgentUrl: '',
      },
    },
    {
      id: 'node_2',
      type: 'step',
      position: { x: 400, y: 100 },
      data: {
        label: 'Analyze Key Ratios',
        description: 'Calculate and analyze key financial ratios',
        instructions: 'Calculate liquidity, profitability, and solvency ratios. Compare with prior periods and industry benchmarks.',
        linkedAgentUrl: '',
      },
    },
    {
      id: 'node_3',
      type: 'step',
      position: { x: 700, y: 100 },
      data: {
        label: 'Document Red Flags',
        description: 'Document any unusual items or potential risks',
        instructions: 'Note any significant variances, unusual transactions, or areas requiring deeper investigation.',
        linkedAgentUrl: '',
      },
    },
  ]

  const sampleEdges = [
    { id: 'edge_1-2', source: 'node_1', target: 'node_2' },
    { id: 'edge_2-3', source: 'node_2', target: 'node_3' },
  ]

  const sampleSwarm = await prisma.swarm.create({
    data: {
      name: 'Financial Statement Analyzer',
      slug: 'financial-statement-analyzer',
      description: 'A workflow template for analyzing financial statements and identifying potential red flags, unusual transactions, and areas requiring deeper audit attention.',
      workflowNodes: JSON.stringify(sampleNodes),
      workflowEdges: JSON.stringify(sampleEdges),
      workflowMetadata: JSON.stringify({ phase: 'Planning', standard: 'General' }),
      workflowVersion: '1.0',
      userId: devUser.id,
      categoryId: categories[0].id,
      is_public: true,
      is_featured: true,
      publishedAt: new Date(),
    },
  })
  console.log(`✓ Created sample swarm: ${sampleSwarm.name}`)

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
