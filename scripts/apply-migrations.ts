import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Use service role key for admin operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMigrationStatus() {
  console.log('🔍 Checking current database state...\n')

  // Check if favorites table exists
  const { data: favoritesCheck, error: favError } = await supabase
    .from('favorites')
    .select('id')
    .limit(1)

  console.log('Favorites table exists:', !favError)
  if (favError) {
    console.log('  Error:', favError.message)
  }

  // Check agents table structure
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('favorites_count, upvotes_count')
    .limit(1)

  if (!agentsError && agents && agents.length > 0) {
    console.log('\nAgents table columns:')
    console.log('  - has favorites_count:', 'favorites_count' in agents[0])
    console.log('  - has upvotes_count:', 'upvotes_count' in agents[0])
  } else if (agentsError) {
    console.log('\nAgents table check error:', agentsError.message)
  }

  // Check if document_content exists
  const { data: docCheck, error: docError } = await supabase
    .from('agents')
    .select('document_content')
    .limit(1)

  console.log('\nDocument content column exists:', !docError)
  if (docError) {
    console.log('  Error:', docError.message)
  }
}

checkMigrationStatus()
