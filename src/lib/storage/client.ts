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

let _bucket: ReturnType<Storage['bucket']> | null = null

export function getBucket() {
  if (!_bucket) {
    if (!process.env.GCS_BUCKET_NAME) {
      throw new Error('GCS_BUCKET_NAME environment variable is not set')
    }
    _bucket = storage.bucket(process.env.GCS_BUCKET_NAME)
  }
  return _bucket
}

/** @deprecated Use getBucket() instead */
export const bucket = new Proxy({} as ReturnType<Storage['bucket']>, {
  get(_, prop) {
    return (getBucket() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export default storage
