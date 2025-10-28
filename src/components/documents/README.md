# Documentation Components

This directory contains components for the Tiptap-based documentation system.

## Components Overview

### DocumentEditor.tsx

Rich text editor for creating and editing agent documentation.

**Props:**
- `agentSlug` (string, required): Agent slug for image storage organization
- `initialContent` (JSONContent, optional): Initial Tiptap JSON content
- `onSave` (function, optional): Callback when content is saved `(content, images) => void`
- `onContentChange` (function, optional): Callback on every change `(content) => void`
- `placeholder` (string, optional): Placeholder text
- `editable` (boolean, optional): Whether editor is editable (default: true)
- `autoSave` (boolean, optional): Enable auto-save (default: true)
- `autoSaveDelay` (number, optional): Auto-save delay in ms (default: 3000)

**Example:**
```tsx
<DocumentEditor
  agentSlug="my-agent"
  initialContent={existingContent}
  onSave={(content, images) => {
    console.log('Saved!', content, images)
  }}
  placeholder="Write your documentation..."
/>
```

**Features:**
- Full toolbar with formatting options
- Image upload with drag & drop
- Auto-save with debouncing
- Character and word count
- Tables, lists, links, code blocks

---

### DocumentViewer.tsx

Read-only viewer for displaying agent documentation.

**Props:**
- `content` (JSONContent | null, required): Tiptap JSON content to display
- `className` (string, optional): Additional CSS classes

**Example:**
```tsx
<DocumentViewer content={agent.documentation_full} />
```

**Features:**
- Read-only display
- Same styling as editor for consistency
- Optimized for performance (no editing overhead)
- Print-friendly CSS

---

### DocumentUploader.tsx

File uploader for converting Word documents to Tiptap format.

**Props:**
- `agentSlug` (string, required): Agent slug for image storage
- `onConversionComplete` (function, required): Callback after conversion `(content, images) => void`
- `onCancel` (function, optional): Callback when user cancels

**Example:**
```tsx
<DocumentUploader
  agentSlug="my-agent"
  onConversionComplete={(content, images) => {
    setDocumentationContent(content)
    setDocumentationImages(images)
  }}
  onCancel={() => setShowUploader(false)}
/>
```

**Features:**
- Drag & drop or file picker
- .docx file support (max 10MB)
- Automatic conversion to Tiptap JSON
- Image extraction and upload
- Preview before confirming
- Error handling

---

### EditorToolbar.tsx

Formatting toolbar for DocumentEditor.

**Props:**
- `editor` (Editor, required): Tiptap editor instance
- `agentSlug` (string, required): Agent slug for image uploads
- `onImageUpload` (function, optional): Callback after image upload `(url) => void`

**Note:** This is typically used internally by DocumentEditor, not directly by consumers.

**Features:**
- Undo/Redo
- Text formatting (bold, italic, strikethrough, code)
- Headings (H1, H2, H3)
- Lists (bullet, ordered, task)
- Text alignment
- Links, images, tables
- Blockquotes, horizontal rules

---

### PaywallBanner.tsx

Banner component for premium content upsell.

**Props:**
- `agentId` (string, required): Agent ID
- `agentName` (string, required): Agent name for display
- `price` (number, required): Price in specified currency
- `currency` (string, required): Currency code (USD, EUR, etc.)
- `onPurchase` (function, optional): Custom purchase handler

**Example:**
```tsx
{agent.is_premium && (
  <PaywallBanner
    agentId={agent.id}
    agentName={agent.name}
    price={agent.price}
    currency={agent.currency}
  />
)}
```

**Features:**
- Prominent pricing display
- "What's included" list
- Purchase button (redirects to Stripe Checkout)
- Responsive design
- Professional styling

---

## Utility Functions

### storage.ts (`src/lib/documents/storage.ts`)

**Functions:**
- `uploadDocumentImage(agentSlug, file)`: Upload image to Supabase Storage
- `deleteDocumentImage(imagePath)`: Delete single image
- `deleteDocumentImages(imagePaths)`: Delete multiple images
- `deleteAgentDocumentImages(agentSlug)`: Delete all images for an agent
- `extractImageUrls(content)`: Extract image URLs from Tiptap JSON
- `cleanupOrphanedImages(agentSlug, currentImageUrls)`: Remove unused images
- `getDocumentStorageUsage(agentSlug)`: Get total storage size

**Example:**
```ts
import { uploadDocumentImage } from '@/lib/documents/storage'

const result = await uploadDocumentImage('my-agent', imageFile)
if (result.success) {
  console.log('Image URL:', result.url)
}
```

---

### converter.ts (`src/lib/documents/converter.ts`)

**Functions:**
- `convertDocxToTiptap(file)`: Convert .docx file to Tiptap JSON
- `htmlToTiptap(html)`: Convert HTML string to Tiptap JSON
- `splitContentForPreview(content, paragraphCount)`: Split content into preview/full

