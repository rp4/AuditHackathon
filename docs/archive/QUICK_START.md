# Documentation System - Quick Start

## ✅ System Status: Ready to Use!

The documentation system has been fully implemented and is using your existing `agents-storage` bucket.

## Final Setup Step (5 minutes)

Run this SQL in your Supabase SQL Editor to set up storage policies:

```sql
-- Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'agents-storage';

-- Allow public viewing
CREATE POLICY IF NOT EXISTS "Public can view agent storage files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agents-storage');

-- Allow authenticated users to upload to their agent folders
CREATE POLICY IF NOT EXISTS "Users can upload to their agent folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agents-storage'
  AND (storage.foldername(name))[1] IN (
    SELECT slug FROM agents WHERE user_id = auth.uid()
  )
);

-- Allow users to delete their files
CREATE POLICY IF NOT EXISTS "Users can delete their own agent files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agents-storage'
  AND (storage.foldername(name))[1] IN (
    SELECT slug FROM agents WHERE user_id = auth.uid()
  )
);
```

## Test It Out

### 1. Start the dev server

```bash
npm run dev
```

### 2. Create an agent with documentation

1. Go to http://localhost:3000/add
2. Sign in with LinkedIn
3. Fill out agent details
4. Scroll to "Documentation" section
5. Write documentation in the editor
6. Upload images, create tables, format text
7. Click "Create Agent"

### 3. View the agent

- Redirected to `/agents/[your-agent-slug]`
- Documentation is displayed with formatting
- Images and tables render correctly

## Storage Structure

Documentation images stored at:
```
agents-storage/
  └── {agent-slug}/
      └── documentation/
          └── images/
              ├── {timestamp}-{random}.png
              └── {timestamp}-{random}.jpg
```

## Documentation

- [Full Setup Guide](./DOCUMENTATION_SETUP.md)
- [Monetization Guide](./MONETIZATION_GUIDE.md)
- [Component API](../src/components/documents/README.md)

---

**Ready to go!** Just run the storage policy SQL above. 🎉
