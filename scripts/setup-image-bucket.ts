/**
 * Setup script for agent-images storage bucket
 *
 * Creates the bucket and sets up RLS policies
 * Run with: npx tsx scripts/setup-image-bucket.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function setupImageBucket() {
  console.log('🪣 Setting up agent-images storage bucket...\n')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      process.exit(1)
    }

    const bucketExists = buckets?.some(b => b.id === 'agent-images')

    if (bucketExists) {
      console.log('✓ Bucket "agent-images" already exists')
    } else {
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('agent-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
      })

      if (error) {
        console.error('❌ Error creating bucket:', error.message)
        process.exit(1)
      }

      console.log('✅ Created bucket "agent-images"')
    }

    // Note: RLS policies need to be set up via SQL (see setup-storage-buckets.sql)
    console.log('\n📝 Note: Storage RLS policies should be set up via SQL.')
    console.log('   Run the SQL script: scripts/setup-storage-buckets.sql')
    console.log('\n✅ Storage bucket setup complete!')
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the setup
setupImageBucket()
