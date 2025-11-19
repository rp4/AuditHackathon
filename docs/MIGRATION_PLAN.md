# OpenAuditSwarms Migration Plan
## Complete Rebuild: Supabase → GCP Stack with PostgreSQL + NextAuth

### Document Version: 1.0
### Date: November 2024
### Estimated Timeline: 7-10 days

---

## 📋 Executive Summary

### Current State
- **Stack**: Supabase (PostgreSQL + Auth + Storage) + Vercel
- **Issues**: Data loading bugs, auth session problems, overly complex client singleton
- **Codebase**: 73 TypeScript files, 51 with Supabase imports
- **UI Components**: ~2,894 lines to preserve

### Target State
- **Stack**: Cloud SQL PostgreSQL + NextAuth.js + Cloud Storage + Cloud Run
- **Benefits**: Full control, better debugging, native LinkedIn OAuth, no external auth service
- **Cost**: ~$44/month (similar to current)
- **Timeline**: 7-10 days (no data migration needed)

### Key Changes
1. **Rename**: All "agent" references → "tool"
2. **Database**: Supabase PostgreSQL → Cloud SQL PostgreSQL
3. **ORM**: Supabase Client → Prisma
4. **Auth**: Supabase Auth → NextAuth.js
5. **Storage**: Supabase Storage → Google Cloud Storage
6. **Hosting**: Vercel → Cloud Run

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)             │
│   • Keep all UI components               │
│   • Update data fetching hooks           │
│   • Rename agents → tools                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         NextAuth.js                      │
│   • LinkedIn OAuth (production)          │
│   • Email/password (development)         │
│   • Session management (JWT)             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Cloud SQL PostgreSQL + Prisma         │
│   • All application data                 │
│   • Full-text search built-in           │
│   • Type-safe queries                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       Google Cloud Storage               │
│   • User avatars                         │
│   • Tool files & documentation           │
│   • Signed URLs for security             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Cloud Run                       │
│   • Serverless container hosting         │
│   • Auto-scaling                         │
│   • Built-in CI/CD                      │
└─────────────────────────────────────────┘
```

---

## 📁 What We Keep vs What We Rebuild

### ✅ **KEEP** (No Changes)
```
src/components/ui/           # All Shadcn/Radix components
src/styles/globals.css        # Design system
tailwind.config.ts           # Tailwind configuration
postcss.config.js            # PostCSS config
next.config.js               # Next.js config (minor updates)
package.json                 # Dependencies (updates only)
```

### ✏️ **UPDATE** (Minor Changes)
```
src/components/agents/       → src/components/tools/     # Rename
src/app/agents/             → src/app/tools/            # Rename routes
src/components/layouts/      # Update auth checks
src/components/documents/    # Update storage calls
src/components/profile/      # Update storage calls
```

### 🔨 **REBUILD** (From Scratch)
```
src/lib/supabase/           → DELETE (replace with new structure)
src/hooks/useAgents.ts      → src/hooks/useTools.ts (rebuild)
src/types/database.ts       → Rebuild with Prisma types
src/lib/validations/        → Rebuild with Zod
src/app/api/                → New API routes
prisma/                     → NEW (database schema)
```

### ❌ **DELETE** (Not Needed)
```
supabase/                   # All Supabase files
src/components/DebugPanel.tsx
src/app/api/debug/
src/app/api/dev-auth/
src/app/dev-login/
scripts/                    # Old migration scripts
```

---

## 🗓️ Implementation Phases

### **Phase 1: Project Setup & Configuration** (Day 1)

#### 1.1 Create GCP Project
```bash
# Create new GCP project
gcloud projects create openauditswarms --name="OpenAuditSwarms"
gcloud config set project openauditswarms

# Enable required APIs
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

#### 1.2 Set Up Cloud SQL
```bash
# Create Cloud SQL instance (db-g1-small: 1.7GB RAM, ~$26/month)
gcloud sql instances create openauditswarms-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1 \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4

# Create database
gcloud sql databases create openauditswarms \
  --instance=openauditswarms-db

# Create user
gcloud sql users create appuser \
  --instance=openauditswarms-db \
  --password=$(openssl rand -base64 32)

# Note the password for later use
```

#### 1.3 Set Up Cloud Storage
```bash
# Create storage bucket
gsutil mb -p openauditswarms \
  -c standard \
  -l us-central1 \
  -b on \
  gs://openauditswarms-storage/

# Create folder structure
gsutil -m mkdir \
  gs://openauditswarms-storage/avatars \
  gs://openauditswarms-storage/tools \
  gs://openauditswarms-storage/temp

# Set up CORS for browser uploads
cat > cors.json << EOF
[
  {
    "origin": ["http://localhost:3000", "https://yourdomain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set cors.json gs://openauditswarms-storage

# Set up lifecycle policy (delete temp files after 1 day)
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 1,
          "matchesPrefix": ["temp/"]
        }
      }
    ]
  }
}
EOF
gsutil lifecycle set lifecycle.json gs://openauditswarms-storage
```

#### 1.4 LinkedIn OAuth Setup
1. Go to https://www.linkedin.com/developers/apps
2. Click **Create app**
3. Fill in details:
   - **App name**: OpenAuditSwarms
   - **LinkedIn Page**: (your company page or create one)
   - **Privacy policy URL**: https://yourdomain.com/privacy
   - **App logo**: Upload your logo
4. Go to **Auth** tab
5. Add **Authorized redirect URLs**:
   - Development: `http://localhost:3000/api/auth/callback/linkedin`
   - Production: `https://yourdomain.com/api/auth/callback/linkedin`
6. Request **Sign In with LinkedIn using OpenID Connect** product access
7. Wait for approval (usually instant for OpenID Connect)
8. Copy **Client ID** and **Client Secret**

