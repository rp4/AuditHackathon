# Fix Upload Error - RLS Policy Update Required

## Problem
You're getting this error when uploading agents:
```
StorageApiError: new row violates row-level security policy
```

This happens because the database security policy requires the agent to exist BEFORE you can upload documentation, but your code uploads documentation FIRST.

## Solution: Update RLS Policy

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/osampiesjrbxmuykgajy/sql/new

### Step 2: Copy and Paste This SQL

```sql
-- Fix documentation bucket RLS policy with path-based security
DROP POLICY IF EXISTS "Users can upload documentation for own agents" ON storage.objects;

CREATE POLICY "Users can upload documentation to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documentation'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Step 3: Click "Run" Button

You should see: ✅ Success. No rows returned

### Step 4: Test Upload

Go back to your app and try uploading an agent again. It should work now!

---

## What This Does

**Before:**
- Policy checked if agent exists in database before allowing upload
- Upload failed because agent doesn't exist yet

**After:**
- Authenticated users can upload to their own folder in documentation bucket (folder name must match their user ID)
- Upload happens first, then agent is created
- Path-based security ensures users can only upload to their own folders
- If agent creation fails, the uploaded document is automatically deleted (cleanup is already in your code)

## Important: Update Your Upload Code

Make sure your upload code uses the correct path structure:
```typescript
const filePath = `${userId}/${agentId}/documentation.pdf`
```

This ensures the file is uploaded to the user's folder, matching the RLS policy.

## Files Updated

These files have been updated for future deployments:
- `supabase/schema.sql` - Main schema file
- `supabase/migrations/20251026_fix_documentation_storage_rls.sql` - Migration file

When you deploy this to production, the migration will run automatically.
