/**
 * Auto-fix RLS using Supabase Management API
 */

async function fixRLS() {
  const projectRef = 'osampiesjrbxmuykgajy'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  console.log('🔧 Attempting to fix RLS via Management API...\n')

  const sql = `
DROP POLICY IF EXISTS "Users can upload documentation for own agents" ON storage.objects;

CREATE POLICY "Authenticated users can upload documentation"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documentation');
  `.trim()

  try {
    const response = await fetch(
      `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ query: sql })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.log('❌ API approach failed:', error)
      console.log('\n📝 Please run SQL manually in Supabase Dashboard instead')
      console.log('URL: https://supabase.com/dashboard/project/osampiesjrbxmuykgajy/sql/new\n')
      console.log(sql)
      process.exit(1)
    }

    console.log('✅ RLS policy updated successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n📝 Please run SQL manually instead')
  }
}

fixRLS()