#### 1.5 Initialize Local Project
```bash
# Create migration branch
git checkout -b migration-gcp

# Remove Supabase dependencies
npm uninstall @supabase/supabase-js @supabase/ssr

# Install new dependencies
npm install \
  @prisma/client@^5.20.0 \
  prisma@^5.20.0 \
  next-auth@^4.24.0 \
  @auth/prisma-adapter@^1.5.0 \
  @google-cloud/storage@^7.13.0 \
  bcryptjs@^2.4.3 \
  zod@^3.23.0 \
  @types/bcryptjs@^2.4.6

# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env (with DATABASE_URL placeholder)
```

---

### **Phase 2: Database Schema & Configuration** (Day 2)

#### 2.1 Create Prisma Schema

Replace the contents of `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// NEXTAUTH TABLES
// ============================================

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ============================================
// USER & AUTHENTICATION
// ============================================

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  emailVerified   DateTime? @map("email_verified")
  username        String    @unique
  fullName        String    @map("full_name")
  passwordHash    String?   @map("password_hash") // For dev credentials provider
  bio             String?   @db.Text
  avatarUrl       String?   @map("avatar_url")
  website         String?
  githubUrl       String?   @map("github_url")
  linkedinUrl     String?   @map("linkedin_url")

  // Reputation system
  reputationScore Int       @default(0) @map("reputation_score")
  isVerified      Boolean   @default(false) @map("is_verified")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // NextAuth relations
  accounts        Account[]
  sessions        Session[]

  // App relations
  tools           Tool[]
  favorites       Favorite[]
  ratings         Rating[]
  comments        Comment[]
  collections     Collection[]

  @@map("users")
}

// ============================================
// TOOLS (formerly agents)
// ============================================

model Tool {
  id          String   @id @default(cuid())
  slug        String   @unique
  userId      String   @map("user_id")
  name        String
  description String   @db.Text

  // Category relationship
  categoryId  String?  @map("category_id")
  category    Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  // Configuration stored as JSON
  instructions              Json     @default("{}") @db.JsonB
  configuration             Json     @default("{}") @db.JsonB
  sampleInputs              Json     @default("[]") @db.JsonB @map("sample_inputs")
  sampleOutputs             Json     @default("[]") @db.JsonB @map("sample_outputs")
  prerequisites             String[] @default([])

  // Documentation
  markdownContent           String?  @db.Text @map("markdown_content")
  markdownFileUrl           String?  @map("markdown_file_url")
  documentationSearchableText String? @db.Text @map("documentation_searchable_text")

  // Metadata
  version          String   @default("1.0.0")
  isPublic         Boolean  @default(true) @map("is_public")
  isFeatured       Boolean  @default(false) @map("is_featured")
  isDeleted        Boolean  @default(false) @map("is_deleted")
  complexityLevel  String?  @map("complexity_level") // 'beginner' | 'intermediate' | 'advanced'
  estimatedTokens  Int?     @map("estimated_tokens")
  estimatedCost    Decimal? @map("estimated_cost") @db.Decimal(10, 4)
  tags             String[] @default([])

  // Stats (updated by triggers/app logic)
  favoritesCount Int @default(0) @map("favorites_count")
  downloadsCount Int @default(0) @map("downloads_count")
  viewsCount     Int @default(0) @map("views_count")

  // Timestamps
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  publishedAt DateTime? @map("published_at")

  // Relations
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  platforms       ToolPlatform[]
  favorites       Favorite[]
  ratings         Rating[]
  comments        Comment[]
  downloads       Download[]
  versions        ToolVersion[]
  collectionTools CollectionTool[]

  // Indexes
  @@index([userId])
  @@index([categoryId])
  @@index([slug])
  @@index([isPublic, isDeleted, createdAt(sort: Desc)])
  @@index([isPublic, isDeleted, favoritesCount(sort: Desc)])
  @@index([isPublic, isDeleted, downloadsCount(sort: Desc)])
  @@index([tags])
  @@map("tools")
}

// ============================================
// CATEGORIES & PLATFORMS
// ============================================

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?  @db.Text
  icon        String?
  orderIndex  Int      @default(0) @map("order_index")
  createdAt   DateTime @default(now()) @map("created_at")

  tools Tool[]

  @@map("categories")
}

model Platform {
  id               String   @id @default(cuid())
  name             String   @unique
  slug             String   @unique
  description      String?  @db.Text
  icon             String?
  documentationUrl String?  @map("documentation_url")
  createdAt        DateTime @default(now()) @map("created_at")

  tools ToolPlatform[]

  @@map("platforms")
}

// Junction table for many-to-many relationship
model ToolPlatform {
  toolId     String @map("tool_id")
  platformId String @map("platform_id")
  config     Json   @default("{}") @db.JsonB // Platform-specific config

  tool     Tool     @relation(fields: [toolId], references: [id], onDelete: Cascade)
  platform Platform @relation(fields: [platformId], references: [id], onDelete: Cascade)

  @@id([toolId, platformId])
  @@map("tool_platforms")
}

// ============================================
// USER INTERACTIONS
// ============================================

model Favorite {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  toolId    String   @map("tool_id")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  tool Tool @relation(fields: [toolId], references: [id], onDelete: Cascade)

  @@unique([userId, toolId])
  @@index([userId, createdAt(sort: Desc)])
  @@index([toolId, createdAt(sort: Desc)])
  @@map("favorites")
}

model Rating {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  toolId    String   @map("tool_id")
  score     Int      // 1-5
  review    String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  tool Tool @relation(fields: [toolId], references: [id], onDelete: Cascade)

  @@unique([userId, toolId])
  @@index([toolId, createdAt(sort: Desc)])
  @@map("ratings")
}

model Download {
  id           String   @id @default(cuid())
  userId       String?  @map("user_id") // Nullable for anonymous downloads
  toolId       String   @map("tool_id")
  ipAddress    String?  @map("ip_address") @db.Inet
  userAgent    String?  @map("user_agent")
  downloadedAt DateTime @default(now()) @map("downloaded_at")

  tool Tool @relation(fields: [toolId], references: [id], onDelete: Cascade)

  @@index([toolId, downloadedAt(sort: Desc)])
  @@map("downloads")
}

model Comment {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  toolId    String   @map("tool_id")
  parentId  String?  @map("parent_id")
  content   String   @db.Text
  isEdited  Boolean  @default(false) @map("is_edited")
  isDeleted Boolean  @default(false) @map("is_deleted")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tool    Tool      @relation(fields: [toolId], references: [id], onDelete: Cascade)
  parent  Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies Comment[] @relation("CommentReplies")

  @@index([toolId, createdAt])
  @@index([parentId])
  @@map("comments")
}

// ============================================
// COLLECTIONS
// ============================================

model Collection {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  name        String
  description String?  @db.Text
  slug        String   @unique
  isPublic    Boolean  @default(true) @map("is_public")
  isFeatured  Boolean  @default(false) @map("is_featured")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user  User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  tools CollectionTool[]

  @@index([userId])
  @@map("collections")
}

model CollectionTool {
  collectionId String   @map("collection_id")
  toolId       String   @map("tool_id")
  notes        String?  @db.Text
  addedAt      DateTime @default(now()) @map("added_at")

  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  tool       Tool       @relation(fields: [toolId], references: [id], onDelete: Cascade)

  @@id([collectionId, toolId])
  @@map("collection_tools")
}

// ============================================
// TOOL VERSIONS
// ============================================

model ToolVersion {
  id            String   @id @default(cuid())
  toolId        String   @map("tool_id")
  version       String
  changeNotes   String?  @map("change_notes") @db.Text
  configuration Json     @default("{}") @db.JsonB
  createdAt     DateTime @default(now()) @map("created_at")

  tool Tool @relation(fields: [toolId], references: [id], onDelete: Cascade)

  @@index([toolId, createdAt(sort: Desc)])
  @@map("tool_versions")
}
```

