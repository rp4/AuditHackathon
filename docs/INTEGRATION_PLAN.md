# Frontend-Backend Integration Plan

## Overview
This document outlines the step-by-step plan to integrate the Next.js frontend with the Supabase backend for OpenAuditSwarms.

---

## Phase 1: Database Setup & Type Generation

### Step 1.1: Run Database Schema
```bash
# Option A: Via Supabase Dashboard
# Copy supabase/schema.sql and run in SQL Editor

# Option B: Via CLI (recommended)
npx supabase db reset
```

### Step 1.2: Generate TypeScript Types
```bash
# Generate types from database
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Step 1.3: Configure Environment Variables
```bash
# Copy example env file if not done
cp .env.example .env.local

# Add your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Add LinkedIn OAuth (optional for now)
SUPABASE_AUTH_LINKEDIN_CLIENT_ID=your_client_id
SUPABASE_AUTH_LINKEDIN_SECRET=your_secret
```

**Verification**: Types should include all tables (agents, favorites, ratings, comments, etc.)

---

## Phase 2: Core Data Layer

### Step 2.1: Create Database Query Helpers
**File**: `src/lib/supabase/queries.ts`

Functions needed:
- `getAgents()` - Fetch agents with filters, sorting, pagination
- `getAgentBySlug()` - Get single agent with all relations
- `getUserProfile()` - Get user profile by username
- `getUserAgents()` - Get all agents by user
- `getCategories()` - Get all categories
- `getPlatforms()` - Get all platforms

### Step 2.2: Create Mutation Helpers
**File**: `src/lib/supabase/mutations.ts`

Functions needed:
- `createAgent()` - Create new agent
- `updateAgent()` - Update agent
- `deleteAgent()` - Delete agent
- `toggleFavorite()` - Add/remove favorite
- `createRating()` - Create or update rating
- `createComment()` - Create comment
- `updateComment()` - Update comment
- `deleteComment()` - Soft delete comment
- `trackDownload()` - Track agent download

### Step 2.3: Create Custom Hooks
**File**: `src/hooks/useAgents.ts`
- `useAgents()` - Fetch and cache agents list
- `useAgent()` - Fetch single agent
- `useUserFavorites()` - Get user's favorited agents
- `useAgentFavoriteStatus()` - Check if user favorited agent

**File**: `src/hooks/useRatings.ts`
- `useAgentRatings()` - Get all ratings for agent
- `useUserRating()` - Get user's rating for agent
- `useCreateRating()` - Mutation hook for rating

**File**: `src/hooks/useComments.ts`
- `useComments()` - Get comments for agent
- `useCreateComment()` - Create comment mutation
- `useUpdateComment()` - Update comment mutation

---

## Phase 3: Page-by-Page Integration

### Phase 3.1: Home Page (`src/app/page.tsx`)
**Current State**: Static mock data
**Target**:
- Fetch featured/trending agents from database
- Show real stats (ratings, downloads, favorites)
- Link to real agent pages

**Changes**:
1. Replace mock data with `getAgents({ isFeatured: true, limit: 3 })`
2. Update stats to use real `favorites_count`, `downloads_count`
3. Update links to use real agent slugs

### Phase 3.2: Browse Page (`src/app/browse/page.tsx`)
**Current State**: Client-side filtering of mock data
**Target**:
- Server-side filtering and pagination
- Real-time search
- Sort by favorites, ratings, recent

**Changes**:
1. Convert to server component for initial data
2. Use `useAgents()` hook with filters from URL params
3. Implement real search using PostgreSQL full-text search
4. Add pagination with Supabase `.range()`
5. Update platform/category filters to use real data

### Phase 3.3: Agent Detail Page (`src/app/agents/[id]/page.tsx`)
**Current State**: Static mock agent data
**Target**:
- Fetch agent by slug from database
- Show real markdown content
- Integrate favorites, ratings, comments
- Track views and downloads

**Changes**:
1. Fetch agent: `getAgentBySlug(params.id)`
2. Increment view count on page load
3. Implement favorite button with `toggleFavorite()`
4. Implement rating system with `useRatings()`
5. Implement comments section with `useComments()`
6. Track download when markdown is downloaded
7. Show related agents (same category/platform)

### Phase 3.4: Upload Page (`src/app/upload/page.tsx`)
**Current State**: Needs to be created/updated
**Target**:
- Multi-step form for agent upload
- Markdown editor for documentation
- Platform selection (multi-select)
- Category selection
- Tags input

**Changes**:
1. Create form with React Hook Form + Zod validation
2. Implement markdown editor (react-markdown-editor-lite or similar)
3. Handle platform selection from database
4. Upload to `createAgent()` mutation
5. Generate slug from agent name
6. Redirect to agent page on success

### Phase 3.5: Profile Page (`src/app/profile/[username]/page.tsx`)
**Current State**: Needs to be created
**Target**:
- Show user info
- List user's agents
- Show user's favorites
- Edit profile (if own profile)

**Changes**:
1. Create profile page component
2. Fetch user by username: `getUserProfile(username)`
3. Fetch user's agents: `getUserAgents(userId)`
4. Show tabs: "Agents", "Favorites", "Collections"
5. Add edit functionality for authenticated user's own profile

### Phase 3.6: Auth Callback Page (`src/app/auth/callback/route.ts`)
**Current State**: May exist, needs verification
**Target**:
- Handle LinkedIn OAuth redirect
- Create session
- Redirect to intended page

**Changes**:
1. Create API route to handle OAuth callback
2. Exchange code for session
3. Redirect user to /browse or original destination

---

## Phase 4: Feature Integration Details

### Feature 4.1: Favorites System

**Component**: `src/components/agents/FavoriteButton.tsx`
```tsx
interface FavoriteButtonProps {
  agentId: string
  initialFavorited: boolean
  favoritesCount: number
}
```

**Implementation**:
1. Show heart icon (filled if favorited)
2. On click: `toggleFavorite(agentId)`
3. Optimistic UI update
4. Show login prompt if not authenticated
5. Update favorites count

### Feature 4.2: Rating System

**Component**: `src/components/agents/RatingSection.tsx`
```tsx
interface RatingSectionProps {
  agentId: string
  averageRating: number
  totalRatings: number
  userRating?: number
}
```

**Implementation**:
1. Display star rating (read-only for others)
2. Allow authenticated users to rate (1-5 stars)
3. Optional review text
4. Show all reviews below
5. Allow user to edit/delete their own rating

### Feature 4.3: Comments System

**Component**: `src/components/agents/CommentsSection.tsx`
```tsx
interface CommentsSectionProps {
  agentId: string
}
```

**Implementation**:
1. Fetch comments with user profiles (JOIN)
2. Display nested/threaded comments
3. Reply functionality (parent_id)
4. Edit/delete own comments
5. Real-time updates (optional - Supabase Realtime)
6. Soft delete (is_deleted flag)

### Feature 4.4: Downloads Tracking

**Implementation**:
1. On "Download" button click:
   - Track download in database
   - Get user ID if authenticated, else NULL
   - Capture IP and User-Agent
   - Increment downloads_count via trigger
2. Generate markdown file
3. Trigger browser download

### Feature 4.5: Search & Filters

**Component**: `src/components/browse/SearchFilters.tsx`

**Implementation**:
1. Search input → URL param → Supabase full-text search
2. Category checkboxes → URL param → WHERE category_id
3. Platform checkboxes → URL param → JOIN agent_platforms
4. Rating filter → URL param → WHERE avg_rating >= X
5. Sort dropdown → URL param → ORDER BY

---

## Phase 5: Data Validation & Error Handling

### Step 5.1: Create Zod Schemas
**File**: `src/lib/validations/agent.ts`

```typescript
export const createAgentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  markdown_content: z.string().min(100),
  category_id: z.string().uuid(),
  platforms: z.array(z.string().uuid()).min(1),
  tags: z.array(z.string()).max(10),
  // ... other fields
})
```

### Step 5.2: Error Handling Patterns
1. **Network Errors**: Show toast notification
2. **Validation Errors**: Show inline field errors
3. **Auth Errors**: Redirect to login with return URL
4. **Not Found**: Show 404 page
5. **Server Errors**: Show error boundary

### Step 5.3: Loading States
1. **Page Loading**: Suspense with skeleton
2. **Button Loading**: Spinner in button
3. **Infinite Scroll**: Loading indicator at bottom
4. **Optimistic Updates**: Show immediately, revert on error

---

## Phase 6: Optimization

### Step 6.1: Caching Strategy
1. **React Query**: Cache agent list for 5 minutes
2. **Next.js**: Use `revalidate` for static pages
3. **Supabase**: Enable PostgREST response caching

### Step 6.2: Performance
1. **Lazy Loading**: Images, heavy components
2. **Pagination**: 20 items per page
3. **Infinite Scroll**: For browse page (optional)
4. **Debounce**: Search input (300ms)

### Step 6.3: SEO
1. **Metadata**: Generate from agent data
2. **OG Images**: Dynamic OG image generation
3. **Structured Data**: JSON-LD for agents
4. **Sitemap**: Generate from all public agents

---

## Phase 7: Testing Checklist

### Manual Testing
- [ ] Sign in with LinkedIn
- [ ] Browse agents with filters
- [ ] Search for agents
- [ ] View agent detail page
- [ ] Favorite an agent
- [ ] Rate an agent
- [ ] Comment on an agent
- [ ] Upload a new agent
- [ ] Edit own agent
- [ ] Delete own agent
- [ ] View own profile
- [ ] View other user's profile
- [ ] Download agent markdown

### Edge Cases
- [ ] Not authenticated - correct redirects
- [ ] Empty states - no agents, no comments
- [ ] Long content - markdown overflow
- [ ] Invalid slugs - 404 handling
- [ ] Duplicate favorites - prevented
- [ ] Concurrent updates - handled

### Performance
- [ ] Page load < 2s
- [ ] Search response < 500ms
- [ ] Infinite scroll smooth
- [ ] No layout shift

---

## Implementation Order (Recommended)

### Week 1: Foundation
1. ✅ Database schema created
2. Generate TypeScript types
3. Create query helpers (`queries.ts`)
4. Create mutation helpers (`mutations.ts`)
5. Create basic hooks

### Week 2: Core Pages
1. Integrate Browse page
2. Integrate Agent Detail page (read-only)
3. Implement favorites
4. Implement ratings (read-only)

### Week 3: Interactions
1. Implement rating creation
2. Implement comments
3. Implement search & filters
4. Add loading states

### Week 4: User Features
1. Create upload page
2. Create profile page
3. Add edit capabilities
4. Add delete functionality

### Week 5: Polish
1. Error handling
2. Validation
3. Loading states
4. SEO optimization
5. Testing

---

## Key Files to Create/Update

### New Files Needed:
```
src/
├── lib/
│   ├── supabase/
│   │   ├── queries.ts           ← Fetch data
│   │   └── mutations.ts         ← Modify data
│   └── validations/
│       └── agent.ts             ← Zod schemas
├── hooks/
│   ├── useAgents.ts             ← Agent queries
│   ├── useRatings.ts            ← Rating queries
│   ├── useComments.ts           ← Comment queries
│   └── useFavorites.ts          ← Favorite queries
├── components/
│   ├── agents/
│   │   ├── AgentCard.tsx        ← Update with real data
│   │   ├── AgentForm.tsx        ← Upload/edit form
│   │   ├── FavoriteButton.tsx   ← New
│   │   ├── RatingSection.tsx    ← New
│   │   └── CommentsSection.tsx  ← New
│   ├── browse/
│   │   └── SearchFilters.tsx    ← Update with real data
│   └── ui/
│       └── ... (shadcn components)
└── app/
    ├── auth/
    │   └── callback/
    │       └── route.ts         ← OAuth handler
    └── profile/
        └── [username]/
            └── page.tsx         ← New profile page
