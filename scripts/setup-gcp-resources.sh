#!/bin/bash
# GCP Resource Setup Script for OpenAuditSwarms
# Run this script in your local terminal with gcloud authenticated

set -e

PROJECT_ID="toolbox-478717"
REGION="us-central1"
DB_INSTANCE_NAME="toolbox-db"
DB_NAME="openauditswarms"
DB_USER="appuser"
BUCKET_NAME="toolbox-storage"

echo "🚀 Setting up GCP resources for project: $PROJECT_ID"
echo ""

# Set project
echo "📋 Setting active project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling required APIs..."
gcloud services enable \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com

echo "✅ APIs enabled"
echo ""

# Generate secure passwords
DB_ROOT_PASSWORD=$(openssl rand -base64 32)
DB_APP_PASSWORD=$(openssl rand -base64 32)

echo "🔐 Generated secure passwords (save these!):"
echo "Root password: $DB_ROOT_PASSWORD"
echo "App user password: $DB_APP_PASSWORD"
echo ""

# Create Cloud SQL instance
echo "🗄️  Creating Cloud SQL PostgreSQL instance (this takes 5-10 minutes)..."
gcloud sql instances create $DB_INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password="$DB_ROOT_PASSWORD" \
  --storage-type=HDD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --availability-type=zonal

echo "✅ Cloud SQL instance created"
echo ""

# Create database
echo "📊 Creating database..."
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME

echo "✅ Database created"
echo ""

# Create app user
echo "👤 Creating database user..."
gcloud sql users create $DB_USER \
  --instance=$DB_INSTANCE_NAME \
  --password="$DB_APP_PASSWORD"

echo "✅ Database user created"
echo ""

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")
echo "📡 Connection name: $CONNECTION_NAME"
echo ""

# Create storage bucket
echo "📦 Creating Cloud Storage bucket..."
gcloud storage buckets create gs://$BUCKET_NAME \
  --location=$REGION \
  --uniform-bucket-level-access \
  --public-access-prevention

echo "✅ Storage bucket created"
echo ""

# Create service account for local development
echo "🔑 Creating service account for local development..."
SERVICE_ACCOUNT_NAME="openauditswarms-dev"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --display-name="OpenAuditSwarms Development"

echo "✅ Service account created"
echo ""

# Grant necessary permissions
echo "🔐 Granting permissions to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.objectAdmin"

echo "✅ Permissions granted"
echo ""

# Create service account key
echo "🔑 Creating service account key..."
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=$SERVICE_ACCOUNT_EMAIL

echo "✅ Service account key saved to ./service-account-key.json"
echo ""

# Store secrets in Secret Manager
echo "🔒 Storing secrets in Secret Manager..."
echo -n "$DB_APP_PASSWORD" | gcloud secrets create database-password \
  --data-file=- \
  --replication-policy="automatic"

echo -n "GENERATE_THIS_WITH_OPENSSL_RAND_BASE64_32" | gcloud secrets create nextauth-secret \
  --data-file=- \
  --replication-policy="automatic"

echo "✅ Secrets stored in Secret Manager"
echo ""

echo "🎉 GCP Resources Setup Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 SAVE THESE CREDENTIALS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Database Root Password:"
echo "$DB_ROOT_PASSWORD"
echo ""
echo "Database App User Password:"
echo "$DB_APP_PASSWORD"
echo ""
echo "Cloud SQL Connection Name:"
echo "$CONNECTION_NAME"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Create .env.local file with:"
echo ""
echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_APP_PASSWORD@localhost:5432/$DB_NAME?host=/cloudsql/$CONNECTION_NAME\""
echo "NEXTAUTH_URL=\"http://localhost:3000\""
echo "NEXTAUTH_SECRET=\"\$(openssl rand -base64 32)\""
echo "LINKEDIN_CLIENT_ID=\"your-linkedin-client-id\""
echo "LINKEDIN_CLIENT_SECRET=\"your-linkedin-client-secret\""
echo "GCP_PROJECT_ID=\"$PROJECT_ID\""
echo "GCS_BUCKET_NAME=\"$BUCKET_NAME\""
echo "GOOGLE_APPLICATION_CREDENTIALS=\"./service-account-key.json\""
echo ""
echo "2. Install Cloud SQL Proxy:"
echo "   curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64"
echo "   chmod +x cloud-sql-proxy"
echo ""
echo "3. Run Cloud SQL Proxy (in separate terminal):"
echo "   ./cloud-sql-proxy $CONNECTION_NAME"
echo ""
echo "4. Run Prisma migrations:"
echo "   npx prisma migrate dev --name init"
echo ""
echo "5. Seed database:"
echo "   npx prisma db seed"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
