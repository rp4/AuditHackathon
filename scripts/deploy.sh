#!/bin/bash

# OpenAuditSwarms - GCP Deployment Script
# Usage: ./deploy.sh

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 OpenAuditSwarms - Cloud Run Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if gcloud is configured
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ "$PROJECT_ID" != "toolbox-478717" ]; then
    echo "❌ ERROR: Wrong GCP project configured"
    echo "Current: $PROJECT_ID"
    echo "Expected: toolbox-478717"
    echo ""
    echo "Run: gcloud config set project toolbox-478717"
    exit 1
fi

echo "✅ Project: $PROJECT_ID"
echo ""

# Check for required secrets
echo "📋 Checking for required secrets..."
REQUIRED_SECRETS=("database-url" "nextauth-secret" "linkedin-client-id" "linkedin-client-secret")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! gcloud secrets describe "$secret" --project=$PROJECT_ID &>/dev/null; then
        MISSING_SECRETS+=("$secret")
        echo "❌ Secret missing: $secret"
    else
        echo "✅ Secret exists: $secret"
    fi
done

if [ ${#MISSING_SECRETS[@]} -ne 0 ]; then
    echo ""
    echo "❌ ERROR: Missing required secrets!"
    echo ""
    echo "Create missing secrets with:"
    echo ""

    for secret in "${MISSING_SECRETS[@]}"; do
        case $secret in
            "database-url")
                echo "  echo -n 'postgresql://appuser:PASSWORD@/openauditswarms?host=/cloudsql/toolbox-478717:us-central1:toolbox-db' | \\"
                echo "    gcloud secrets create database-url --data-file=-"
                ;;
            "nextauth-secret")
                echo "  openssl rand -base64 32 | gcloud secrets create nextauth-secret --data-file=-"
                ;;
            "linkedin-client-id")
                echo "  echo -n '861i6wmohaqi2g' | gcloud secrets create linkedin-client-id --data-file=-"
                ;;
            "linkedin-client-secret")
                echo "  echo -n 'YOUR_CLIENT_SECRET' | gcloud secrets create linkedin-client-secret --data-file=-"
                ;;
        esac
        echo ""
    done

    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Building Docker image..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build with Cloud Build
gcloud builds submit --config=cloudbuild.yaml

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Configuring secrets..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Update Cloud Run service with secrets
gcloud run services update openauditswarms \
  --region=us-central1 \
  --update-secrets=DATABASE_URL=database-url:latest,\
NEXTAUTH_SECRET=nextauth-secret:latest,\
LINKEDIN_CLIENT_ID=linkedin-client-id:latest,\
LINKEDIN_CLIENT_SECRET=linkedin-client-secret:latest

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  Setting environment variables..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get the Cloud Run URL
SERVICE_URL=$(gcloud run services describe openauditswarms --region=us-central1 --format='value(status.url)')

# Set environment variables
gcloud run services update openauditswarms \
  --region=us-central1 \
  --set-env-vars=NEXTAUTH_URL=$SERVICE_URL,\
GCP_PROJECT_ID=toolbox-478717,\
GCS_BUCKET_NAME=toolbox-478717-storage,\
NODE_ENV=production

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📋 Next steps:"
echo "  1. Update LinkedIn app redirect URL to:"
echo "     $SERVICE_URL/api/auth/callback/linkedin"
echo ""
echo "  2. Test your deployment:"
echo "     curl -I $SERVICE_URL"
echo ""
echo "  3. View logs:"
echo "     gcloud run services logs tail openauditswarms --region=us-central1"
echo ""
echo "  4. (Optional) Map custom domain:"
echo "     gcloud run domain-mappings create --service openauditswarms \\"
echo "       --domain audittoolbox.com --region us-central1"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