#### 2.2 Environment Variables

Create/update `.env.local`:

```bash
# Database (use Cloud SQL Proxy for local dev)
DATABASE_URL="postgresql://appuser:YOUR_PASSWORD@localhost:5432/openauditswarms?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="GENERATE_THIS_WITH_OPENSSL_RAND_BASE64_32"

# LinkedIn OAuth
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# GCP
GCP_PROJECT_ID="openauditswarms"
GCS_BUCKET_NAME="openauditswarms-storage"

# For local development (service account JSON)
GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
```

Generate NextAuth secret:
```bash
openssl rand -base64 32
```

#### 2.3 Create Service Account for Local Development

```bash
# Create service account
gcloud iam service-accounts create openauditswarms-dev \
  --display-name="OpenAuditSwarms Development"

# Grant permissions
gcloud projects add-iam-policy-binding openauditswarms \
  --member="serviceAccount:openauditswarms-dev@openauditswarms.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding openauditswarms \
  --member="serviceAccount:openauditswarms-dev@openauditswarms.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Download key
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=openauditswarms-dev@openauditswarms.iam.gserviceaccount.com

# Add to .gitignore
echo "service-account-key.json" >> .gitignore
```

#### 2.4 Run Migrations

```bash
# Install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Start Cloud SQL Proxy (keep running in separate terminal)
./cloud-sql-proxy openauditswarms:us-central1:openauditswarms-db

# In another terminal, create and run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

#### 2.5 Seed Database

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Categories
  const categories = [
    { name: 'Financial Audit', slug: 'financial-audit', description: 'Tools for financial auditing and accounting', orderIndex: 1 },
    { name: 'Compliance', slug: 'compliance', description: 'Regulatory compliance and standards checking', orderIndex: 2 },
    { name: 'Risk Assessment', slug: 'risk-assessment', description: 'Risk analysis and management tools', orderIndex: 3 },
    { name: 'Internal Controls', slug: 'internal-controls', description: 'Internal control testing and evaluation', orderIndex: 4 },
    { name: 'Data Analysis', slug: 'data-analysis', description: 'Data analytics and visualization tools', orderIndex: 5 },
    { name: 'Report Generation', slug: 'report-generation', description: 'Automated report generation and documentation', orderIndex: 6 },
    { name: 'Process Automation', slug: 'process-automation', description: 'Workflow and process automation tools', orderIndex: 7 },
    { name: 'Document Review', slug: 'document-review', description: 'Document analysis and review tools', orderIndex: 8 },
    { name: 'Other', slug: 'other', description: 'Miscellaneous audit tools', orderIndex: 999 },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  console.log('✅ Categories seeded')

  // Seed Platforms
  const platforms = [
    { name: 'OpenAI', slug: 'openai', description: 'OpenAI GPT models and assistants', documentationUrl: 'https://platform.openai.com/docs' },
    { name: 'Claude', slug: 'claude', description: 'Anthropic Claude AI', documentationUrl: 'https://docs.anthropic.com' },
    { name: 'Google Gemini', slug: 'gemini', description: 'Google Gemini AI models', documentationUrl: 'https://ai.google.dev/docs' },
    { name: 'LangChain', slug: 'langchain', description: 'LangChain framework agents', documentationUrl: 'https://docs.langchain.com' },
    { name: 'GitHub Copilot', slug: 'copilot', description: 'GitHub Copilot extensions', documentationUrl: 'https://docs.github.com/copilot' },
    { name: 'Other', slug: 'other', description: 'Other AI platforms and custom implementations', documentationUrl: null },
  ]

  for (const platform of platforms) {
    await prisma.platform.upsert({
      where: { slug: platform.slug },
      update: {},
      create: platform,
    })
  }

  console.log('✅ Platforms seeded')
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run seed:
```bash
npm install -D tsx
npx prisma db seed
```

---

### **Phase 3: Core Libraries Implementation** (Day 3)

#### 3.1 Project Structure

Create the following directory structure:

```bash
mkdir -p src/lib/{auth,prisma,storage,db}
mkdir -p src/hooks
mkdir -p src/app/api/auth/\[...nextauth\]
```

#### 3.2 Prisma Client

Create `src/lib/prisma/client.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

#### 3.3 NextAuth Configuration

Create `src/lib/auth/config.ts`:

