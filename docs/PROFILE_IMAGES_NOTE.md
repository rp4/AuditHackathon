# Profile Images - Organization Policy Restriction

## Issue

The GCS bucket `toolbox-478717-storage` cannot be made publicly readable due to an organization-level policy that enforces public access prevention.

## Current Status

- ✅ Profile images are uploaded successfully to GCS
- ✅ Images are stored at `gs://toolbox-478717-storage/profile-images/{userId}/{timestamp}.{ext}`
- ❌ Images cannot be accessed via public URLs due to org policy
- ❌ The image URLs saved in the database will return 403 Forbidden errors

## Solutions

### Option 1: Remove Organization Policy (Requires Org Admin)

If you have organization admin access, you can remove the constraint:

```bash
# At organization level
gcloud org-policies delete constraints/storage.publicAccessPrevention \
  --organization=YOUR_ORG_ID

# Or at project level
gcloud resource-manager org-policies delete \
  constraints/storage.publicAccessPrevention \
  --project=toolbox-478717
```

Then run `./setup-public-bucket.sh` again.

### Option 2: Use Signed URLs (Recommended for now)

Modify the application to generate signed URLs for profile images. This requires:
1. Service account credentials with Storage Object Viewer role
2. Updating the code to generate signed URLs when displaying images
3. Images remain private but accessible through signed URLs

### Option 3: Use a Different Storage Solution

- Use a CDN or image hosting service (e.g., Cloudinary, imgix)
- Use Cloud Run's built-in static file serving
- Store images in a different public bucket (if allowed)

## Temporary Workaround

For development, you can:
1. Use LinkedIn profile images (already working)
2. Test with local file paths
3. Use placeholder images

## Recommendation

Since this is an organization-level restriction, **Option 2 (Signed URLs)** is the best immediate solution. This keeps images in GCS but generates temporary signed URLs for access, which is actually more secure than public access.

Would you like me to implement the signed URLs solution?
