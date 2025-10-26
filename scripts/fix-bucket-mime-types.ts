/**
 * Script to fix documentation bucket MIME types
 * Run: npx tsx scripts/fix-bucket-mime-types.ts
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
  }
})

async function updateBucket() {
  console.log('🔧 Updating documentation bucket MIME types...\n')

  // Get current bucket config
  const { data: currentBucket, error: fetchError } = await supabase
    .storage
    .getBucket('documentation')

  if (fetchError) {
    console.error('❌ Error fetching bucket:', fetchError)
    process.exit(1)
  }

  console.log('📦 Current bucket config:', currentBucket)

  // Update bucket with new MIME types
  const { data, error } = await supabase
    .storage
    .updateBucket('documentation', {
      public: false,
      allowedMimeTypes: ['application/json', 'application/pdf', 'text/markdown', 'text/plain'],
      fileSizeLimit: 10485760 // 10MB
    })

  if (error) {
    console.error('❌ Error updating bucket:', error)
    process.exit(1)
  }

  console.log('\n✅ Bucket updated successfully!')
  console.log('📝 New MIME types: application/json, application/pdf, text/markdown, text/plain')
}

updateBucket().catch(console.error)