```typescript
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import LinkedInProvider from 'next-auth/providers/linkedin'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma/client'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // Production: LinkedIn OAuth
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          username: profile.email?.split('@')[0] || `user-${Date.now()}`,
          fullName: profile.name || profile.email?.split('@')[0] || 'User',
          avatarUrl: profile.picture,
          linkedinUrl: profile.profile,
        }
      },
    }),

    // Development: Email/Password
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials')
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id
        token.username = user.username
        token.email = user.email
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string
        session.user.username = token.username as string
        session.user.email = token.email as string
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  secret: process.env.NEXTAUTH_SECRET,
}
```

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

#### 3.4 TypeScript Types

Update `src/types/database.ts`:

```typescript
import type { Prisma } from '@prisma/client'

// Export Prisma types
export type Tool = Prisma.ToolGetPayload<{
  include: {
    user: {
      select: {
        id: true
        username: true
        fullName: true
        avatarUrl: true
      }
    }
    category: true
    platforms: {
      include: {
        platform: true
      }
    }
  }
}>

export type User = Prisma.UserGetPayload<{}>
export type Category = Prisma.CategoryGetPayload<{}>
export type Platform = Prisma.PlatformGetPayload<{}>
export type Rating = Prisma.RatingGetPayload<{
  include: {
    user: {
      select: {
        username: true
        fullName: true
        avatarUrl: true
      }
    }
  }
}>

export type Comment = Prisma.CommentGetPayload<{
  include: {
    user: {
      select: {
        username: true
        fullName: true
        avatarUrl: true
      }
    }
  }
}>

// API parameter types
export interface GetToolsParams {
  search?: string
  categoryId?: string
  platformSlugs?: string[]
  userId?: string
  sortBy?: 'recent' | 'popular' | 'rating' | 'favorites'
  limit?: number
  offset?: number
}
```

Update NextAuth types in `src/types/next-auth.d.ts`:

```typescript
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      email: string
    } & DefaultSession['user']
  }

  interface User {
    username: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    username: string
  }
}
```

#### 3.5 Storage Client

Create `src/lib/storage/client.ts`:

```typescript
import { Storage } from '@google-cloud/storage'

let storageClient: Storage | null = null

export function getStorageClient() {
  if (!storageClient) {
    storageClient = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      // In production, uses Application Default Credentials
      // In development, uses GOOGLE_APPLICATION_CREDENTIALS
    })
  }
  return storageClient
}

export const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'openauditswarms-storage'
```

Create `src/lib/storage/signed-urls.ts`:

```typescript
import { getStorageClient, BUCKET_NAME } from './client'

export async function generateSignedUploadUrl(
  path: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const storage = getStorageClient()
  const bucket = storage.bucket(BUCKET_NAME)
  const file = bucket.file(path)

  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresIn * 1000,
    contentType,
  })

  return signedUrl
}

export async function generateSignedDownloadUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const storage = getStorageClient()
  const bucket = storage.bucket(BUCKET_NAME)
  const file = bucket.file(path)

  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresIn * 1000,
  })

  return signedUrl
}

export function getPublicUrl(path: string): string {
  return `https://storage.googleapis.com/${BUCKET_NAME}/${path}`
}

export async function deleteFile(path: string): Promise<void> {
  const storage = getStorageClient()
  const bucket = storage.bucket(BUCKET_NAME)
  await bucket.file(path).delete()
}
```

---

### **Phase 4: Data Layer & API Routes** (Day 4-5)

#### 4.1 Database Operations

Create `src/lib/db/tools.ts`:

```typescript
import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@prisma/client'
import type { GetToolsParams } from '@/types/database'

export async function getTools(params: GetToolsParams = {}) {
  const {
    search,
    categoryId,
    platformSlugs,
    userId,
    sortBy = 'recent',
    limit = 20,
    offset = 0,
  } = params

  const where: Prisma.ToolWhereInput = {
    isPublic: true,
    isDeleted: false,
    ...(userId && { userId }),
    ...(categoryId && { categoryId }),
    ...(platformSlugs && platformSlugs.length > 0 && {
      platforms: {
        some: {
          platform: {
            slug: { in: platformSlugs },
          },
        },
      },
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { documentationSearchableText: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const orderBy: Prisma.ToolOrderByWithRelationInput =
    sortBy === 'recent'
      ? { createdAt: 'desc' }
      : sortBy === 'popular'
      ? { downloadsCount: 'desc' }
      : sortBy === 'rating'
      ? { favoritesCount: 'desc' }
      : sortBy === 'favorites'
      ? { favoritesCount: 'desc' }
      : { createdAt: 'desc' }

  return prisma.tool.findMany({
    where,
    orderBy,
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      category: true,
      platforms: {
        include: {
          platform: true,
        },
      },
    },
  })
}

export async function getToolBySlug(slug: string) {
  return prisma.tool.findUnique({
    where: { slug },
    include: {
      user: true,
      category: true,
      platforms: {
        include: {
          platform: true,
        },
      },
      ratings: {
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      comments: {
        where: { isDeleted: false, parentId: null },
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          replies: {
            where: { isDeleted: false },
            include: {
              user: {
                select: {
                  username: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function getToolById(id: string) {
  return prisma.tool.findUnique({
    where: { id },
    include: {
      user: true,
      category: true,
      platforms: {
        include: {
          platform: true,
        },
      },
    },
  })
}

export async function createTool(data: Prisma.ToolCreateInput) {
  return prisma.tool.create({
    data,
    include: {
      user: true,
      category: true,
      platforms: {
        include: {
          platform: true,
        },
      },
    },
  })
}

export async function updateTool(id: string, data: Prisma.ToolUpdateInput) {
  return prisma.tool.update({
    where: { id },
    data,
    include: {
      user: true,
      category: true,
      platforms: {
        include: {
          platform: true,
        },
      },
    },
  })
}

export async function deleteTool(id: string) {
  // Soft delete
  return prisma.tool.update({
    where: { id },
    data: { isDeleted: true },
  })
}

export async function incrementToolViews(id: string) {
  return prisma.tool.update({
    where: { id },
    data: {
      viewsCount: {
        increment: 1,
      },
    },
  })
}
```

Create `src/lib/db/users.ts`:

```typescript
import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@prisma/client'

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  })
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id },
    data,
  })
}

export async function getUserTools(userId: string, limit = 20) {
  return prisma.tool.findMany({
    where: {
      userId,
      isDeleted: false,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      category: true,
      platforms: {
        include: {
          platform: true,
        },
      },
    },
  })
}
```

Create `src/lib/db/favorites.ts`:

```typescript
import { prisma } from '@/lib/prisma/client'

export async function toggleFavorite(userId: string, toolId: string) {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_toolId: {
        userId,
        toolId,
      },
    },
  })

  if (existing) {
    // Remove favorite
    await prisma.favorite.delete({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
    })
    return { favorited: false }
  } else {
    // Add favorite
    await prisma.favorite.create({
      data: {
        userId,
        toolId,
      },
    })
    return { favorited: true }
  }
}

export async function checkFavorite(userId: string, toolId: string) {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_toolId: {
        userId,
        toolId,
      },
    },
  })

  return !!favorite
}

export async function getUserFavorites(userId: string, limit = 20) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      tool: {
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          category: true,
          platforms: {
            include: {
              platform: true,
            },
          },
        },
      },
    },
  })
}
```

Create `src/lib/db/ratings.ts`:

```typescript
import { prisma } from '@/lib/prisma/client'

