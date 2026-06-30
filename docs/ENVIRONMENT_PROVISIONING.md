# Environment Variable Provisioning for Railway

This guide explains how environment variables are automatically provisioned to Railway on every deployment.

## Overview

The yoracle application uses an automated provisioning system that:
- ✅ Runs on every push to `main` via GitHub Actions
- ✅ Syncs environment variables from GitHub Secrets to Railway
- ✅ Sets default values for non-sensitive config
- ✅ Validates all required variables are present
- ✅ Reports detailed status in CI logs

## Architecture

```
┌─────────────────┐
│  GitHub Secrets │
│                 │
│  • RAILWAY_*    │──┐
│  • SUPABASE_*   │  │
│  • CLERK_*      │  │
│  • ANTHROPIC_*  │  │
└─────────────────┘  │
                     │
                     ▼
        ┌────────────────────────┐
        │  GitHub Actions        │
        │  (.github/workflows/   │
        │   deploy.yml)          │
        │                        │
        │  1. Checkout code      │
        │  2. Run provisioner    │
        │  3. Trigger redeploy   │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Provisioner Script    │
        │  (scripts/provision-   │
        │   railway-env.sh)      │
        │                        │
        │  • Check existing vars │
        │  • Set missing vars    │
        │  • Report status       │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Railway GraphQL API   │
        │                        │
        │  • List variables      │
        │  • Upsert variables    │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Railway Environment   │
        │                        │
        │  yoracle service       │
        │  • Updated env vars    │
        │  • Ready for deploy    │
        └────────────────────────┘
```

## Setup Guide

### Step 1: Create Railway API Token

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login
railway login

# Generate token
railway token
```

Copy the token for the next step.

### Step 2: Get Railway Service & Environment IDs

**Option A: Via Railway CLI**
```bash
# Link to project
railway link

# Get service ID
railway service

# Get environment ID  
railway environment
```

**Option B: Via Railway Dashboard**
1. Go to https://railway.app/dashboard
2. Open your yoracle project
3. Copy Service ID from URL: `.../service/<service-id>`
4. Go to Settings → Environment
5. Copy Environment ID from URL

### Step 3: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:

#### Railway Connection (Required)
- `RAILWAY_TOKEN` - Token from Step 1
- `RAILWAY_SERVICE_ID` - Service ID from Step 2
- `RAILWAY_ENVIRONMENT_ID` - Environment ID from Step 2

#### Application Secrets (Required)

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase project settings (secret!)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase project settings

**Clerk:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- `CLERK_SECRET_KEY` - From Clerk dashboard (secret!)

**AI & Encryption:**
- `ANTHROPIC_API_KEY` - From Anthropic console (secret!)
- `CONNECTOR_ENCRYPTION_KEY` - Generate 32-char random string (secret!)

**Generate encryption key:**
```bash
openssl rand -hex 16
```

### Step 4: Verify Setup

1. Push a commit to `main` branch
2. Go to GitHub Actions tab
3. Watch the "Deploy to Railway" workflow
4. Check the "Provision Railway environment variables" step

You should see output like:
```
🚂 Railway Environment Variable Provisioner
============================================================
📋 Checking required environment variables...

✓ NEXT_PUBLIC_BASE_PATH: /apps/yoracle
+ NEXT_PUBLIC_SUPABASE_URL: Setting from GitHub Secret
+ SUPABASE_SERVICE_ROLE_KEY: Setting from GitHub Secret
...

============================================================
📊 Summary:
   ✓ Existing: 1
   + Set: 7
   ⚠️  Missing: 0

