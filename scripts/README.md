# Railway Environment Variable Provisioner

Automated service to provision and manage Railway environment variables for the yoracle application.

## Overview

This service ensures all required environment variables are correctly configured in Railway on every deployment. It runs automatically via GitHub Actions on every push to the `main` branch.

## Files

### `provision-railway-env.sh`
Shell script that provisions environment variables to Railway via the Railway GraphQL API.

**Usage:**
```bash
export RAILWAY_TOKEN="your-railway-token"
export RAILWAY_SERVICE_ID="your-service-id"
export RAILWAY_ENVIRONMENT_ID="your-environment-id"
bash scripts/provision-railway-env.sh
```

### `provision-railway-env.ts`
TypeScript version with enhanced features (requires tsx runtime).

**Usage:**
```bash
export RAILWAY_TOKEN="your-railway-token"
export RAILWAY_SERVICE_ID="your-service-id"
export RAILWAY_ENVIRONMENT_ID="your-environment-id"
tsx scripts/provision-railway-env.ts
```

## Required Environment Variables

The provisioner manages these environment variables:

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key

### Clerk Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key (secret)

### AI & Security
- `ANTHROPIC_API_KEY` - Anthropic Claude API key (secret)
- `CONNECTOR_ENCRYPTION_KEY` - 32-character encryption key (secret)

### Application Config
- `NEXT_PUBLIC_BASE_PATH` - Application base path (default: `/apps/yoracle`)

## GitHub Actions Integration

The provisioner runs automatically on every deployment via `.github/workflows/deploy.yml`:

```yaml
- name: Provision Railway environment variables
  run: bash scripts/provision-railway-env.sh
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
    # ... other secrets ...
```

## Setup Instructions

### 1. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

**Railway Credentials:**
- `RAILWAY_TOKEN` - Railway API token
- `RAILWAY_SERVICE_ID` - Railway service ID for yoracle
- `RAILWAY_ENVIRONMENT_ID` - Railway environment ID (production)

**Application Secrets:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY`
- `CONNECTOR_ENCRYPTION_KEY`

### 2. Get Railway Credentials

**Railway Token:**
```bash
railway login
railway token
```

**Service and Environment IDs:**
```bash
# List projects
railway list

# Link to project
railway link

# Get service ID
railway service

# Get environment ID
railway environment
```

Or use the Railway dashboard:
- Service ID: Found in Railway dashboard URL (`.../service/<service-id>`)
- Environment ID: Found in environment settings

### 3. Test Locally

```bash
# Export credentials
export RAILWAY_TOKEN="your-token"
export RAILWAY_SERVICE_ID="your-service-id"
export RAILWAY_ENVIRONMENT_ID="your-environment-id"

# Run provisioner
bash scripts/provision-railway-env.sh
```

## How It Works

1. **On every push to main:**
   - GitHub Actions triggers the deploy workflow
   - Provisioner checks existing Railway environment variables
   - Sets missing variables from GitHub Secrets
   - Sets default values (e.g., `NEXT_PUBLIC_BASE_PATH`)
   - Reports summary of changes

2. **Variable Sources:**
   - **GitHub Secrets**: Sensitive values (API keys, tokens)
   - **Default Values**: Non-sensitive config (base path)
   - **Railway Dashboard**: Manual overrides (if needed)

3. **Idempotent:**
   - Only sets variables that are missing
   - Existing variables are not overwritten
   - Safe to run multiple times

## Troubleshooting

### "Missing Railway credentials"
Ensure `RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID`, and `RAILWAY_ENVIRONMENT_ID` are set as GitHub Secrets.

### "Railway API error"
- Verify Railway token is valid (`railway whoami`)
- Check service and environment IDs are correct
- Ensure token has write permissions

### "Some required environment variables are missing"
The provisioner detected missing variables. Add them to GitHub Secrets or set them manually in the Railway dashboard.

## Manual Railway Configuration

If you prefer to set variables manually via Railway dashboard:

1. Go to Railway dashboard
2. Select yoracle service
3. Go to Variables tab
4. Add each variable from the list above

See `RAILWAY_CONFIG.md` for detailed manual setup instructions.
