import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
  console.log('🌱 Starting database seed...\n')

  // Seed categories
  const categories = [
    { name: 'Financial Audit', slug: 'financial-audit', description: 'Agents for financial auditing and accounting', order_index: 1 },
    { name: 'Compliance', slug: 'compliance', description: 'Regulatory compliance and standards checking', order_index: 2 },
    { name: 'Risk Assessment', slug: 'risk-assessment', description: 'Risk analysis and management agents', order_index: 3 },
    { name: 'Internal Controls', slug: 'internal-controls', description: 'Internal control testing and evaluation', order_index: 4 },
    { name: 'Data Analysis', slug: 'data-analysis', description: 'Data analytics and visualization agents', order_index: 5 },
    { name: 'Report Generation', slug: 'report-generation', description: 'Automated report generation and documentation', order_index: 6 },
    { name: 'Process Automation', slug: 'process-automation', description: 'Workflow and process automation agents', order_index: 7 },
    { name: 'Document Review', slug: 'document-review', description: 'Document analysis and review agents', order_index: 8 },
    { name: 'Other', slug: 'other', description: 'Miscellaneous audit agents', order_index: 999 },
  ]

  console.log('📂 Seeding categories...')
  for (const category of categories) {
    const { error } = await supabase
      .from('categories')
      .upsert(category, { onConflict: 'slug' })

    if (error) {
      console.error(`  ❌ Error seeding category ${category.name}:`, error.message)
    } else {
      console.log(`  ✅ ${category.name}`)
    }
  }

  // Seed platforms
  const platforms = [
    { name: 'OpenAI', slug: 'openai', description: 'OpenAI GPT models and assistants', documentation_url: 'https://platform.openai.com/docs' },
    { name: 'Claude', slug: 'claude', description: 'Anthropic Claude AI', documentation_url: 'https://docs.anthropic.com' },
    { name: 'Google Gemini', slug: 'gemini', description: 'Google Gemini AI models', documentation_url: 'https://ai.google.dev/docs' },
    { name: 'LangChain', slug: 'langchain', description: 'LangChain framework agents', documentation_url: 'https://docs.langchain.com' },
    { name: 'GitHub Copilot', slug: 'copilot', description: 'GitHub Copilot extensions', documentation_url: 'https://docs.github.com/copilot' },
    { name: 'Other', slug: 'other', description: 'Other AI platforms and custom implementations', documentation_url: null },
  ]

  console.log('\n🔧 Seeding platforms...')
  for (const platform of platforms) {
    const { error } = await supabase
      .from('platforms')
      .upsert(platform, { onConflict: 'slug' })

    if (error) {
      console.error(`  ❌ Error seeding platform ${platform.name}:`, error.message)
    } else {
      console.log(`  ✅ ${platform.name}`)
    }
  }

  console.log('\n✅ Database seeding complete!')

  // Verify the data
  const { data: catCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })

  const { data: platCount } = await supabase
    .from('platforms')
    .select('*', { count: 'exact', head: true })

  console.log('\n📊 Final counts:')
  console.log(`  Categories: ${categories.length} seeded`)
  console.log(`  Platforms: ${platforms.length} seeded`)
}

seedData().catch(console.error)