✅ All required environment variables are configured!
```

## Troubleshooting

### Error: "Missing Railway credentials"

**Problem:** `RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID`, or `RAILWAY_ENVIRONMENT_ID` not set in GitHub Secrets.

**Solution:**
1. Verify secrets are added to GitHub (Settings → Secrets and variables → Actions)
2. Check secret names match exactly (case-sensitive)
3. Ensure you added them as "repository secrets" not "environment secrets"

### Error: "Railway API error"

**Problem:** Railway token is invalid or lacks permissions.

**Solution:**
1. Generate a new Railway token:
   ```bash
   railway login
   railway token
   ```
2. Update `RAILWAY_TOKEN` in GitHub Secrets
3. Ensure token has write access to the project

### Error: "Some required environment variables are missing"

**Problem:** Not all application secrets are set in GitHub Secrets.

**Solution:**
1. Check which variables are missing in the CI logs
2. Add missing secrets to GitHub Secrets
3. Push again to re-run provisioner

### Variables not syncing to Railway

**Problem:** Provisioner runs but variables don't appear in Railway.

**Solution:**
1. Verify Service ID and Environment ID are correct:
   ```bash
   railway service
   railway environment
   ```
2. Check Railway dashboard → Variables tab
3. Look for API errors in CI logs

### Local Testing

Test the provisioner locally before pushing:

```bash
# Export credentials
export RAILWAY_TOKEN="your-token"
export RAILWAY_SERVICE_ID="your-service-id"
export RAILWAY_ENVIRONMENT_ID="your-environment-id"

# Export app secrets (optional)
export NEXT_PUBLIC_SUPABASE_URL="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
# ... etc

# Run provisioner
npm run provision:railway

# Or directly
bash scripts/provision-railway-env.sh
```

## Security Best Practices

### GitHub Secrets
- ✅ Use GitHub Secrets for all sensitive values
- ✅ Never commit secrets to repository
- ✅ Rotate secrets regularly
- ✅ Use least-privilege Railway tokens

### Railway Variables
- ✅ Mark sensitive variables as "secret" in Railway
- ✅ Use different tokens for staging vs production
- ✅ Audit variable changes regularly

### Encryption Keys
- ✅ Generate strong random keys (32+ characters)
- ✅ Never reuse keys across environments
- ✅ Store backup copies securely (password manager)

## Advanced Configuration

### Custom Variable Sources

Edit `scripts/provision-railway-env.sh` to add custom logic:

```bash
# Example: Read from .env file
if [ -f .env.railway ]; then
    source .env.railway
fi

# Example: Use different values per environment
if [ "$RAILWAY_ENVIRONMENT_ID" = "prod-env-id" ]; then
    export FEATURE_FLAG_X="true"
else
    export FEATURE_FLAG_X="false"
fi
```

### Multiple Environments

To provision multiple Railway environments:

1. Add environment-specific secrets to GitHub:
   - `RAILWAY_ENVIRONMENT_ID_PROD`
   - `RAILWAY_ENVIRONMENT_ID_STAGING`

2. Modify workflow to run provisioner twice:
   ```yaml
   - name: Provision production
     run: bash scripts/provision-railway-env.sh
     env:
       RAILWAY_ENVIRONMENT_ID: ${{ secrets.RAILWAY_ENVIRONMENT_ID_PROD }}
       # ...

   - name: Provision staging
     run: bash scripts/provision-railway-env.sh
     env:
       RAILWAY_ENVIRONMENT_ID: ${{ secrets.RAILWAY_ENVIRONMENT_ID_STAGING }}
       # ...
   ```

### Conditional Provisioning

Skip provisioning in certain cases:

```yaml
- name: Provision Railway environment variables
  if: github.ref == 'refs/heads/main'
  run: bash scripts/provision-railway-env.sh
```

## FAQ

**Q: Will this overwrite my existing Railway variables?**  
A: No, the provisioner only sets missing variables. Existing variables are preserved.

**Q: Can I still manually set variables in Railway dashboard?**  
A: Yes! Manual changes in Railway are not overwritten. The provisioner is additive.

**Q: How do I update a variable value?**  
A: Update the GitHub Secret, then delete the variable from Railway dashboard. On next deploy, it will be set to the new value.

**Q: Does this work with Railway CLI deploys?**  
A: No, this only works with GitHub Actions deploys. For Railway CLI, set variables manually or run the script locally before deploying.

**Q: Can I use this for other Railway services?**  
A: Yes! Just update `RAILWAY_SERVICE_ID` to point to a different service.

## Related Documentation

- [RAILWAY_CONFIG.md](../RAILWAY_CONFIG.md) - Manual Railway configuration
- [scripts/README.md](../scripts/README.md) - Provisioner script details
- [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) - Deployment workflow

## Support

If you encounter issues:
1. Check CI logs in GitHub Actions tab
2. Verify Railway credentials with `railway whoami`
3. Test provisioner locally with debug output
4. Check Railway API status: https://status.railway.app