**Example:**
```ts
import { convertDocxToTiptap } from '@/lib/documents/converter'

const result = await convertDocxToTiptap(wordFile)
if (result.success) {
  console.log('Converted content:', result.content)
  console.log('Extracted images:', result.images)
}
```

---

### access.ts (`src/lib/documents/access.ts`)

**Functions:**
- `canAccessFullDocumentation(agentId, userId, agent?)`: Check if user can access full docs
- `hasPurchased(agentId, userId)`: Check if user has purchased agent

**Example:**
```ts
import { canAccessFullDocumentation } from '@/lib/documents/access'

const hasAccess = await canAccessFullDocumentation(agent.id, user?.id, {
  is_premium: agent.is_premium,
  user_id: agent.user_id
})
```

---

## Common Patterns

### Creating an Agent with Documentation

```tsx
function CreateAgentForm() {
  const [content, setContent] = useState<JSONContent | null>(null)
  const [images, setImages] = useState<string[]>([])

  const handleSave = async (data) => {
    await createAgent({
      ...data,
      documentation_preview: content,
      documentation_full: content,
      documentation_preview_images: images,
      documentation_full_images: images,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSave)}>
      <DocumentEditor
        agentSlug={watch('slug')}
        onSave={(content, images) => {
          setContent(content)
          setImages(images)
        }}
      />
    </form>
  )
}
```

### Viewing Agent with Access Control

```tsx
function AgentDetailPage({ agent, user }) {
  const { data: hasAccess } = useQuery({
    queryKey: ['doc-access', agent.id, user?.id],
    queryFn: () => canAccessFullDocumentation(agent.id, user?.id, agent)
  })

  return (
    <>
      {hasAccess ? (
        <DocumentViewer content={agent.documentation_full} />
      ) : (
        <>
          <DocumentViewer content={agent.documentation_preview} />
          {agent.is_premium && (
            <PaywallBanner
              agentId={agent.id}
              agentName={agent.name}
              price={agent.price}
              currency={agent.currency}
            />
          )}
        </>
      )}
    </>
  )
}
```

### Upload and Edit Workflow

```tsx
function DocumentTab({ agentSlug }) {
  const [tab, setTab] = useState<'write' | 'upload'>('write')
  const [content, setContent] = useState<JSONContent | null>(null)

  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="write">Write</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="write">
          <DocumentEditor
            agentSlug={agentSlug}
            initialContent={content}
            onContentChange={setContent}
          />
        </TabsContent>

        <TabsContent value="upload">
          <DocumentUploader
            agentSlug={agentSlug}
            onConversionComplete={(content, images) => {
              setContent(content)
              setTab('write') // Switch to editor after upload
            }}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}
```

---

## Styling

All components use Tiptap's ProseMirror classes. Styles are defined in `src/app/globals.css` at the bottom of the file.

**Key classes:**
- `.ProseMirror` - Main editor/viewer container
- `.ProseMirror p`, `.ProseMirror h1`, etc. - Content elements
- `.document-viewer .ProseMirror` - Viewer-specific overrides

**Customization:**
Edit `globals.css` to change colors, spacing, fonts, etc. All styles use CSS variables from the theme system.

---

## Performance Tips

1. **Lazy Load**: Always use `dynamic` import with `ssr: false`
2. **Debounce**: Use auto-save with reasonable delay (3-5 seconds)
3. **Image Optimization**: Compress images before upload
4. **Content Size**: For very large docs (>1000 nodes), consider pagination

---

## Monetization Integration

See [MONETIZATION_GUIDE.md](../../docs/MONETIZATION_GUIDE.md) for complete setup instructions.

**Quick Summary:**
1. Set `is_premium: true` on agent
2. Set `price` and `currency`
3. Create Stripe checkout API route
4. PaywallBanner shows automatically
5. Access control enforced via RLS + `can_access_full_documentation()`

---

## Troubleshooting

**Editor not rendering?**
- Check that it's wrapped in `dynamic(() => import(...), { ssr: false })`
- Verify all Tiptap extensions are installed

**Images not uploading?**
- Ensure `agents-storage` storage bucket exists
- Check storage policies are applied
- Verify user is authenticated

**Styles not working?**
- Confirm `globals.css` includes Tiptap styles
- Check browser console for CSS errors

**Type errors?**
- Run `npm install` to ensure all packages are installed
- Regenerate Supabase types if schema changed

---

## Dependencies

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-table": "^2.x",
  "@tiptap/extension-image": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-text-align": "^2.x",
  "@tiptap/extension-task-list": "^2.x",
  "@tiptap/extension-task-item": "^2.x",
  "mammoth": "^1.x",
  "jszip": "^3.x",
  "react-to-pdf": "^2.x"
}
```

All dependencies are already installed if you followed the setup guide.
