# Univer Document System with Image Support

## Overview

The application now uses **Univer** (an open-source office suite) for rich document editing and viewing with full image support. Users can create comprehensive agent documentation with text formatting, lists, tables, and **pasted images**.

## Features

✅ **Rich Text Editing**: Word-like editing experience with formatting, lists, and styles
✅ **Image Paste Support**: Users can paste images directly from clipboard (Ctrl+V / Cmd+V)
✅ **Image Storage**: Images automatically uploaded to Supabase Storage
✅ **Template System**: Pre-loaded documentation template to guide users
✅ **Read-Only Viewer**: Agent detail pages display documents in view-only mode
✅ **Singleton Instance**: Prevents duplicate service registration errors

## Architecture

### Components

```
src/
├── components/univer/
│   ├── UniverDocumentEditor.tsx    # Editable editor (upload page)
│   └── UniverDocumentViewer.tsx    # Read-only viewer (detail page)
├── lib/univer/
│   ├── univerInstance.ts           # Singleton manager
│   ├── imageService.ts             # Custom image upload service
│   └── templates/
│       └── agentDocTemplate.ts     # Default documentation template
```

### Storage Structure

```
Supabase Storage:
├── documentation/              # Document JSON files
│   └── {agent-slug}/
│       └── documentation.univer
└── agent-images/              # Uploaded images (PUBLIC)
    └── {agent-slug}/
        └── images/
            ├── {uuid}.png
            ├── {uuid}.jpg
            └── ...
```

## Setup Instructions

### 1. Storage Bucket Setup

The `agent-images` bucket has been created automatically. To set up RLS policies:

```bash
# Run the SQL script in Supabase SQL Editor
cat scripts/setup-storage-buckets.sql
```

Or manually in Supabase Dashboard:
1. Go to Storage → Buckets
2. Find `agent-images` bucket
3. Set as **Public**
4. Add RLS policies from `scripts/setup-storage-buckets.sql`

### 2. Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # For scripts only
```

### 3. Verify Setup

```bash
# Check if bucket exists
npm run setup-image-bucket
```

## Usage

### For Users

**Creating an Agent (Upload Page):**
1. Navigate to `/upload`
2. Fill in agent details
3. Edit documentation using the rich text editor
4. **Paste images** by:
   - Copy image to clipboard (screenshot, or from another app)
   - Click in document and press `Ctrl+V` (Windows/Linux) or `Cmd+V` (Mac)
   - Image uploads automatically to Supabase
5. Submit to create agent

**Viewing an Agent:**
1. Navigate to `/agents/[id]`
2. Documentation displays with all images loaded from storage
3. Download button downloads the complete `.univer` document

### For Developers

**Using the Editor:**

```tsx
import { UniverDocumentEditor } from '@/components/univer/UniverDocumentEditor'

function MyComponent() {
  const editorRef = useRef<UniverDocumentEditorRef>(null)

  const handleSave = () => {
    const content = editorRef.current?.getContent()
    // content is IDocumentData format
  }

  return (
    <UniverDocumentEditor
      ref={editorRef}
      agentSlug="my-agent-slug"
      onChange={(content) => console.log('Content changed')}
    />
  )
}
```

**Using the Viewer:**

```tsx
import { UniverDocumentViewer } from '@/components/univer/UniverDocumentViewer'

function AgentPage({ agent }) {
  return (
    <UniverDocumentViewer
      documentPath={agent.markdown_file_url}
      agentSlug={agent.slug}
    />
  )
}
```

## Image Handling Details

### How Image Upload Works

1. **User pastes image** → Browser clipboard API captures image
2. **Univer detects paste** → Extracts blob from clipboard
3. **Custom IImageIoService** → Uploads blob to Supabase Storage
4. **Returns public URL** → Univer replaces temp data with URL
5. **Document saved** → Contains only URL references (not base64)

### Benefits

- **Small document files**: Only URL references, not embedded images
- **Fast loading**: Images served from Supabase CDN
- **Cached delivery**: 1-year cache headers on images
- **Easy cleanup**: Delete agent → delete all images

### Image Limits

- **Max size**: 5MB per image
- **Formats**: PNG, JPG, JPEG, GIF, WebP
- **Storage**: Public bucket (anyone can view via URL)

## Troubleshooting

### Duplicate Identifier Errors

**Fixed!** The singleton manager prevents these errors during React Strict Mode.

### Images Not Uploading

1. Check bucket exists: `npm run setup-image-bucket`
2. Verify RLS policies are applied
3. Check browser console for errors
4. Ensure user is authenticated

### Viewer Not Loading

1. Verify `markdown_file_url` field contains valid path
2. Check document exists in `documentation` bucket
3. Ensure agent slug is correct
4. Check browser console for storage errors

### Images Not Displaying in Viewer

1. Verify images exist in `agent-images` bucket
2. Check bucket is set to **public**
3. Inspect image URLs in document JSON
4. Check browser network tab for 404s

## Migration Notes

### Breaking Changes

- ❌ **Removed**: Old `DocumentEditor.tsx` component
- ❌ **Removed**: ReactMarkdown viewer on agent detail page
- ✅ **New**: Univer-based editor and viewer
- ✅ **New**: Image upload support

### Data Migration

**Not backward compatible** - old markdown documents won't display.

To migrate existing agents:
1. Export markdown content from database
2. Open agent edit page (when implemented)
3. Paste markdown into new editor
4. Save to convert to Univer format

## API Reference

### UniverDocumentEditor

```typescript
interface UniverDocumentEditorProps {
  onChange?: (content: IDocumentData) => void
  initialContent?: IDocumentData
  agentSlug: string  // Required for image uploads
}

interface UniverDocumentEditorRef {
  getContent: () => IDocumentData | null
  setContent: (content: IDocumentData) => void
}
```

### UniverDocumentViewer

```typescript
interface UniverDocumentViewerProps {
  documentPath: string  // Path in storage bucket
  agentSlug: string     // For image resolution
}
```

### Storage Functions

```typescript
// Upload image
uploadAgentImage(agentSlug: string, imageBlob: Blob, imageId: string): Promise<string | null>

// Delete single image
deleteAgentImage(agentSlug: string, imageId: string): Promise<boolean>

// Delete all agent images
deleteAgentImages(agentSlug: string): Promise<boolean>

// Get image URL
getAgentImageUrl(agentSlug: string, imageId: string): string
```

## Performance Optimizations

1. **Singleton Pattern**: Only one Univer instance across app
2. **Lazy Component Loading**: Dynamic imports possible with `next/dynamic`
3. **Image CDN**: Supabase CDN with 1-year cache
4. **Template Memoization**: Template loaded once
5. **Read-Only Mode**: Viewer disables edit commands

## Future Enhancements

- [ ] DOCX import/export (requires Pro license)
- [ ] Image compression before upload
- [ ] Image gallery/picker UI
- [ ] Collaborative editing
- [ ] Version history
- [ ] Comments and annotations
- [ ] Table of contents generation
- [ ] Export to PDF

## Support

For issues or questions:
1. Check this documentation
2. Review browser console logs
3. Check Supabase Storage dashboard
4. Review Univer documentation: https://docs.univer.ai

---

**Last Updated**: 2025-10-26
**Version**: 1.0.0
