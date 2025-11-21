import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create platforms
  console.log('Creating platforms...')
  const platforms = await Promise.all([
    prisma.platform.upsert({
      where: { slug: 'claude' },
      update: {},
      create: {
        name: 'Claude',
        slug: 'claude',
        description: 'Anthropic Claude AI Assistant',
        website: 'https://claude.ai',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'microsoft-copilot' },
      update: {},
      create: {
        name: 'Microsoft Copilot',
        slug: 'microsoft-copilot',
        description: 'Microsoft Copilot AI Assistant',
        website: 'https://copilot.microsoft.com',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'openai' },
      update: {},
      create: {
        name: 'OpenAI',
        slug: 'openai',
        description: 'ChatGPT, GPT-4, and custom GPTs',
        website: 'https://platform.openai.com',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'google-gemini' },
      update: {},
      create: {
        name: 'Google Gemini',
        slug: 'google-gemini',
        description: 'Google Gemini AI',
        website: 'https://gemini.google.com',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'other' },
      update: {},
      create: {
        name: 'Other',
        slug: 'other',
        description: 'Other AI platforms and tools',
        website: null,
      },
    }),
  ])
  console.log(`✓ Created ${platforms.length} platforms`)

  // Create categories
  console.log('Creating categories...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'preplanning' },
      update: {},
      create: {
        name: 'PrePlanning',
        slug: 'preplanning',
        description: 'Tools for pre-planning phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'planning' },
      update: {},
      create: {
        name: 'Planning',
        slug: 'planning',
        description: 'Tools for planning phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'fieldwork' },
      update: {},
      create: {
        name: 'Fieldwork',
        slug: 'fieldwork',
        description: 'Tools for fieldwork phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'reporting' },
      update: {},
      create: {
        name: 'Reporting',
        slug: 'reporting',
        description: 'Tools for reporting phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'other' },
      update: {},
      create: {
        name: 'Other',
        slug: 'other',
        description: 'Other audit-related tools',
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

  // Create a sample tool
  console.log('Creating sample tool...')
  const sampleTool = await prisma.tool.create({
    data: {
      name: 'Financial Statement Analyzer',
      slug: 'financial-statement-analyzer',
      description: 'An AI-powered tool that analyzes financial statements and identifies potential red flags, unusual transactions, and areas requiring deeper audit attention.',
      documentation: `## Setup Instructions

1. Create a new ChatGPT Assistant or Claude Project
2. Copy the following system prompt:

"You are a financial statement analysis assistant for auditors. Your role is to analyze financial statements and identify potential red flags, unusual transactions, and areas requiring deeper audit attention. Use GPT-4 for optimal performance with temperature 0.2 for consistent results."

3. Configure the model:
   - Model: GPT-4 or Claude 3.5 Sonnet
   - Temperature: 0.2

4. Upload financial statements and ask the assistant to analyze them for audit risks.`,
      userId: devUser.id,
      categoryId: categories[0].id,
      is_public: true,
      is_featured: true,
      publishedAt: new Date(),
      tool_platforms: {
        create: [
          { platformId: platforms[0].id }, // Claude
          { platformId: platforms[2].id }, // OpenAI
        ],
      },
    },
  })
  console.log(`✓ Created sample tool: ${sampleTool.name}`)

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
