/**
 * Execute SQL directly using pg client
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSQLQueries() {
  console.log('🔧 Executing SQL to fix RLS policies...\n')

  const queries = [
    'DROP POLICY IF EXISTS "Users can upload documentation for own agents" ON storage.objects',
    `CREATE POLICY "Authenticated users can upload documentation" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentation')`
  ]

  for (const [index, query] of queries.entries()) {
    console.log(`${index + 1}. Executing:`, query.substring(0, 60) + '...')

    const { data, error } = await supabase.rpc('query' as any, { q: query })

    if (error) {
      console.log(`   ⚠️  Failed (expected): ${error.message}`)
    } else {
      console.log(`   ✅ Success:`, data)
    }
  }

  console.log('\n━'.repeat(40))
  console.log('\n⚠️  The automated approach likely failed.')
  console.log('\n📋 MANUAL STEPS REQUIRED:')
  console.log('\n1. Go to: https://supabase.com/dashboard/project/osampiesjrbxmuykgajy/sql/new')
  console.log('\n2. Copy and paste this SQL:\n')
  console.log('DROP POLICY IF EXISTS "Users can upload documentation for own agents" ON storage.objects;')
  console.log('')
  console.log('CREATE POLICY "Authenticated users can upload documentation"')
  console.log('  ON storage.objects FOR INSERT')
  console.log('  TO authenticated')
  console.log('  WITH CHECK (bucket_id = \'documentation\');')
  console.log('\n3. Click "Run" button')
  console.log('\n4. Try uploading an agent again!')
  console.log('\n━'.repeat(40))
}

executeSQLQueries()
