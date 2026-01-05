#!/bin/bash

# Script to update the service after domain is mapped

echo "Updating NEXTAUTH_URL to use AuditSwarm.com..."

# Update Cloud Run environment variable
gcloud run services update openauditswarms \
  --region=us-central1 \
  --update-env-vars="NEXTAUTH_URL=https://AuditSwarm.com"

echo "✅ NEXTAUTH_URL updated to https://AuditSwarm.com"
echo ""
echo "⚠️  Don't forget to update your LinkedIn OAuth app:"
echo "   Add these redirect URLs:"
echo "   - https://AuditSwarm.com/api/auth/callback/linkedin"
echo "   - https://www.AuditSwarm.com/api/auth/callback/linkedin"