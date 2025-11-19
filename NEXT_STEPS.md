# Next Steps - OpenAuditSwarms GCP Migration

## ✅ Migration Complete!

The migration from Supabase/Vercel to GCP is **fully complete and working locally**.

### What's Working Now
- ✅ Cloud SQL PostgreSQL database
- ✅ Prisma ORM with full schema
- ✅ NextAuth.js authentication (dev credentials)
- ✅ All pages: browse, tool detail, add, edit, profile
- ✅ All API routes functional
- ✅ Database queries optimized with Prisma
- ✅ "Agents" → "Tools" terminology updated
- ✅ Schema updated (removed configuration, added documentation)
- ✅ Dockerfile and deployment config ready

---

## 🚀 To Deploy to Production

### 1. Configure LinkedIn OAuth (Required)

```bash
# Create LinkedIn App at https://www.linkedin.com/developers/apps
# Add these redirect URLs:
- Development: http://localhost:3000/api/auth/callback/linkedin
- Production: https://YOUR-APP.run.app/api/auth/callback/linkedin

# Save your credentials:
LINKEDIN_CLIENT_ID="your-client-id"
LINKEDIN_CLIENT_SECRET="your-client-secret"
```

### 2. Set Up GCP Secrets

```bash
# Authenticate
gcloud auth login --account=luiza@auditswarm.com

# Set project
gcloud config set project toolbox-478717

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets for sensitive data
echo -n "postgresql://appuser:PASSWORD@/openauditswarms?host=/cloudsql/toolbox-478717:us-central1:toolbox-db" | \
  gcloud secrets create database-url --data-file=-

# Generate and store NextAuth secret
openssl rand -base64 32 | gcloud secrets create nextauth-secret --data-file=-

# Store LinkedIn credentials
echo -n "YOUR_LINKEDIN_CLIENT_ID" | gcloud secrets create linkedin-client-id --data-file=-
echo -n "YOUR_LINKEDIN_CLIENT_SECRET" | gcloud secrets create linkedin-client-secret --data-file=-
```

### 3. Deploy to Cloud Run

```bash
# Option A: Using Cloud Build (Recommended)
gcloud builds submit --config=cloudbuild.yaml

# After deployment, set secrets
gcloud run services update openauditswarms \
  --region=us-central1 \
  --update-secrets=DATABASE_URL=database-url:latest,\
NEXTAUTH_SECRET=nextauth-secret:latest,\
LINKEDIN_CLIENT_ID=linkedin-client-id:latest,\
LINKEDIN_CLIENT_SECRET=linkedin-client-secret:latest

# Set public environment variables
gcloud run services update openauditswarms \
  --region=us-central1 \
  --set-env-vars=NEXTAUTH_URL=https://YOUR-ACTUAL-URL.run.app,\
GCP_PROJECT_ID=toolbox-478717,\
GCS_BUCKET_NAME=toolbox-478717-storage,\
NODE_ENV=production
```

```bash
# Option B: Manual Docker Deployment
docker build -t gcr.io/toolbox-478717/openauditswarms:latest .
docker push gcr.io/toolbox-478717/openauditswarms:latest

gcloud run deploy openauditswarms \
  --image gcr.io/toolbox-478717/openauditswarms:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances toolbox-478717:us-central1:toolbox-db \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 60
```

### 4. Update LinkedIn App

After deployment, get your Cloud Run URL:
```bash
gcloud run services describe openauditswarms --region=us-central1 --format='value(status.url)'
```

Update LinkedIn app redirect URL:
```
https://YOUR-ACTUAL-URL.run.app/api/auth/callback/linkedin
```

### 5. Verify Deployment

```bash
# Check service status
gcloud run services describe openauditswarms --region=us-central1

# View logs
gcloud run services logs tail openauditswarms --region=us-central1

# Test the app
curl -I https://YOUR-APP-URL.run.app
```

---

## 📊 Optional Enhancements

### Image Upload with Google Cloud Storage

