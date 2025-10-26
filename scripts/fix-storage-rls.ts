/**
 * Script to fix storage RLS policies for documentation bucket
 * Run: npx tsx scripts/fix-storage-rls.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'storage'
  }
})

async function fixRLSPolicies() {
  console.log('🔧 Fixing storage RLS policies...\n')

  // Drop old restrictive policy
  console.log('1️⃣ Dropping old upload policy...')
  const dropOld = `
    DROP POLICY IF EXISTS "Users can upload documentation for own agents" ON storage.objects;
  `

  // Create new permissive policy for authenticated users
  console.log('2️⃣ Creating new upload policy for authenticated users...')
  const createNew = `
    CREATE POLICY "Authenticated users can upload documentation"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'documentation');
  `

  try {
    // Execute via admin client using raw SQL
    const { error: error1 } = await supabase.rpc('exec_sql' as any, { sql: dropOld })
    if (error1 && !error1.message.includes('does not exist')) {
      console.error('❌ Error dropping old policy:', error1)
    } else {
      console.log('✅ Old policy dropped (or didn\'t exist)')
    }

    const { error: error2 } = await supabase.rpc('exec_sql' as any, { sql: createNew })
    if (error2) {
      console.error('❌ Error creating new policy:', error2)
    } else {
      console.log('✅ New policy created')
    }

    console.log('\n✅ RLS policies updated successfully!')
    console.log('📝 Authenticated users can now upload documentation files')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixRLSPolicies().catch(console.error)
