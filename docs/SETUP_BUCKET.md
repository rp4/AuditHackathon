# GCS Bucket Setup for Profile Images

The profile image upload feature requires the GCS bucket to be publicly readable.

## Make the bucket public

Run this command to allow public read access to all objects in the bucket:

```bash
gcloud storage buckets add-iam-policy-binding gs://toolbox-478717-storage \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

This allows anyone to read objects in the bucket, but only authenticated users (via the API) can upload files.

## Verify the setup

After running the command, you should be able to access uploaded images directly via their public URLs:
```
https://storage.googleapis.com/toolbox-478717-storage/profile-images/{userId}/{timestamp}.{ext}
```

## Alternative: Use Signed URLs

If you prefer not to make the bucket public, you can modify the code to use signed URLs instead. This would require:
1. Setting up a service account with proper credentials
2. Modifying the API to generate signed URLs for reading uploaded images
3. Using those signed URLs in the frontend instead of public URLs

The current implementation assumes a public bucket for simplicity.
