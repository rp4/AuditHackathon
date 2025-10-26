/**
 * Apply RLS policy fix via Supabase SQL
 * This needs to be run with service role key
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyFix() {
  console.log('🔧 Applying RLS policy fix...\n')

  console.log('⚠️  IMPORTANT: This script requires running SQL directly in Supabase Dashboard')
  console.log('📝 Please go to: https://supabase.com/dashboard/project/osampiesjrbxmuykgajy/sql/new\n')
  console.log('Copy and paste this SQL:\n')
  console.log('━'.repeat(60))
  console.log(`
-- Fix documentation bucket RLS policy
DROP POLICY IF EXISTS "Users can upload documentation for own agents" ON storage.objects;

CREATE POLICY "Authenticated users can upload documentation"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documentation');
  `)
  console.log('━'.repeat(60))
  console.log('\n✅ After running the SQL, try uploading an agent again!')
}

applyFix()
