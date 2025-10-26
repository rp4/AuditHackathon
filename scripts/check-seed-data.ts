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

async function checkSeedData() {
  console.log('🔍 Checking Supabase seed data...\n')

  // Check categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')

  if (catError) {
    console.error('❌ Error fetching categories:', catError.message)
  } else {
    console.log(`✅ Categories: ${categories?.length || 0} found`)
    if (categories && categories.length > 0) {
      categories.forEach(cat => console.log(`  - ${cat.name} (${cat.slug})`))
    }
  }

  // Check platforms
  const { data: platforms, error: platError } = await supabase
    .from('platforms')
    .select('*')

  if (platError) {
    console.error('\n❌ Error fetching platforms:', platError.message)
  } else {
    console.log(`\n✅ Platforms: ${platforms?.length || 0} found`)
    if (platforms && platforms.length > 0) {
      platforms.forEach(plat => console.log(`  - ${plat.name} (${plat.slug})`))
    }
  }

  // If either is missing, provide instructions
  if (!categories?.length || !platforms?.length) {
    console.log('\n⚠️  SEED DATA MISSING!')
    console.log('\nTo fix this, run the seed data SQL in Supabase SQL Editor:')
    console.log('1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
    console.log('2. Copy lines 653-674 from supabase/schema.sql')
    console.log('3. Or run: npm run seed-data')
  }
}

checkSeedData()
