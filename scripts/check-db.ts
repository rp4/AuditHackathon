import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Config loaded:', { supabaseUrl, hasKey: !!supabaseKey })

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Checking database connection...')
  console.log('URL:', supabaseUrl)

  // Check platforms table
  console.log('\n📦 Checking platforms table...')
  const { data: platforms, error: platformsError } = await supabase
    .from('platforms')
    .select('*')
    .limit(10)

  if (platformsError) {
    console.error('❌ Platforms error:', platformsError)
  } else {
    console.log('✅ Platforms found:', platforms?.length || 0)
    console.log(platforms)
  }

  // Check agents table
  console.log('\n🤖 Checking agents table...')
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .limit(10)

  if (agentsError) {
    console.error('❌ Agents error:', agentsError)
  } else {
    console.log('✅ Agents found:', agents?.length || 0)
    console.log(agents)
  }

  // Check categories table
  console.log('\n📁 Checking categories table...')
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .limit(10)

  if (categoriesError) {
    console.error('❌ Categories error:', categoriesError)
  } else {
    console.log('✅ Categories found:', categories?.length || 0)
    console.log(categories)
  }
}

checkDatabase()