```

### Files to Update:
```
src/app/
├── page.tsx                     ← Add real data
├── browse/page.tsx              ← Add real data + filters
├── agents/[id]/page.tsx         ← Add all interactions
└── upload/page.tsx              ← Complete form
```

---

## Database Helper Functions Summary

### Queries (Read Operations)
| Function | Purpose | Returns |
|----------|---------|---------|
| `getAgents()` | List agents with filters | `Agent[]` |
| `getAgentBySlug()` | Get single agent | `Agent \| null` |
| `getAgentRatings()` | Get ratings for agent | `Rating[]` |
| `getAgentComments()` | Get comments (threaded) | `Comment[]` |
| `getUserProfile()` | Get profile by username | `Profile \| null` |
| `getUserFavorites()` | Get user's favorites | `Agent[]` |
| `getCategories()` | Get all categories | `Category[]` |
| `getPlatforms()` | Get all platforms | `Platform[]` |

### Mutations (Write Operations)
| Function | Purpose | Input |
|----------|---------|-------|
| `createAgent()` | Create agent | `AgentInsert` |
| `updateAgent()` | Update agent | `AgentUpdate` |
| `deleteAgent()` | Delete agent | `agentId` |
| `toggleFavorite()` | Add/remove favorite | `agentId` |
| `createRating()` | Rate agent | `{ agentId, score, review }` |
| `createComment()` | Add comment | `{ agentId, content, parentId? }` |
| `updateComment()` | Edit comment | `{ commentId, content }` |
| `deleteComment()` | Soft delete | `commentId` |
| `trackDownload()` | Track download | `agentId` |
| `incrementViews()` | Track view | `agentId` |

---

## Success Criteria

### Functionality
- ✅ Users can sign in with LinkedIn
- ✅ Users can browse and search agents
- ✅ Users can view agent details with markdown
- ✅ Users can favorite agents
- ✅ Users can rate and review agents
- ✅ Users can comment on agents
- ✅ Users can upload new agents
- ✅ Users can edit their own agents
- ✅ Users can view profiles

### Performance
- ✅ Initial page load < 2 seconds
- ✅ Navigation feels instant
- ✅ Search returns results < 500ms
- ✅ No cumulative layout shift

### Security
- ✅ RLS policies enforced
- ✅ Auth required for mutations
- ✅ Input validation on client and server
- ✅ XSS protection in markdown rendering

### UX
- ✅ Loading states on all async operations
- ✅ Error messages are helpful
- ✅ Optimistic UI updates
- ✅ Mobile responsive

---

## Next Steps

1. **Start with Phase 1**: Set up database and generate types
2. **Create helper functions**: Build the data layer
3. **Integrate one page at a time**: Start with browse page
4. **Test thoroughly**: Each feature before moving on
5. **Iterate**: Gather feedback and improve

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Query](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev/)
- [Shadcn/ui](https://ui.shadcn.com/)