export async function upsertRating(
  userId: string,
  toolId: string,
  score: number,
  review?: string
) {
  return prisma.rating.upsert({
    where: {
      userId_toolId: {
        userId,
        toolId,
      },
    },
    update: {
      score,
      review,
    },
    create: {
      userId,
      toolId,
      score,
      review,
    },
  })
}

export async function getUserRating(userId: string, toolId: string) {
  return prisma.rating.findUnique({
    where: {
      userId_toolId: {
        userId,
        toolId,
      },
    },
  })
}

export async function getToolRatings(toolId: string, limit = 10) {
  return prisma.rating.findMany({
    where: { toolId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  })
}

export async function calculateAverageRating(toolId: string) {
  const result = await prisma.rating.aggregate({
    where: { toolId },
    _avg: {
      score: true,
    },
    _count: true,
  })

  return {
    averageRating: result._avg.score || 0,
    totalRatings: result._count,
  }
}
```

Create `src/lib/db/categories.ts`:

```typescript
import { prisma } from '@/lib/prisma/client'

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { orderIndex: 'asc' },
  })
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
  })
}
```

Create `src/lib/db/platforms.ts`:

```typescript
import { prisma } from '@/lib/prisma/client'

export async function getPlatforms() {
  return prisma.platform.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getPlatformBySlug(slug: string) {
  return prisma.platform.findUnique({
    where: { slug },
  })
}
```

#### 4.2 API Routes

Create `src/app/api/tools/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getTools, createTool } from '@/lib/db/tools'
import { z } from 'zod'

// GET /api/tools - Get tools with filters
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams

    const params = {
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      platformSlugs: searchParams.get('platformSlugs')?.split(',') || undefined,
      userId: searchParams.get('userId') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'recent',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const tools = await getTools(params)
    return NextResponse.json(tools)
  } catch (error) {
    console.error('Error fetching tools:', error)
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
  }
}

// POST /api/tools - Create new tool
const createToolSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  categoryId: z.string().optional(),
  platformIds: z.array(z.string()),
  configuration: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createToolSchema.parse(body)

    const tool = await createTool({
      name: validated.name,
      slug: validated.slug,
      description: validated.description,
      user: { connect: { id: session.user.id } },
      ...(validated.categoryId && {
        category: { connect: { id: validated.categoryId } },
      }),
      configuration: validated.configuration || {},
      tags: validated.tags || [],
      platforms: {
        create: validated.platformIds.map((platformId) => ({
          platform: { connect: { id: platformId } },
        })),
      },
    })

    return NextResponse.json(tool, { status: 201 })
  } catch (error) {
    console.error('Error creating tool:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 })
  }
}
```

Create `src/app/api/tools/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getToolById, updateTool, deleteTool } from '@/lib/db/tools'

// GET /api/tools/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tool = await getToolById(params.id)
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }
    return NextResponse.json(tool)
  } catch (error) {
    console.error('Error fetching tool:', error)
    return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 })
  }
}

// PUT /api/tools/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tool = await getToolById(params.id)
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    if (tool.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const updated = await updateTool(params.id, body)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating tool:', error)
    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 })
  }
}

// DELETE /api/tools/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tool = await getToolById(params.id)
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    if (tool.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteTool(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tool:', error)
    return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 })
  }
}
```

Create `src/app/api/favorites/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { toggleFavorite, getUserFavorites } from '@/lib/db/favorites'

// POST /api/favorites - Toggle favorite
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { toolId } = await req.json()
    const result = await toggleFavorite(session.user.id, toolId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 })
  }
}

// GET /api/favorites - Get user's favorites
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const favorites = await getUserFavorites(session.user.id)
    return NextResponse.json(favorites)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}
```

Create `src/app/api/categories/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/db/categories'

export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
```

Create `src/app/api/platforms/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getPlatforms } from '@/lib/db/platforms'

export async function GET() {
  try {
    const platforms = await getPlatforms()
    return NextResponse.json(platforms)
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 })
  }
}
```

Create `src/app/api/upload/signed-url/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { generateSignedUploadUrl } from '@/lib/storage/signed-urls'
import { z } from 'zod'

const schema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  path: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { fileName, contentType, path } = schema.parse(body)

    // Generate unique path
    const timestamp = Date.now()
    const filePath = `${path}/${timestamp}-${fileName}`

    const uploadUrl = await generateSignedUploadUrl(filePath, contentType)

    return NextResponse.json({
      uploadUrl,
      path: filePath,
    })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
