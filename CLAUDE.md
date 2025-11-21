# CLAUDE.md

This file provides guidance to Claude Code agents (claude.ai/code) when working with code in this repository.

## Project Overview

OpenAuditSwarms is an AI tool sharing platform for auditors. It allows auditors to share platform-agnostic AI tools (OpenAI, Google Gemini, Claude, LangChain, Copilot) with full documentation for recreation. The platform is deployed on Google Cloud Platform (GCP) using Cloud Run, Cloud SQL (PostgreSQL), and Cloud Storage.

**Terminology Note**: Throughout this codebase and documentation, the terms "agent" and "tool" are used interchangeably to refer to the same concept - AI assistants/configurations shared on the platform.

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui or Radix UI
- **State Management**: Zustand or Redux Toolkit
- **Forms**: React Hook Form with Zod validation

### Backend
- **Database**: Cloud SQL (PostgreSQL) with Prisma ORM
- **Authentication**: NextAuth.js with LinkedIn OAuth
- **Storage**: Google Cloud Storage
- **Hosting**: Google Cloud Run (containerized deployment)
- **Rate Limiting**: Upstash Redis

## Development Commands

### Initial Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure database URL, NextAuth, and GCP credentials in .env.local

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### Development
```bash
# Start development server
npm run dev

# Start Cloud SQL Proxy (for local development)
./cloud-sql-proxy --port 5432 toolbox-478717:us-central1:toolbox-db

# View Prisma Studio
npx prisma studio
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
npx prisma migrate dev --name <migration_name>

# Reset local database
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy

# Generate Prisma client after schema changes
npx prisma generate
```

### Build & Deploy
```bash
# Build for production
npm run build

# Build Docker image
docker build -t openauditswarms .

# Deploy to Cloud Run (via Cloud Build)
gcloud builds submit --config cloudbuild.yaml

# Or deploy directly
gcloud run deploy openauditswarms \
  --image gcr.io/toolbox-478717/openauditswarms \
  --region us-central1
```

## Architecture Overview

### Database Schema Structure

The application follows a user-centric model with these core relationships:
- **Users** → **Profiles** (1:1) - Extended user information
- **Users** → **Agents** (1:many) - Users create multiple tools
- **Users** → **Favorites/Ratings/Downloads** (many:many with Agents) - Interaction tracking
- **Agents** → **Comments** (1:many) - Threaded discussions
- **Users** → **Collections** → **Agents** (many:many) - Curated tool lists

**Note**: The platform uses **favorites** (saves) instead of upvotes for user engagement.

### Key Application Flows

1. **Tool Upload Flow**
   - Multi-step form captures platform-agnostic tool data
   - Stores configurations as JSONB for flexibility
   - Generates unique slug for URL routing
   - Files uploaded to Google Cloud Storage

2. **Discovery System**
   - Full-text search using PostgreSQL capabilities
   - Faceted filtering on platform, category, ratings
   - Sorting algorithms factor in recency, popularity, and quality

3. **Authentication Flow**
   - NextAuth.js with LinkedIn OAuth for professional networking
   - Guest users can browse but not interact
   - Registered users can save favorites, rate, comment, and create tools
   - Session-based authentication with JWT tokens

### Frontend Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth-required routes
│   ├── (public)/          # Public routes
│   └── api/               # API routes (if needed)
├── components/
│   ├── agents/            # Tool-related components
│   ├── ui/                # Shadcn/ui components
│   └── layouts/           # Layout components
├── lib/
│   ├── api/               # API utilities and helpers
│   ├── auth/              # Authentication configuration
│   ├── db/                # Database utilities and Prisma client
│   └── utils/             # Utility functions
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

### Database Configuration

The project uses Prisma ORM with PostgreSQL:
- Public read access for tools marked as `is_public`
- Authenticated write access for user's own content
- Cascading deletes for data integrity
- Optimized queries with selective field loading

### State Management Patterns

- **Server State**: React Query for API data fetching
- **Client State**: Zustand for UI state (modals, filters)
- **Form State**: React Hook Form for complex forms
- **URL State**: Next.js router for shareable states

## Important Considerations

### Security
- All user inputs must be sanitized before database storage
- File uploads validated and stored in Google Cloud Storage
- Rate limiting via Upstash Redis on all API routes
- CSRF protection and security headers in middleware
- Session-based authentication with secure cookies

### Performance
- Implement pagination (limit 20-50 items per page)
- Use Prisma's select queries efficiently (select only needed columns)
- Lazy load images and heavy components
- Cache tool data that doesn't change frequently

### Tool Data Structure
Tools store platform-specific configurations in JSONB format. Each platform has different requirements:
- **OpenAI**: Store complete assistant configuration JSON
- **Claude**: Store constitution/system prompts
- **Gemini**: Store model parameters and instructions
- **LangChain**: Store chain configuration and dependencies
- **Copilot**: Store extension settings

### SEO & Accessibility
- Server-side render public pages for SEO
- Implement proper meta tags for tool pages
- Ensure WCAG 2.1 AA compliance
- Add structured data for search engines