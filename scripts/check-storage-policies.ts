/**
 * Check all storage policies for documentation bucket
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\n💡 Make sure these are set in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPolicies() {
  try {
    console.log('🔍 Checking storage policies for documentation bucket...\n')

    // Try to get bucket info
    const { data: bucket, error: bucketError } = await supabase
      .storage
      .getBucket('documentation')

    if (bucketError) {
      console.error('❌ Error fetching bucket:', bucketError)
      process.exit(1)
    }

    if (!bucket) {
      console.error('❌ Bucket "documentation" not found')
      process.exit(1)
    }

    console.log('📦 Bucket info:')
    console.log('  Name:', bucket.name)
    console.log('  Public:', bucket.public)
    console.log('  File size limit:', bucket.file_size_limit || 'unlimited', 'bytes')
    console.log('  Allowed MIME types:', bucket.allowed_mime_types || 'all types')

    console.log('\n💡 To view all RLS policies:')
    console.log('Go to: https://supabase.com/dashboard/project/osampiesjrbxmuykgajy/database/policies')
    console.log('Look for policies on "storage.objects" table')
    console.log('\n📝 The INSERT policy should be:')
    console.log('  Name: "Users can upload documentation to own folder"')
    console.log('  Operation: INSERT')
    console.log('  Roles: authenticated')
    console.log('  WITH CHECK: bucket_id = \'documentation\' AND (storage.foldername(name))[1] = auth.uid()::text')

    console.log('\n✅ Check complete!')
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

checkPolicies().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