```

---

### **Phase 5: React Hooks** (Day 5)

Create `src/hooks/useAuth.ts`:

```typescript
'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    loading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}
```

Create `src/hooks/useTools.ts`:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import type { GetToolsParams } from '@/types/database'

export function useTools(params: GetToolsParams = {}) {
  return useQuery({
    queryKey: ['tools', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      if (params.search) searchParams.set('search', params.search)
      if (params.categoryId) searchParams.set('categoryId', params.categoryId)
      if (params.platformSlugs?.length) {
        searchParams.set('platformSlugs', params.platformSlugs.join(','))
      }
      if (params.userId) searchParams.set('userId', params.userId)
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.offset) searchParams.set('offset', params.offset.toString())

      const res = await fetch(`/api/tools?${searchParams}`)
      if (!res.ok) throw new Error('Failed to fetch tools')
      return res.json()
    },
    staleTime: 60_000, // 1 minute
  })
}
```

Create `src/hooks/useTool.ts`:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'

export function useTool(slug: string) {
  return useQuery({
    queryKey: ['tool', slug],
    queryFn: async () => {
      const res = await fetch(`/api/tools/${slug}`)
      if (!res.ok) throw new Error('Failed to fetch tool')
      return res.json()
    },
    enabled: !!slug,
  })
}
```

Create `src/hooks/useFavorites.ts`:

```typescript
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useFavorites() {
  const queryClient = useQueryClient()

  const toggleFavorite = useMutation({
    mutationFn: async (toolId: string) => {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      })
      if (!res.ok) throw new Error('Failed to toggle favorite')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['tools'] })
    },
  })

  const getFavorites = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await fetch('/api/favorites')
      if (!res.ok) throw new Error('Failed to fetch favorites')
      return res.json()
    },
  })

  return {
    toggleFavorite,
    favorites: getFavorites.data,
    isLoading: getFavorites.isLoading,
  }
}
```

Create `src/hooks/useCategories.ts`:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
    staleTime: Infinity, // Categories rarely change
  })
}
```

Create `src/hooks/usePlatforms.ts`:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'

export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const res = await fetch('/api/platforms')
      if (!res.ok) throw new Error('Failed to fetch platforms')
      return res.json()
    },
    staleTime: Infinity, // Platforms rarely change
  })
}
```

---

### **Phase 6: Update UI Components** (Day 6)

#### 6.1 Batch Rename Components

```bash
# Rename directories
mv src/components/agents src/components/tools
mv src/app/agents src/app/tools

# Update all import paths
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s|from '@/components/agents|from '@/components/tools|g" \
  -e "s|from '@/app/agents|from '@/app/tools|g" \
  -e "s|href=\"/agents|href=\"/tools|g" \
  -e "s|href='/agents|href='/tools|g" \
  -e "s|router.push('/agents|router.push('/tools|g" \
  -e "s|router.push(\"/agents|router.push(\"/tools|g" {} +
