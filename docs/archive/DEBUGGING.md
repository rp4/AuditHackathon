# Debugging Guide - Login & Browse Issues

This document explains the comprehensive debugging that has been added to diagnose login and browse page issues.

## Overview

Extensive logging has been added throughout the authentication flow and data fetching pipeline to identify where issues occur. All logs use emoji prefixes for easy identification.

## Log Prefixes

- 🔐 Authentication flow
- 📋 Session checks
- 👤 User/profile operations
- 🔄 State changes
- 🔍 Query operations
- 📊 Data updates
- 🌐 Component lifecycle
- 🏢 Platform queries
- 🍪 Cookie operations
- 🔧 Client initialization
- ✅ Success messages
- ❌ Error messages
- ⚠️ Warning messages
- ℹ️ Info messages

## Authentication Flow Debugging

### 1. OAuth Callback (`/auth/callback/route.ts`)

**What's logged:**
- Initial callback receipt with all parameters
- OAuth provider errors (if any)
- Code exchange attempts
- Session creation success/failure
- Profile check and creation
- Redirect URLs and destinations

**Key logs to watch:**
```
🔐 [AUTH-CALLBACK] Auth callback received
✅ [AUTH-CALLBACK] Successfully exchanged code for session
📝 [AUTH-CALLBACK] Profile not found, creating one...
✅ [AUTH-CALLBACK] Profile created successfully
🔀 [AUTH-CALLBACK] Redirecting user
```

### 2. Auth Provider (`/hooks/useAuth.ts`)

**What's logged:**
- Initial auth state setup
- Session retrieval and validation
- Auth state changes (login/logout)
- Session expiration detection
- Query invalidation on auth changes
- Periodic session validation (every 5 minutes)

**Key logs to watch:**
```
🔐 [AUTH-PROVIDER] Initializing auth state...
📋 [AUTH-PROVIDER] Initial session check
🔄 [AUTH-PROVIDER] Auth state changed
⚠️ [AUTH-PROVIDER] Session expired, refreshing page...
```

### 3. Header Component (`/components/layouts/Header.tsx`)

**What's logged:**
- Component mount and initialization
- User session retrieval
- Profile fetching
- Auth state listener setup
- Sign-in initiation

**Key logs to watch:**
```
🎯 [HEADER] Component mounted, fetching user and profile...
📋 [HEADER] Initial session
👤 [HEADER] Fetching profile for user
✅ [HEADER] Profile loaded
🔐 [HEADER] Initiating LinkedIn OAuth sign-in...
```

## Data Fetching Debugging

### 1. Browse Page (`/app/browse/page.tsx`)

**What's logged:**
- Component mount
- Platform fetching
- Query parameter updates
- Agents data updates
- Loading and error states

**Key logs to watch:**
```
🌐 [BROWSE] Component mounted, fetching platforms...
✅ [BROWSE] Platforms loaded successfully
🔍 [BROWSE] Query params updated
📊 [BROWSE] Agents data updated
```

### 2. Supabase Queries (`/lib/supabase/queries.ts`)

**What's logged:**
- Query initiation with parameters
- User authentication checks
- Database query execution
- Success/failure results with counts
- Auth errors and session validation

**Key logs to watch:**
```
🔍 [QUERIES] getAgents called with params
👤 [QUERIES] Checking user authentication...
✅ [QUERIES] User authenticated
📡 [QUERIES] Executing query...
✅ [QUERIES] Agents fetched successfully
🏢 [QUERIES] getPlatforms called
```

### 3. Supabase Client (`/lib/supabase/client.ts`)

**What's logged:**
- Client creation (server-side vs browser)
- Singleton pattern usage
- Cookie operations (reading/writing auth cookies)

**Key logs to watch:**
```
🆕 [SUPABASE-CLIENT] Creating new singleton browser client
♻️ [SUPABASE-CLIENT] Returning existing singleton client
🍪 [SUPABASE-CLIENT] Auth cookies found
🍪 [SUPABASE-CLIENT] Setting auth cookie
```

## Common Issue Patterns

### Issue: User logs in but browse page shows no agents

**What to check:**
1. Look for `✅ [AUTH-CALLBACK] Successfully exchanged code for session`
2. Verify `✅ [AUTH-PROVIDER] Initial session check` shows `hasSession: true`
3. Check if `🔍 [QUERIES] getAgents called` is followed by `✅ [QUERIES] Agents fetched successfully`
4. Look for any `❌` error logs in between

### Issue: Session expires unexpectedly

**What to check:**
1. Look for `⚠️ [AUTH-PROVIDER] Session expired, refreshing page...`
2. Check the periodic validation logs `🔍 [AUTH-PROVIDER] Validating session...`
3. Verify cookie persistence with `🍪 [SUPABASE-CLIENT] Auth cookies found`

### Issue: Platforms not loading

**What to check:**
1. Look for `🏢 [QUERIES] getPlatforms called`
2. Check if followed by `✅ [QUERIES] Platforms fetched successfully`
3. Look for any auth errors: `❌ [QUERIES] Error fetching platforms`

### Issue: Stuck in loading state

**What to check:**
1. Verify `📊 [BROWSE] Agents data updated` shows `isLoading: false`
2. Check if queries are completing or hanging
3. Look for any unhandled errors in the auth flow

## How to Use This Debugging

### In Development:
1. Open browser DevTools Console
2. Sign in or navigate to /browse
3. Filter logs by prefix (e.g., search for "[AUTH-" or "[BROWSE]")
4. Follow the flow chronologically
5. Identify where the flow breaks

### In Production:
1. All logs are now enabled in production too
2. Ask users to:
   - Open DevTools (F12)
   - Go to Console tab
   - Reproduce the issue
   - Copy all console output
   - Send to you for analysis

### Recommended Log Filters:
- Authentication issues: Filter by `[AUTH-`
- Data loading issues: Filter by `[QUERIES]` or `[BROWSE]`
- Session issues: Filter by `session` or `🍪`
- All errors: Filter by `❌`

## Next Steps After Identifying Issue

1. **Session/Auth Issues**: Check Supabase dashboard for session settings
2. **Data Loading Issues**: Verify RLS policies and database permissions
3. **Cookie Issues**: Check browser settings and domain configuration
4. **Redirect Issues**: Verify environment variables and callback URLs

## Disabling Debug Logs Later

To disable these logs in production later, you can:
1. Wrap all console.log statements in a helper function
2. Use environment variable to control logging level
3. Search and remove logs with pattern `console.log.*\[.*\]`

For now, these logs are intentionally enabled in production to help diagnose the issue.
