#!/bin/bash

# OpenAuditSwarms - GCP Secrets Setup Script
# Run this ONCE before deploying

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Setting up GCP Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ "$PROJECT_ID" != "toolbox-478717" ]; then
    echo "❌ ERROR: Wrong project. Run: gcloud config set project toolbox-478717"
    exit 1
fi

echo "✅ Project: $PROJECT_ID"
echo ""

# Enable Secret Manager API
echo "📦 Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com
echo ""

# Prompt for LinkedIn Client Secret
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 LinkedIn OAuth Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Please enter your LinkedIn Client Secret:"
echo "(Find it at: https://www.linkedin.com/developers/apps)"
echo ""
read -s -p "Client Secret: " LINKEDIN_SECRET
echo ""
echo ""

if [ -z "$LINKEDIN_SECRET" ]; then
    echo "❌ ERROR: Client Secret cannot be empty"
    exit 1
fi

# Create secrets
echo "Creating secrets..."
echo ""

# 1. Database URL
echo "📊 Creating database-url secret..."
if gcloud secrets describe database-url &>/dev/null; then
    echo "  ⚠️  Secret already exists, skipping..."
else
    echo -n "postgresql://appuser:pQwJOO96%2FBOANblOWmuRjpZAOehJo3%2BBrq4wNyMQ2Fc%3D@/openauditswarms?host=/cloudsql/toolbox-478717:us-central1:toolbox-db" | \
      gcloud secrets create database-url --data-file=-
    echo "  ✅ Created"
fi
echo ""

# 2. NextAuth Secret
echo "🔑 Creating nextauth-secret..."
if gcloud secrets describe nextauth-secret &>/dev/null; then
    echo "  ⚠️  Secret already exists, skipping..."
else
    openssl rand -base64 32 | gcloud secrets create nextauth-secret --data-file=-
    echo "  ✅ Created"
fi
echo ""

# 3. LinkedIn Client ID
echo "🔗 Creating linkedin-client-id..."
if gcloud secrets describe linkedin-client-id &>/dev/null; then
    echo "  ⚠️  Secret already exists, skipping..."
else
    echo -n "861i6wmohaqi2g" | gcloud secrets create linkedin-client-id --data-file=-
    echo "  ✅ Created"
fi
echo ""

# 4. LinkedIn Client Secret
echo "🔒 Creating linkedin-client-secret..."
if gcloud secrets describe linkedin-client-secret &>/dev/null; then
    echo "  ⚠️  Secret already exists, updating..."
    echo -n "$LINKEDIN_SECRET" | gcloud secrets versions add linkedin-client-secret --data-file=-
    echo "  ✅ Updated"
else
    echo -n "$LINKEDIN_SECRET" | gcloud secrets create linkedin-client-secret --data-file=-
    echo "  ✅ Created"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Secrets setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Created secrets:"
gcloud secrets list --filter="name:database-url OR name:nextauth-secret OR name:linkedin-client-id OR name:linkedin-client-secret"
echo ""
echo "🚀 Next step: Run ./scripts/deploy.sh to deploy to Cloud Run"
echo ""
