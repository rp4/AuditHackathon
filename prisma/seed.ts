import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create platforms
  console.log('Creating platforms...')
  const platforms = await Promise.all([
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
      where: { slug: 'gemini' },
      update: {},
      create: {
        name: 'Google Gemini',
        slug: 'gemini',
        description: 'Google Gemini AI',
        website: 'https://gemini.google.com',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'langchain' },
      update: {},
      create: {
        name: 'LangChain',
        slug: 'langchain',
        description: 'Build LLM applications',
        website: 'https://www.langchain.com',
      },
    }),
    prisma.platform.upsert({
      where: { slug: 'copilot' },
      update: {},
      create: {
        name: 'GitHub Copilot',
        slug: 'copilot',
        description: 'AI pair programmer',
        website: 'https://github.com/features/copilot',
      },
    }),
  ])
  console.log(`✓ Created ${platforms.length} platforms`)

  // Create categories
  console.log('Creating categories...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'financial-analysis' },
      update: {},
      create: {
        name: 'Financial Analysis',
        slug: 'financial-analysis',
        description: 'Tools for analyzing financial statements and data',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'audit-procedures' },
      update: {},
      create: {
        name: 'Audit Procedures',
        slug: 'audit-procedures',
        description: 'Automated audit testing and sampling tools',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'risk-assessment' },
      update: {},
      create: {
        name: 'Risk Assessment',
        slug: 'risk-assessment',
        description: 'Tools for evaluating and analyzing audit risks',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'documentation' },
      update: {},
      create: {
        name: 'Documentation',
        slug: 'documentation',
        description: 'Generate and organize audit documentation',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'data-analysis' },
      update: {},
      create: {
        name: 'Data Analysis',
        slug: 'data-analysis',
        description: 'Analyze large datasets and identify patterns',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'compliance' },
      update: {},
      create: {
        name: 'Compliance',
        slug: 'compliance',
        description: 'Regulatory compliance and monitoring tools',
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
          { platformId: platforms[0].id }, // OpenAI
          { platformId: platforms[1].id }, // Claude
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
