#!/bin/bash

echo "🔍 Checking if AuditSwarm.com is verified..."
if gcloud domains list-user-verified --project=toolbox-478717 | grep -q "AuditSwarm.com"; then
    echo "✅ Domain verified! Setting up domain mapping..."

    # Create domain mapping for root domain
    echo "Mapping AuditSwarm.com to Cloud Run..."
    gcloud beta run domain-mappings create \
        --service=openauditswarms \
        --domain=AuditSwarm.com \
        --region=us-central1

    # Create domain mapping for www
    echo "Mapping www.AuditSwarm.com to Cloud Run..."
    gcloud beta run domain-mappings create \
        --service=openauditswarms \
        --domain=www.AuditSwarm.com \
        --region=us-central1

    echo ""
    echo "📋 DNS Records to add to your provider:"
    echo "=================================="
    gcloud beta run domain-mappings describe --domain=AuditSwarm.com --region=us-central1 2>/dev/null

    echo ""
    echo "🔧 Next steps:"
    echo "1. Remove the following DNS records:"
    echo "   - A record @ -> 216.198.79.1 (Vercel)"
    echo "   - CNAME www -> dcd7fb9699348c43.vercel-dns-017.com"
    echo ""
    echo "2. Add these DNS records instead:"
    echo "   - A record @ -> 216.239.32.21"
    echo "   - A record @ -> 216.239.34.21"
    echo "   - A record @ -> 216.239.36.21"
    echo "   - A record @ -> 216.239.38.21"
    echo "   - CNAME www -> ghs.googlehosted.com"
    echo ""
    echo "3. Update NEXTAUTH_URL:"
    echo "   gcloud run services update openauditswarms --region=us-central1 --update-env-vars=NEXTAUTH_URL=https://AuditSwarm.com"

else
    echo "❌ Domain not verified yet!"
    echo ""
    echo "Please verify AuditSwarm.com:"
    echo "1. Go to: https://search.google.com/search-console"
    echo "2. Add property: AuditSwarm.com"
    echo "3. It should auto-verify with your existing TXT record"
    echo "4. Then run this script again"
fi