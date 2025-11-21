#!/bin/bash

# Setup script to make GCS bucket publicly readable
# This allows profile images to be accessed via public URLs

echo "Setting up public access for GCS bucket..."
echo ""

# Step 1: Remove public access prevention at the project level
echo "Step 1: Removing public access prevention policy..."
gcloud resource-manager org-policies delete constraints/storage.publicAccessPrevention --project=toolbox-478717

if [ $? -ne 0 ]; then
  echo "⚠ Could not remove org policy (may not exist or may need org-level permissions)"
  echo "Continuing anyway..."
fi

echo ""

# Step 2: Disable public access prevention on the bucket
echo "Step 2: Disabling public access prevention on bucket..."
gcloud storage buckets update gs://toolbox-478717-storage --clear-pap

if [ $? -ne 0 ]; then
  echo "✗ Failed to disable public access prevention on bucket"
  exit 1
fi

echo "✓ Public access prevention disabled on bucket"
echo ""

# Step 3: Add IAM policy binding to allow public read access
echo "Step 3: Adding public read permissions..."
gcloud storage buckets add-iam-policy-binding gs://toolbox-478717-storage \
  --member=allUsers \
  --role=roles/storage.objectViewer

if [ $? -eq 0 ]; then
  echo "✓ Successfully made bucket publicly readable"
  echo ""
  echo "Profile images will now be accessible at:"
  echo "https://storage.googleapis.com/toolbox-478717-storage/profile-images/{userId}/{timestamp}.{ext}"
  echo ""
  echo "✅ Setup complete! You can now upload profile images."
else
  echo "✗ Failed to update bucket permissions"
  echo ""
  echo "This might be due to organization-level policies."
  echo "You may need to contact your GCP organization admin to allow public buckets."
  exit 1
fi
