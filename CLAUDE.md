# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenAuditSwarms is an AI agent sharing platform for auditors. It allows auditors to share platform-agnostic AI agents (OpenAI, Google Gemini, Claude, LangChain, Copilot) with full documentation for recreation. The platform uses Supabase for backend/storage and Next.js for the frontend.

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui or Radix UI
- **State Management**: Zustand or Redux Toolkit
- **Forms**: React Hook Form with Zod validation

### Backend
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Edge Functions**: Supabase Edge Functions for serverless logic

## Development Commands

### Initial Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure Supabase URL and anon key in .env.local

# Run database migrations
npx supabase migration up

# Generate TypeScript types from database
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Development
```bash
# Start development server
npm run dev

# Start Supabase locally
npx supabase start

# Stop Supabase
npx supabase stop
```

### Testing & Quality
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run single test file
npm test -- path/to/test.spec.ts

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Database
```bash
# Create new migration
npx supabase migration new <migration_name>

# Reset local database
npx supabase db reset

# Push to production
npx supabase db push
```

### Build & Deploy
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel (automatic with git push)
git push origin main
```

## Architecture Overview

### Database Schema Structure

The application follows a user-centric model with these core relationships:
- **Users** → **Profiles** (1:1) - Extended user information
- **Users** → **Agents** (1:many) - Users create multiple agents
- **Users** → **Favorites/Ratings/Downloads** (many:many with Agents) - Interaction tracking
- **Agents** → **Comments** (1:many) - Threaded discussions
- **Users** → **Collections** → **Agents** (many:many) - Curated agent lists

**Note**: The platform uses **favorites** (saves) instead of upvotes for user engagement.

### Key Application Flows

1. **Agent Upload Flow**
   - Multi-step form captures platform-agnostic agent data
   - Stores configurations as JSONB for flexibility
   - Generates unique slug for URL routing
   - Triggers RLS policies for ownership

2. **Discovery System**
   - Full-text search using Supabase's PostgreSQL capabilities
   - Faceted filtering on platform, category, ratings
   - Sorting algorithms factor in recency, popularity, and quality

3. **Authentication Flow**
   - Supabase Auth with LinkedIn OAuth (OIDC) for professional networking
   - Guest users can browse but not interact
   - Registered users can save favorites, rate, comment, and create agents
   - RLS policies enforce access control at database level

### Frontend Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth-required routes
│   ├── (public)/          # Public routes
│   └── api/               # API routes (if needed)
├── components/
│   ├── agents/            # Agent-related components
│   ├── ui/                # Shadcn/ui components
│   └── layouts/           # Layout components
├── lib/
│   ├── supabase/          # Supabase client and helpers
│   └── utils/             # Utility functions
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

### Supabase Configuration

The project uses Supabase's Row Level Security (RLS) extensively:
- Public read access for agents marked as `is_public`
- Authenticated write access for user's own content
- Cascading deletes for data integrity
- Real-time subscriptions for live updates

### State Management Patterns

- **Server State**: React Query/SWR for Supabase data
- **Client State**: Zustand for UI state (modals, filters)
- **Form State**: React Hook Form for complex forms
- **URL State**: Next.js router for shareable states

## Important Considerations

### Security
- All user inputs must be sanitized before database storage
- File uploads should validate MIME types and scan for malware
- Rate limiting on API routes and Supabase Edge Functions
- Implement CAPTCHA for signup and agent upload

### Performance
- Implement pagination (limit 20-50 items per page)
- Use Supabase's query builders efficiently (select only needed columns)
- Lazy load images and heavy components
- Cache agent data that doesn't change frequently

### Agent Data Structure
Agents store platform-specific configurations in JSONB format. Each platform has different requirements:
- **OpenAI**: Store complete assistant configuration JSON
- **Claude**: Store constitution/system prompts
- **Gemini**: Store model parameters and instructions
- **LangChain**: Store chain configuration and dependencies
- **Copilot**: Store extension settings

### SEO & Accessibility
- Server-side render public pages for SEO
- Implement proper meta tags for agent pages
- Ensure WCAG 2.1 AA compliance
- Add structured data for search engines