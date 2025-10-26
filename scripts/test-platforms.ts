import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testPlatforms() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('Testing platforms query...')
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success! Platforms:', data)
  }
}

testPlatforms()