```

#### 6.2 Update ToolCard Component

Update `src/components/tools/ToolCard.tsx`:

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Heart } from 'lucide-react'
import type { Tool } from '@/types/database'

interface ToolCardProps {
  tool: Tool
  showAuthor?: boolean
}

export function ToolCard({ tool, showAuthor = true }: ToolCardProps) {
  return (
    <Link href={`/tools/${tool.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg line-clamp-2">{tool.name}</CardTitle>
            {tool.isFeatured && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                Featured
              </div>
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {tool.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platforms */}
          <div className="flex flex-wrap gap-2">
            {tool.platforms?.map((tp) => (
              <span
                key={tp.platform.id}
                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium"
              >
                {tp.platform.name}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{tool.favoritesCount}</span>
            </div>
          </div>

          {/* Category */}
          {tool.category && (
            <div className="text-xs text-muted-foreground">
              {tool.category.name}
            </div>
          )}

          {/* Author */}
          {showAuthor && tool.user && (
            <div className="flex items-center gap-2 pt-4 border-t">
              {tool.user.avatarUrl ? (
                <Image
                  src={tool.user.avatarUrl}
                  alt={tool.user.fullName || tool.user.username}
                  width={24}
                  height={24}
                  className="rounded-full"
                  loading="lazy"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-xs font-semibold text-purple-700">
                  {tool.user.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                {tool.user.fullName || tool.user.username}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
```

#### 6.3 Update Browse Page

Update `src/app/browse/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useDebounce } from 'use-debounce'
import { ToolCard } from '@/components/tools/ToolCard'
import { useTools } from '@/hooks/useTools'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'favorites'>('popular')

  const { data: tools, isLoading, error } = useTools({
    search: debouncedSearchQuery,
    sortBy,
    limit: 50,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Browse AI Tools</h1>

      {/* Search */}
      <Input
        type="text"
        placeholder="Search tools..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full mb-6"
      />

      {/* Sort */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={sortBy === 'recent' ? 'default' : 'outline'}
          onClick={() => setSortBy('recent')}
        >
          Recent
        </Button>
        <Button
          variant={sortBy === 'popular' ? 'default' : 'outline'}
          onClick={() => setSortBy('popular')}
        >
          Popular
        </Button>
        <Button
          variant={sortBy === 'favorites' ? 'default' : 'outline'}
          onClick={() => setSortBy('favorites')}
        >
          Most Favorited
        </Button>
      </div>

      {/* Loading/Error States */}
      {isLoading && <div className="text-center py-12">Loading tools...</div>}
      {error && <div className="text-center py-12 text-red-500">Error loading tools</div>}

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools?.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && tools?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No tools found. Try a different search term.
        </div>
      )}
    </div>
  )
}
```

#### 6.4 Create Auth Pages

Create `src/app/auth/signin/page.tsx`:

```typescript
'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLinkedInSignIn = async () => {
    setLoading(true)
    await signIn('linkedin', { callbackUrl: '/dashboard' })
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/dashboard',
    })
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Sign in to OpenAuditSwarms to share and discover AI tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Production: LinkedIn OAuth */}
          <Button
            onClick={handleLinkedInSignIn}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Continue with LinkedIn
          </Button>

          {/* Development: Email/Password */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or (Dev Only)
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  Sign In with Email
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 6.5 Update Root Layout

Update `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { SessionProvider } from 'next-auth/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenAuditSwarms - AI Tools for Auditors',
  description: 'Share and discover platform-agnostic AI tools for auditors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
```

Update `src/components/providers/QueryProvider.tsx`:

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

---

### **Phase 7: Testing & Validation** (Day 7)

#### 7.1 Local Testing Checklist

**Start Development Server:**
```bash
# Terminal 1: Start Cloud SQL Proxy
./cloud-sql-proxy openauditswarms:us-central1:openauditswarms-db

# Terminal 2: Start Next.js dev server
npm run dev
```

**Test Authentication:**
- [ ] Navigate to http://localhost:3000/auth/signin
- [ ] Click "Continue with LinkedIn"
- [ ] Verify OAuth flow works
- [ ] Check user created in database: `npx prisma studio`
- [ ] Test email/password login (dev only)
- [ ] Verify session persists on page refresh
- [ ] Test logout

**Test Tool CRUD:**
- [ ] Create a new tool
- [ ] View tool detail page
- [ ] Edit tool
- [ ] Delete tool (verify soft delete)
- [ ] Verify only owner can edit/delete

**Test Browse & Search:**
- [ ] Browse all tools
- [ ] Search by keyword
- [ ] Filter by category
- [ ] Filter by platform
- [ ] Sort by recent/popular/favorites

**Test Favorites:**
- [ ] Favorite a tool
- [ ] Unfavorite a tool
- [ ] View favorites list
- [ ] Verify count updates

**Test File Uploads:**
- [ ] Upload avatar
- [ ] Upload tool documentation
- [ ] Verify signed URLs work
- [ ] Verify files accessible

#### 7.2 Database Validation

```bash
# Connect to database
npx prisma studio

# Check data integrity
# - Verify users table populated
# - Verify tools table has data
# - Check foreign key relationships
# - Verify soft deletes (is_deleted = true)
```

#### 7.3 Performance Testing

```bash
# Build production version
npm run build

# Start production server
npm start

# Run Lighthouse audit
# Open Chrome DevTools → Lighthouse → Run audit
# Target scores: Performance >90, Accessibility >95, SEO >90

# Load test API endpoints
npx autocannon -c 10 -d 30 http://localhost:3000/api/tools
```

---

### **Phase 8: Deployment** (Day 8-9)

#### 8.1 Prepare for Production

**Update Environment Variables:**

Create `.env.production`:
```bash
DATABASE_URL="postgresql://appuser:PASSWORD@/openauditswarms?host=/cloudsql/openauditswarms:us-central1:openauditswarms-db"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
LINKEDIN_CLIENT_ID="production-client-id"
LINKEDIN_CLIENT_SECRET="production-client-secret"
GCP_PROJECT_ID="openauditswarms"
GCS_BUCKET_NAME="openauditswarms-storage"
```

**Store Secrets in Secret Manager:**
```bash
# Database URL
echo -n "postgresql://appuser:PASSWORD@/openauditswarms?host=/cloudsql/openauditswarms:us-central1:openauditswarms-db" | \
  gcloud secrets create database-url --data-file=-

# NextAuth Secret
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create nextauth-secret --data-file=-

# LinkedIn credentials
echo -n "your-client-id" | \
  gcloud secrets create linkedin-client-id --data-file=-

echo -n "your-client-secret" | \
  gcloud secrets create linkedin-client-secret --data-file=-
```

#### 8.2 Create Dockerfile

Create `Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
    ],
  },
}

module.exports = nextConfig
```

#### 8.3 Create Cloud Build Configuration

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build container image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/openauditswarms:$COMMIT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/openauditswarms:latest'
      - '.'

  # Push container image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - 'gcr.io/$PROJECT_ID/openauditswarms'

  # Run database migrations
  - name: 'gcr.io/google-appengine/exec-wrapper'
    args:
      - '-i'
      - 'gcr.io/$PROJECT_ID/openauditswarms:$COMMIT_SHA'
      - '-s'
      - '$_INSTANCE_CONNECTION_NAME'
      - '-e'
      - 'DATABASE_URL=$$DATABASE_URL'
      - '--'
      - 'npx'
      - 'prisma'
      - 'migrate'
      - 'deploy'
    secretEnv: ['DATABASE_URL']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'openauditswarms'
      - '--image=gcr.io/$PROJECT_ID/openauditswarms:$COMMIT_SHA'
      - '--region=$_REGION'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--add-cloudsql-instances=$_INSTANCE_CONNECTION_NAME'
      - '--set-env-vars=NODE_ENV=production,GCP_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=$_BUCKET_NAME'
      - '--set-secrets=DATABASE_URL=database-url:latest,NEXTAUTH_SECRET=nextauth-secret:latest,LINKEDIN_CLIENT_ID=linkedin-client-id:latest,LINKEDIN_CLIENT_SECRET=linkedin-client-secret:latest'
      - '--max-instances=10'
      - '--min-instances=1'
      - '--memory=1Gi'
      - '--cpu=1'
      - '--timeout=60'

availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/database-url/versions/latest
      env: 'DATABASE_URL'

substitutions:
  _REGION: us-central1
  _INSTANCE_CONNECTION_NAME: openauditswarms:us-central1:openauditswarms-db
  _BUCKET_NAME: openauditswarms-storage

images:
  - 'gcr.io/$PROJECT_ID/openauditswarms:$COMMIT_SHA'
  - 'gcr.io/$PROJECT_ID/openauditswarms:latest'

options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY
```

#### 8.4 Deploy to Production

```bash
# Grant Cloud Build service account necessary permissions
PROJECT_NUMBER=$(gcloud projects describe openauditswarms --format='value(projectNumber)')

gcloud projects add-iam-policy-binding openauditswarms \
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding openauditswarms \
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding openauditswarms \
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Submit build
gcloud builds submit --config cloudbuild.yaml

# Get the service URL
gcloud run services describe openauditswarms \
  --region=us-central1 \
  --format='value(status.url)'

# Update NEXTAUTH_URL in secrets
echo -n "https://YOUR-SERVICE-URL" | \
  gcloud secrets versions add nextauth-url --data-file=-
```

#### 8.5 Set Up Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service=openauditswarms \
  --domain=yourdomain.com \
  --region=us-central1

# Follow DNS instructions provided
# Update LinkedIn OAuth redirect URLs
# Update NEXTAUTH_URL secret
```

#### 8.6 Set Up CI/CD (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: openauditswarms
  REGION: us-central1
  SERVICE_NAME: openauditswarms

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Submit build to Cloud Build
        run: |
          gcloud builds submit \
            --config cloudbuild.yaml \
            --project $PROJECT_ID
```

---

### **Phase 9: Post-Deployment Monitoring** (Day 10+)

#### 9.1 Set Up Monitoring

```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# Create uptime check
gcloud monitoring uptime create \
  --display-name="OpenAuditSwarms Health Check" \
  --resource-type=uptime-url \
  --url="https://YOUR-SERVICE-URL/api/health"

# Create alert policy for errors
gcloud alpha monitoring policies create \
  --notification-channels=EMAIL_CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s
```

#### 9.2 View Logs

```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=openauditswarms" \
  --limit 50 \
  --format json

# Stream logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=openauditswarms"

# Filter for errors only
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 50
```

#### 9.3 Monitor Costs

```bash
# View current month costs
gcloud billing accounts list

# Set up budget alerts in GCP Console:
# 1. Go to Billing → Budgets & Alerts
# 2. Create budget: $50/month
# 3. Set alert thresholds: 50%, 90%, 100%
# 4. Add email notifications
```

---

## 📊 Cost Breakdown (Monthly)

| Service | Configuration | Cost |
|---------|---------------|------|
| Cloud SQL | db-g1-small (1.7GB RAM) | $26 |
| Cloud Storage | 100GB + 50GB egress | $8 |
| Cloud Run | 1M requests, 1 instance always on | $10 |
| Cloud Build | 120 builds/month | $0 (free tier) |
| Secret Manager | 10 secrets | $0.06 |
| **Total** | | **~$44/month** |

---

## ⚠️ Risk Mitigation & Rollback

### Common Issues & Solutions

#### Issue: LinkedIn OAuth not working
**Symptoms**: Redirect fails or shows error
**Solution**:
1. Verify redirect URLs in LinkedIn app match exactly
2. Check NEXTAUTH_URL is correct
3. Ensure LinkedIn app has OpenID Connect product access

#### Issue: Database connection timeout
**Symptoms**: API calls fail with connection error
**Solution**:
1. Verify Cloud SQL instance is running
2. Check Cloud Run has `--add-cloudsql-instances` flag
3. Verify DATABASE_URL format is correct for Cloud SQL socket

#### Issue: File uploads failing
**Symptoms**: Signed URL generation fails
**Solution**:
1. Check GCS bucket exists and is accessible
2. Verify Cloud Run service account has storage.objectAdmin role
3. Check CORS settings on bucket

#### Issue: Slow queries
**Symptoms**: Pages load slowly
**Solution**:
1. Add database indexes (already in schema)
2. Check Prisma query includes
3. Enable connection pooling
4. Consider upgrading Cloud SQL tier

### Rollback Procedure

If deployment fails or critical issues arise:

**1. Immediate Rollback (Cloud Run)**
```bash
# List revisions
gcloud run revisions list --service=openauditswarms --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic openauditswarms \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-central1
```

**2. Database Rollback**
```bash
# Restore from backup
gcloud sql backups list --instance=openauditswarms-db

gcloud sql backups restore BACKUP_ID \
  --backup-instance=openauditswarms-db \
  --backup-project=openauditswarms
```

**3. Code Rollback**
```bash
# Revert git commit
git revert HEAD
git push origin main

# Or force push previous commit
git reset --hard HEAD~1
git push --force origin main
```

---

## 📝 Post-Migration Checklist

### Week 1
- [ ] Monitor error logs daily
- [ ] Check database performance metrics
- [ ] Verify all features work in production
- [ ] Test LinkedIn OAuth with real users
- [ ] Monitor costs in billing dashboard
- [ ] Collect user feedback

### Week 2
- [ ] Review and optimize slow queries
- [ ] Set up automated backups
- [ ] Configure alerts for critical metrics
- [ ] Update documentation
- [ ] Create runbook for common issues

### Month 1
- [ ] Full cost analysis and optimization
- [ ] Performance benchmarking
- [ ] Security audit
- [ ] Disaster recovery test
- [ ] User satisfaction survey

---

## 🎯 Success Metrics

Track these metrics to measure migration success:

1. **Performance**
   - Page load time < 2s
   - API response time < 500ms
   - Time to Interactive < 3s

2. **Reliability**
   - Uptime > 99.9%
   - Error rate < 0.1%
   - Failed requests < 1%

3. **Cost**
   - Monthly cost ≤ $50
   - Cost per user < $0.01
   - No unexpected charges

4. **User Experience**
   - Auth success rate > 99%
   - Search latency < 300ms
   - Upload success rate > 95%

---

## 📞 Support & Resources

- **GCP Console**: https://console.cloud.google.com
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Cloud SQL Docs**: https://cloud.google.com/sql/docs
- **NextAuth Docs**: https://next-auth.js.org
- **Prisma Docs**: https://www.prisma.io/docs
- **LinkedIn OAuth**: https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication

---

## ✅ Ready to Begin?

1. **Create backup branch**: `git checkout -b backup-supabase`
2. **Create migration branch**: `git checkout -b migration-gcp`
3. **Start with Phase 1**: GCP project setup
4. **Follow phases sequentially**: Each builds on previous
5. **Test thoroughly**: Use checklists provided
6. **Deploy carefully**: Test in staging first

**Good luck with your migration! 🚀**
