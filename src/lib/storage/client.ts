import { Storage } from '@google-cloud/storage'

// Initialize Google Cloud Storage client
// In production (Cloud Run), uses default credentials
// In development, uses service account key file

let storage: Storage

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Use service account key file (development)
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  })
} else if (process.env.GCS_SERVICE_ACCOUNT_KEY) {
  // Use service account key from environment variable (production)
  const credentials = JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY)
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials,
  })
} else {
  // Use default application credentials
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
  })
}

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!)

export default storage
