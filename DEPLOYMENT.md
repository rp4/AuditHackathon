# Deployment Guide - OpenAuditSwarms on GCP

This guide covers deploying OpenAuditSwarms to Google Cloud Platform using Cloud Run.

## Prerequisites

- GCP Project: `toolbox-478717`
- gcloud CLI authenticated as `luiza@auditswarm.com`
- Cloud SQL instance running (toolbox-db)
- Database created (openauditswarms)
- Cloud Storage bucket (toolbox-478717-storage)

## Environment Setup

### 1. Configure LinkedIn OAuth (Production)

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app or use existing app
3. Add authorized redirect URL: `https://YOUR-APP-URL.run.app/api/auth/callback/linkedin`
4. Note your Client ID and Client Secret

### 2. Set Environment Variables in Cloud Run

```bash
# Create secret for database URL
echo -n "postgresql://appuser:PASSWORD@/openauditswarms?host=/cloudsql/toolbox-478717:us-central1:toolbox-db" | \
  gcloud secrets create database-url --data-file=-

# Create secret for NextAuth secret
openssl rand -base64 32 | gcloud secrets create nextauth-secret --data-file=-

# Create secrets for LinkedIn OAuth
echo -n "YOUR_LINKEDIN_CLIENT_ID" | gcloud secrets create linkedin-client-id --data-file=-
echo -n "YOUR_LINKEDIN_CLIENT_SECRET" | gcloud secrets create linkedin-client-secret --data-file=-
```

## Deployment Methods

### Option 1: Deploy with Cloud Build (Recommended)

```bash
# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Deploy using Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Set secrets after deployment
gcloud run services update openauditswarms \
  --region=us-central1 \
  --update-secrets=DATABASE_URL=database-url:latest,\
NEXTAUTH_SECRET=nextauth-secret:latest,\
LINKEDIN_CLIENT_ID=linkedin-client-id:latest,\
LINKEDIN_CLIENT_SECRET=linkedin-client-secret:latest

# Set public environment variables
gcloud run services update openauditswarms \
  --region=us-central1 \
  --set-env-vars=NEXTAUTH_URL=https://YOUR-APP-URL.run.app,\
GCP_PROJECT_ID=toolbox-478717,\
GCS_BUCKET_NAME=toolbox-478717-storage,\
NODE_ENV=production
```

### Option 2: Manual Docker Deployment

```bash
# Build Docker image
docker build -t gcr.io/toolbox-478717/openauditswarms:latest .

# Push to Container Registry
docker push gcr.io/toolbox-478717/openauditswarms:latest

# Deploy to Cloud Run
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

# Configure secrets (see Option 1)
```

## Post-Deployment Steps

### 1. Run Database Migrations

```bash
# Get Cloud Run service URL
SERVICE_URL=$(gcloud run services describe openauditswarms --region=us-central1 --format='value(status.url)')

# Migrations run automatically on container start via Dockerfile CMD
# Check logs to verify
gcloud run services logs read openauditswarms --region=us-central1 --limit=50
```

### 2. Update LinkedIn OAuth Redirect URL

Update your LinkedIn app settings with the actual Cloud Run URL:
```
https://YOUR-ACTUAL-URL.run.app/api/auth/callback/linkedin
```

### 3. Verify Deployment

```bash
# Check service status
gcloud run services describe openauditswarms --region=us-central1

# View logs
gcloud run services logs tail openauditswarms --region=us-central1

# Test the app
curl -I https://YOUR-APP-URL.run.app
```

## Cost Optimization

Current configuration:
- **Min instances**: 0 (scales to zero when not in use)
- **Max instances**: 10
- **Memory**: 512Mi
- **CPU**: 1

**Estimated monthly cost**: $18-25 for low-medium traffic

To reduce costs further:
```bash
# Reduce max instances
gcloud run services update openauditswarms \
  --region=us-central1 \
  --max-instances=3

# Reduce memory
gcloud run services update openauditswarms \
  --region=us-central1 \
  --memory=256Mi
```

## Continuous Deployment

### Set up Cloud Build Trigger

```bash
# Connect your GitHub repository
gcloud alpha builds triggers create github \
  --repo-name=OpenAuditSwarms \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

Now every push to `main` will automatically deploy to Cloud Run.

## Troubleshooting

### Check Logs
```bash
gcloud run services logs read openauditswarms --region=us-central1 --limit=100
```

### Database Connection Issues
```bash
# Verify Cloud SQL instance is running
gcloud sql instances describe toolbox-db

# Test database connection from Cloud Shell
gcloud sql connect toolbox-db --user=appuser --database=openauditswarms
```

### Environment Variables
```bash
# List all environment variables
gcloud run services describe openauditswarms --region=us-central1 --format='value(spec.template.spec.containers[0].env)'
```

## Monitoring

- **Cloud Run Metrics**: https://console.cloud.google.com/run/detail/us-central1/openauditswarms/metrics
- **Cloud SQL Metrics**: https://console.cloud.google.com/sql/instances/toolbox-db/metrics
- **Cloud Storage Metrics**: https://console.cloud.google.com/storage/browser/toolbox-478717-storage

## Rollback

```bash
# List revisions
gcloud run revisions list --service=openauditswarms --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic openauditswarms \
  --region=us-central1 \
  --to-revisions=REVISION_NAME=100
```

## Security Checklist

- ✅ All secrets stored in Secret Manager
- ✅ Database password URL-encoded
- ✅ NextAuth secret is cryptographically secure
- ✅ LinkedIn OAuth uses production credentials
- ✅ Cloud SQL uses private IP (Unix socket connection)
- ✅ No credentials in source code or Docker image
- ⚠️ Update NEXTAUTH_URL to actual production URL
- ⚠️ Configure LinkedIn app with production redirect URL
