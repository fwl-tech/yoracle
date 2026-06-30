# Railway Environment Variables Configuration

## Problem

The application is currently showing error:
```
Application error: a server-side exception has occurred
Digest: 413630934
```

This indicates that **Supabase environment variables are not configured in Railway**.

## Required Environment Variables

Configure these in Railway Dashboard > Your Service > Variables:

### Supabase (REQUIRED)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (secret)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/public key

### Clerk Authentication (REQUIRED)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key

### AI & Encryption (REQUIRED)
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `CONNECTOR_ENCRYPTION_KEY` - 32-character encryption key

### App Config
- `NEXT_PUBLIC_BASE_PATH=/apps/yoracle`

## How to Fix

1. Go to Railway dashboard
2. Select the yoracle service
3. Click "Variables" tab
4. Add all required variables above
5. Redeploy the service

The application now includes better error messages that will indicate which specific variables are missing.
