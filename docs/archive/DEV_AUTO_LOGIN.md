# Development Auto-Login

This application includes an auto-login feature for development mode that automatically logs you in as a specific user when running on `localhost:3000`.

## Configuration

The auto-login user ID is hardcoded to: `51b0255c-de4d-45d5-90fb-af62e5291435`

## How It Works

1. When the app loads in development mode (`npm run dev` on localhost:3000)
2. The AuthProvider checks if there's an existing session
3. If no session exists, it automatically calls the `/api/dev-auth` endpoint
4. The API route uses the Supabase Admin API to generate a magic link token for the dev user
5. The client uses `verifyOtp` to verify the token and create a valid session
6. You're automatically logged in without any manual interaction

## Security

- **Only works in development mode** (`NODE_ENV=development`)
- **Only works on localhost** (hostname check prevents production usage)
- The `/api/dev-auth` endpoint returns a 403 error in production
- Requires `SUPABASE_SERVICE_ROLE_KEY` to be set in `.env.local`

## Files Involved

- [src/app/api/dev-auth/route.ts](src/app/api/dev-auth/route.ts) - API endpoint that creates the session
- [src/hooks/useAuth.ts](src/hooks/useAuth.ts) - AuthProvider with auto-login logic
- [src/components/providers/QueryProvider.tsx](src/components/providers/QueryProvider.tsx) - Wraps app with AuthProvider

## Console Messages

When auto-login runs, you'll see these console messages:

**Client-side (browser console):**
```
🔧 DEV MODE: No session found, attempting auto-login...
✅ DEV MODE: Auto-logged in as user: 51b0255c-de4d-45d5-90fb-af62e5291435
```

**Server-side (terminal):**
```
🔧 DEV MODE: Starting auto-login process for user: 51b0255c-de4d-45d5-90fb-af62e5291435
🔧 DEV MODE: Supabase URL: Found
🔧 DEV MODE: Service key: Found
🔧 DEV MODE: Creating admin client...
🔧 DEV MODE: Fetching user data...
🔧 DEV MODE: User found, generating magic link...
✅ DEV MODE: Auto-login link generated for user: 51b0255c-de4d-45d5-90fb-af62e5291435
```

## Changing the Dev User

To change which user is automatically logged in, update the `DEV_USER_ID` constant in:
- [src/app/api/dev-auth/route.ts](src/app/api/dev-auth/route.ts#L5)
- [src/hooks/useAuth.ts](src/hooks/useAuth.ts#L37)

## Disabling Auto-Login

To disable auto-login temporarily without removing the code:

1. Comment out the auto-login logic in [src/hooks/useAuth.ts](src/hooks/useAuth.ts)
2. Or set `NODE_ENV=production` in your local environment
3. Or manually sign out after the app loads

## Requirements

- `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env.local`
- The user ID must exist in your Supabase `auth.users` table
- Must be running on localhost (127.0.0.1 or localhost hostname)
