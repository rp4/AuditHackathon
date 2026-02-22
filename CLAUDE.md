# CLAUDE.md

This file provides guidance to Claude Code agents (claude.ai/code) when working with code in this repository.

## Project Overview

OpenAuditSwarms is a **workflow template marketplace** for auditors. Users can create, share, and download visual workflow diagrams using a React Flow canvas. Exported workflows are compatible with AuditSwarm-GCP's import system. The platform is deployed on Google Cloud Platform (GCP) using Cloud Run, Cloud SQL (PostgreSQL), and Cloud Storage.

**Key Concept**: A "Swarm" is a workflow template consisting of connected step nodes that define an audit process flow.

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui and Radix UI
- **Workflow Canvas**: React Flow 11.x
- **State Management**: React Query (TanStack Query)
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

The application follows a simplified user-centric model:
- **Users** → **Swarms** (1:many) - Users create workflow templates
- **Users** → **Favorites/Ratings/Downloads** (many:many with Swarms) - Interaction tracking
- **Swarms** → **Comments** (1:many) - Threaded discussions
- **Swarms** → **Categories** (many:1) - Single category per swarm

**Swarm Model Fields:**
- `workflowNodes` - JSON string of React Flow nodes
- `workflowEdges` - JSON string of React Flow edges
- `workflowMetadata` - JSON string of metadata (phase, standard, framework)
- `workflowVersion` - Version string (default "1.0")

### Key Application Flows

1. **Swarm Creation Flow** (`/create`)
   - Canvas-first UI with React Flow WorkflowDesigner
   - Users add step nodes and connect them with edges
   - Form sidebar for name, description, category
   - JSON import for uploading existing workflows
   - Submit saves workflow data as JSON strings

2. **Swarm View Flow** (`/swarms/[slug]`)
   - Read-only React Flow canvas
   - Click nodes to view configuration in sidebar
   - Export to JSON for use in AuditSwarm-GCP
   - Favorite, rate, and comment functionality

3. **Browse & Discovery** (`/browse`)
   - Multi-select mode for bulk downloads
   - Category and search filtering
   - Combined JSON export for selected workflows

4. **Authentication Flow**
   - NextAuth.js with LinkedIn OAuth
   - Guest users can browse but not interact
   - Registered users can favorite, rate, comment, and create workflows

### Frontend Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── create/            # Workflow creation page
│   ├── browse/            # Browse/discover swarms
│   ├── swarms/[slug]/     # Swarm detail & edit pages
│   ├── admin/import/      # Bulk import page
│   └── api/               # API routes
│       ├── swarms/        # Swarm CRUD operations
│       ├── favorites/     # Favorite operations
│       ├── ratings/       # Rating operations
│       └── categories/    # Category operations
├── components/
│   ├── swarms/            # SwarmCard component
│   ├── workflows/         # React Flow components
│   │   └── shared/
│   │       ├── WorkflowDesigner.tsx
│   │       ├── nodes/StepNode.tsx
│   │       ├── edges/DeletableEdge.tsx
│   │       └── forms/StepNodeConfigForm.tsx
│   ├── ui/                # Shadcn/ui components
│   └── layouts/           # Layout components
├── hooks/
│   └── useSwarms.ts       # React Query hooks for swarms
├── lib/
│   ├── db/
│   │   ├── swarms.ts      # Swarm database operations
│   │   ├── favorites.ts   # Favorite operations
│   │   └── ratings.ts     # Rating operations
│   └── utils/             # Utility functions
└── types/
    └── workflow.ts        # Workflow TypeScript types
```

### Workflow Data Structure

**Node Structure (StepNode):**
```typescript
{
  id: string
  type: 'step'
  position: { x: number, y: number }
  data: {
    label: string
    description?: string
    instructions?: string
  }
}
```

**Export Format (AuditSwarm-GCP compatible):**
```json
{
  "version": "1.0",
  "data": {
    "workflows": [{
      "name": "Workflow Name",
      "description": "Description",
      "diagramJson": {
        "nodes": [...],
        "edges": [...],
        "metadata": {}
      }
    }]
  }
}
```

### State Management Patterns

- **Server State**: React Query (TanStack Query) for API data
- **Client State**: React useState for local UI state
- **Workflow State**: React Flow for canvas state
- **URL State**: Next.js router for shareable states

## Important Considerations

### Security
- All user inputs sanitized before database storage
- File uploads validated
- Rate limiting via Upstash Redis on API routes
- CSRF protection and security headers in middleware

### Performance
- Implement pagination (limit 50 items per page)
- Use Prisma's select queries efficiently
- Lazy load workflow canvas components
- Memoize React Flow node/edge components

### Workflow Canvas Tips
- Use `readOnly={true}` for view-only mode
- Pass `onNodeClick` handler for node selection
- Workflow data stored as JSON strings in database
- Parse/stringify when reading/writing workflow data

### SEO & Accessibility
- Server-side render public pages for SEO
- Implement proper meta tags for swarm pages
- Ensure keyboard navigation in workflow canvas
