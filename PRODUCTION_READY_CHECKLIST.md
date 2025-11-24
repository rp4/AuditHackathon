# Production Deployment Checklist

## ✅ CRITICAL ISSUES - FIXED

### 1. Account Restoration Vulnerability - FIXED ✅
**File:** `src/lib/auth/config.ts`
- Removed automatic account restoration via login
- Deleted accounts cannot be restored through credentials or OAuth
- Users must contact support for account restoration

### 2. Environment Validation Updated - FIXED ✅
**File:** `src/lib/env.ts`
- Removed Supabase references
- Updated for GCP (Cloud SQL, Cloud Storage, Cloud Run)
- Validates: DATABASE_URL, NEXTAUTH_*, LINKEDIN_*, GCP_PROJECT_ID, GCS_BUCKET_NAME

### 3. Admin Authorization for Featured Tools - FIXED ✅
**File:** `src/app/api/tools/[id]/route.ts`
- Only admins can set `is_featured: true` on tools
- Regular users cannot feature their own tools

### 4. TypeScript Compilation Error - FIXED ✅
**File:** `src/app/api/tools/[id]/route.ts`
- Fixed variable scope issue in PATCH and DELETE error handlers
- Build now succeeds (verified with `npm run type-check`)

### 5. Soft Delete Check - User Profile - FIXED ✅
**File:** `src/app/api/users/[id]/route.ts`
- Added `isDeleted: false` filter to user lookup
- Deleted user profiles are no longer accessible via API

### 6. Soft Delete Filter - Favorites - FIXED ✅
**File:** `src/lib/db/favorites.ts`
- Added `isDeleted: false` filter to getUserFavorites
- Users no longer see deleted tools in their favorites

### 7. Tool Existence Validation - FIXED ✅
**Files:** `src/app/api/favorites/route.ts`, `src/app/api/ratings/route.ts`
- Validate tool exists and is not deleted before creating favorite/rating
- Prevents orphaned records and database integrity issues

### 8. Debug Logging Removed - FIXED ✅
**File:** `src/app/profile/[id]/page.tsx`
- Removed console.log that exposed sensitive user data

### 9. Structured Logging Added - PARTIAL ✅
**Files:** Updated critical API routes
- ✅ `src/app/api/tools/[id]/route.ts`
- ✅ `src/app/api/upload/route.ts`
- ✅ `src/app/api/upload/profile-image/route.ts`
- ✅ `src/app/api/users/[id]/route.ts`
- ✅ `src/app/api/favorites/route.ts`
- ✅ `src/app/api/ratings/route.ts`

**Remaining console.error to fix (non-blocking):**
- `src/app/api/tools/route.ts`
- `src/app/api/profile/route.ts`
- `src/app/api/profile/delete/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/platforms/route.ts`
- `src/app/api/user/admin-status/route.ts`
- `src/app/api/admin/stats/route.ts`
- `src/app/api/admin/featured/route.ts`

---

## 🔧 REQUIRED BEFORE DEPLOYMENT

### Environment Variables (Cloud Run)
Configure these in Google Cloud Run:

```bash
# Database
DATABASE_URL="postgresql://user:pass@/database?host=/cloudsql/PROJECT:REGION:INSTANCE"

# NextAuth
NEXTAUTH_URL="https://audittoolbox.com"
NEXTAUTH_SECRET="<GENERATE 32+ CHAR RANDOM STRING>"

# LinkedIn OAuth
LINKEDIN_CLIENT_ID="<YOUR_LINKEDIN_CLIENT_ID>"
LINKEDIN_CLIENT_SECRET="<YOUR_LINKEDIN_CLIENT_SECRET>"

# GCP
GCP_PROJECT_ID="toolbox-478717"
GCS_BUCKET_NAME="toolbox-478717-storage"

# Optional but HIGHLY RECOMMENDED
UPSTASH_REDIS_REST_URL="https://YOUR-REDIS.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<YOUR_TOKEN>"

# Optional - Error Tracking
SENTRY_DSN="<YOUR_SENTRY_DSN>"
NEXT_PUBLIC_SENTRY_DSN="<YOUR_SENTRY_DSN>"

# Environment
NODE_ENV="production"
```

### Generate New Secrets
```bash
# Generate NextAuth Secret (32+ characters)
openssl rand -base64 32

# Ensure all secrets in .env.local are rotated and stored in Google Secret Manager
```

### Cloud SQL Setup
```bash
# Enable automated backups
gcloud sql instances patch toolbox-db \
  --backup-start-time=02:00 \
  --enable-bin-log \
  --retained-backups-count=7

# Enable point-in-time recovery
gcloud sql instances patch toolbox-db \
  --enable-point-in-time-recovery
```

### Rate Limiting Setup (RECOMMENDED)
Configure Upstash Redis for production rate limiting:
1. Create Upstash Redis instance at https://upstash.com
2. Add UPSTASH_REDIS_REST_URL and TOKEN to Cloud Run environment
3. Without Redis, rate limiting falls back to in-memory (not ideal for multi-instance Cloud Run)