The GCS client is already configured. To enable image uploads:

1. **Create upload API route** (`src/app/api/upload/route.ts`):
```typescript
import { uploadToGCS } from '@/lib/gcs/client'
import { getServerSession } from 'next-auth'

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File

  const url = await uploadToGCS(file, `tools/${Date.now()}-${file.name}`)
  return Response.json({ url })
}
```

2. **Add upload component** to tool creation form

3. **Update schema** to store image URLs

### Custom Domain

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service openauditswarms \
  --domain tools.auditswarm.com \
  --region us-central1

# Update DNS with provided records
```

### Monitoring & Alerts

```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# Set up alerts in GCP Console:
# - Error rate > 5%
# - Response time > 2s
# - Database connection failures
```

### Continuous Deployment

```bash
# Connect GitHub repository
gcloud alpha builds triggers create github \
  --repo-name=OpenAuditSwarms \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml

# Now every push to main automatically deploys
```

---

## 🔧 Local Development

### Start Development Environment

```bash
# Terminal 1: Start Cloud SQL Proxy
./cloud-sql-proxy --port 5433 toolbox-478717:us-central1:toolbox-db

# Terminal 2: Start dev server
npm run dev

# Open http://localhost:3000/browse
```

### Run Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Generate Prisma client (after schema changes)
npx prisma generate

# Reset database (development only)
npx prisma migrate reset
```

### Test with Dev Credentials

```
Email: dev@example.com
Password: password123
```

---

## 📝 Key Files Reference

### Configuration
- `.env.local` - Local environment variables
- `.env.production.example` - Production template
- `prisma/schema.prisma` - Database schema
- `next.config.js` - Next.js configuration

### Deployment
- `Dockerfile` - Container image
- `cloudbuild.yaml` - CI/CD configuration
- `DEPLOYMENT.md` - Detailed deployment guide

### Documentation
- `MIGRATION_SUMMARY.md` - Complete migration overview
- `CLAUDE.md` - Project instructions for Claude
- `README.md` - Project documentation

---

## 💰 Cost Monitoring

Current estimated monthly cost: **$18-25**

Breakdown:
- Cloud SQL (db-f1-micro): ~$9
- Cloud Run (scales to zero): ~$8-15
- Cloud Storage: ~$0.50
- Networking: ~$1

To reduce costs:
```bash
# Reduce max instances
gcloud run services update openauditswarms \
  --max-instances=3

# Reduce memory allocation
gcloud run services update openauditswarms \
  --memory=256Mi
```

---

## 🆘 Troubleshooting

### Check Logs
```bash
gcloud run services logs read openauditswarms --region=us-central1 --limit=100
```

### Database Connection Issues
```bash
# Verify Cloud SQL instance
gcloud sql instances describe toolbox-db

# Test connection from Cloud Shell
gcloud sql connect toolbox-db --user=appuser --database=openauditswarms
```

### Environment Variables
```bash
gcloud run services describe openauditswarms \
  --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)'
```

### Rollback Deployment
```bash
# List revisions
gcloud run revisions list --service=openauditswarms --region=us-central1

# Rollback to previous
gcloud run services update-traffic openauditswarms \
  --to-revisions=REVISION_NAME=100 \
  --region=us-central1
```

---

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [LinkedIn OAuth Setup](https://www.linkedin.com/developers/apps)

---

## ✨ What's New vs Supabase

### Better
- ✅ Type-safe database queries with Prisma
- ✅ More control over authentication flow
- ✅ Better cost predictability
- ✅ Easier local development
- ✅ No vendor lock-in

### Same
- ✅ All UI components preserved
- ✅ All features working
- ✅ PostgreSQL database
- ✅ User authentication

### To Implement
- ⏳ Image uploads (GCS ready)
- ⏳ LinkedIn OAuth in production
- ⏳ Email notifications
- ⏳ Analytics tracking

---

**Ready for production deployment!** 🚀

For questions, refer to [DEPLOYMENT.md](./DEPLOYMENT.md) or [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md).
