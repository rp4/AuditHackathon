import { Storage } from '@google-cloud/storage'

// Initialize Google Cloud Storage client
// In production (Cloud Run), uses default credentials
// In development, uses GOOGLE_APPLICATION_CREDENTIALS env var

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
})

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!)

export default storage