---

## ✅ PRE-DEPLOYMENT TESTS

Run these commands before deploying:

```bash
# Type check
npm run type-check

# Build test
npm run build

# Lint check
npm run lint

# Test database connection (with cloud-sql-proxy running)
npx prisma db push --skip-generate

# Test GCS bucket access
# (Verify in GCP Console that bucket exists and has proper permissions)
```

---

## 📋 DEPLOYMENT STEPS

### 1. Build and Deploy
```bash
# Deploy to Cloud Run via Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or deploy directly with pre-built image
gcloud run deploy openauditswarms \
  --image gcr.io/toolbox-478717/openauditswarms:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-cloudsql-instances="toolbox-478717:us-central1:toolbox-db"
```

### 2. Verify Health
```bash
# Check service is running
gcloud run services describe openauditswarms --region us-central1

# Test health endpoint (after deploying)
curl https://audittoolbox.com/api/health
```

### 3. Run Database Migrations
```bash
# Deploy migrations to production database
DATABASE_URL="<PRODUCTION_URL>" npx prisma migrate deploy
```

---

## 🎯 POST-DEPLOYMENT MONITORING

### Immediate Checks (First 24 Hours)
- [ ] Monitor Cloud Run logs for errors
- [ ] Check authentication flow (LinkedIn OAuth)
- [ ] Test tool upload and image uploads
- [ ] Verify rate limiting is working
- [ ] Monitor database connection pool usage
- [ ] Check error rates in Cloud Monitoring

### Setup Monitoring
```bash
# Cloud Monitoring Alerts
# - Set up alerts for:
#   - Error rate > 5%
#   - Response time > 2s (p95)
#   - Database connection errors
#   - Cloud Storage upload failures

# Cloud Logging
# - Create log-based metrics for:
#   - Failed authentication attempts
#   - 500 errors
#   - Rate limit exceeded
```

---

## 📊 KNOWN LIMITATIONS

### Rate Limiting
- **Current State:** In-memory fallback if Upstash Redis not configured
- **Impact:** Rate limiting won't work properly across multiple Cloud Run instances
- **Recommendation:** Configure Upstash Redis before high traffic

### Logging
- **Current State:** Some API routes still use console.error (non-blocking)
- **Impact:** Inconsistent error logging
- **Recommendation:** Complete migration to logger utility post-launch

### Performance
- **N+1 Queries:** Comment loading for popular tools may be slow
- **Recommendation:** Implement pagination for comments if needed

---

## 🔒 SECURITY REVIEW SUMMARY

### ✅ SECURE
- Authentication & session management
- Admin authorization checks
- Soft delete implementation
- CSRF protection
- Security headers (CSP, HSTS, X-Frame-Options)
- Input validation (Zod schemas)
- File upload restrictions (images only, 10MB limit)
- Password hashing (BCrypt)
- SQL injection prevention (Prisma ORM)

### ⚠️ RECOMMENDED IMPROVEMENTS (Post-Launch)
- Add DOMPurify for rich text sanitization
- Implement request size limits at reverse proxy
- Add Sentry for production error tracking
- Configure Prisma connection pooling explicitly

---

## 📝 ROLLBACK PLAN

If issues occur in production:

```bash
# 1. Rollback to previous revision
gcloud run services update-traffic openauditswarms \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region us-central1

# 2. Check logs for issues
gcloud run services logs read openauditswarms --region us-central1

# 3. If database migration issues, rollback migration
# (Have backup of database ready)
```

---

## ✅ PRODUCTION READY STATUS

**Overall Assessment: PRODUCTION READY** 🚀

All critical security vulnerabilities have been addressed:
- ✅ No exposed secrets (after rotation)
- ✅ No authentication bypasses
- ✅ No authorization vulnerabilities
- ✅ Proper data isolation (soft deletes)
- ✅ TypeScript compiles successfully
- ✅ Core API routes use structured logging

**Recommendation:** Deploy to production after:
1. Rotating all secrets from .env.local
2. Configuring environment variables in Cloud Run
3. Setting up Upstash Redis for rate limiting
4. Running final type-check and build test

**Post-Launch Priorities:**
1. Complete logger migration for remaining routes
2. Set up error tracking (Sentry)
3. Configure monitoring alerts
4. Monitor performance and optimize as needed

---

## 🆘 SUPPORT CONTACTS

**Technical Issues:**
- Check Cloud Run logs: `gcloud run services logs read openauditswarms`
- Database issues: Connect via Cloud SQL Proxy
- Storage issues: Check GCS bucket permissions

**Emergency Rollback:**
- Use revision rollback command above
- Contact GCP support if infrastructure issues

---

*Last Updated: 2025-11-24*
*Audit Version: 2.0*
