/**
 * Script to manually create a profile for the current authenticated user
 * Run this if you're getting "profile not set up" errors
 *
 * Usage: npx tsx scripts/create-profile.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMissingProfiles() {
  console.log('🔍 Checking for users without profiles...\n')

  // Get all auth users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.error('❌ Error fetching users:', usersError)
    process.exit(1)
  }

  console.log(`📊 Found ${users.length} total users`)

  // Get existing profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError)
    process.exit(1)
  }

  const profileIds = new Set(profiles?.map(p => p.id) || [])
  console.log(`✅ Found ${profileIds.size} existing profiles\n`)

  // Find users without profiles
  const usersWithoutProfiles = users.filter(user => !profileIds.has(user.id))

  if (usersWithoutProfiles.length === 0) {
    console.log('✅ All users have profiles!')
    process.exit(0)
  }

  console.log(`⚠️  Found ${usersWithoutProfiles.length} users without profiles:\n`)

  for (const user of usersWithoutProfiles) {
    console.log(`Creating profile for: ${user.email}`)
    console.log(`  User ID: ${user.id}`)
    console.log(`  Metadata:`, user.user_metadata)

    const username = user.user_metadata?.username ||
                    user.user_metadata?.preferred_username ||
                    user.email?.split('@')[0] ||
                    `user_${user.id.slice(0, 8)}`

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        full_name: user.user_metadata?.name || user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.picture || user.user_metadata?.avatar_url || '',
        linkedin_url: user.user_metadata?.linkedin_url || ''
      })

    if (insertError) {
      console.error(`  ❌ Error:`, insertError.message)

      // If username conflict, try with random suffix
      if (insertError.code === '23505') {
        const randomUsername = `${username}_${Math.random().toString(36).slice(2, 8)}`
        console.log(`  🔄 Retrying with username: ${randomUsername}`)

        const { error: retryError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: randomUsername,
            full_name: user.user_metadata?.name || user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.picture || user.user_metadata?.avatar_url || '',
            linkedin_url: user.user_metadata?.linkedin_url || ''
          })

        if (retryError) {
          console.error(`  ❌ Retry failed:`, retryError.message)
        } else {
          console.log(`  ✅ Profile created with username: ${randomUsername}`)
        }
      }
    } else {
      console.log(`  ✅ Profile created with username: ${username}`)
    }
    console.log()
  }

  console.log('✅ Done!')
}

createMissingProfiles().catch(console.error)
