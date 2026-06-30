# Centralized Secret Management with hatch-ai-provisioner

## Overview

Yoracle uses **centralized secret management** via the `hatch-ai-provisioner` repository. All secrets are stored in one place and automatically synced to application repositories and Railway on every deployment.

## Architecture

```
┌─────────────────────────────────┐
│  hatch-ai-provisioner           │
│  (Central Secret Store)         │
│                                 │
│  • All application secrets      │
│  • Railway credentials          │
│  • Shared environment vars      │
└─────────────────────────────────┘
                │
                │ On deployment
                ▼
┌─────────────────────────────────┐
│  Provisioner Workflow           │
│  (Secret Sync Logic)            │
│                                 │
│  1. Read secrets from store     │
│  2. Sync to yoracle repo        │
│  3. Push to Railway via API     │
└─────────────────────────────────┘
                │
                ├──────────────┬─────────────┐
                ▼              ▼             ▼
        ┌──────────────┐  ┌──────────┐  ┌──────────┐
        │ yoracle      │  │ ideabase │  │ Other    │
        │ GitHub Repo  │  │ Repo     │  │ Apps     │
        └──────────────┘  └──────────┘  └──────────┘
                │
                ▼
        ┌──────────────┐
        │ Railway      │
        │ Environment  │
        └──────────────┘
```

## How It Works

### On Every Deployment

1. **Push to `main`** triggers the deploy workflow
2. **Sync-secrets job** triggers `hatch-ai-provisioner` workflow via API
3. **Provisioner** copies secrets from central store to yoracle repository
4. **Deploy job** reads synced secrets and provisions Railway
5. **Railway redeploys** with updated environment variables

## Setup Instructions

### Prerequisites

The `hatch-ai-provisioner` repository must have:
- ✅ All application secrets configured
- ✅ Logic to sync secrets to target repositories
- ✅ Workflow that responds to `provision-secrets` event

### Step 1: Create Personal Access Token (PAT)

Create a GitHub PAT with permissions to trigger workflows:

1. Go to: **https://github.com/settings/tokens/new**
2. Token name: `hatch-ai-provisioner-access`
3. Expiration: Choose appropriate duration
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)

### Step 2: Add PAT to Yoracle Repository

1. Go to: **https://github.com/fwl-tech/yoracle/settings/secrets/actions**
2. Click **"New repository secret"**
3. Name: `PROVISIONER_PAT`
4. Value: Paste the token from Step 1
5. Click **"Add secret"**

### Step 3: Verify Setup

Test the integration:

```bash
# Trigger a deployment
git commit --allow-empty -m "Test provisioner integration"
git push origin main

# Watch the workflow
# https://github.com/fwl-tech/yoracle/actions
```

Expected flow:
1. ✅ sync-secrets job triggers provisioner
2. ✅ Provisioner syncs secrets (check hatch-ai-provisioner actions)
3. ✅ deploy job provisions Railway
4. ✅ Application deploys successfully

### Step 4: Verify Secrets Synced

After deployment completes:

```bash
# Check Railway variables
railway variables

# Or check in Railway dashboard:
# https://railway.app/dashboard → yoracle → Variables
```

All required variables should be present:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY`
- `CONNECTOR_ENCRYPTION_KEY`
- `NEXT_PUBLIC_BASE_PATH`

## Workflow Details

### Deploy Workflow (`.github/workflows/deploy.yml`)

```yaml
jobs:
  sync-secrets:
    # Triggers hatch-ai-provisioner to sync secrets
    # Waits 10 seconds for sync to complete
  
  deploy:
    needs: sync-secrets
    # Provisions Railway with synced secrets
    # Triggers Railway redeploy
```

### Manual Secret Sync

Manually trigger secret sync without deploying:

```bash
# Via GitHub UI:
# https://github.com/fwl-tech/yoracle/actions/workflows/sync-secrets-from-provisioner.yml
# Click "Run workflow"

# Or via API:
curl -X POST \
  -H "Authorization: Bearer YOUR_PAT" \
  https://api.github.com/repos/fwl-tech/yoracle/actions/workflows/sync-secrets-from-provisioner.yml/dispatches \
  -d '{"ref":"main"}'
```

## Troubleshooting

### "Provisioner trigger failed"

**Cause:** `PROVISIONER_PAT` is missing or invalid

**Fix:**
1. Verify secret exists: https://github.com/fwl-tech/yoracle/settings/secrets/actions
2. Check PAT has `repo` and `workflow` scopes
3. Ensure PAT hasn't expired
4. Create new PAT if needed

### Secrets still empty after sync

**Cause:** Provisioner workflow didn't complete or failed

**Fix:**
1. Check provisioner workflow logs:
   - https://github.com/fwl-tech/hatch-ai-provisioner/actions
2. Verify provisioner has secrets configured
3. Check provisioner workflow responds to `provision-secrets` event
4. Look for errors in provisioner logs

### Railway variables not updating

**Cause:** Railway credentials missing or invalid

**Fix:**
1. Verify Railway credentials in yoracle:
   - `RAILWAY_TOKEN`
   - `RAILWAY_SERVICE_ID`
   - `RAILWAY_ENVIRONMENT_ID`
2. Test Railway API access:
   ```bash
   railway whoami
   ```

## Benefits of Centralized Secrets

✅ **Single Source of Truth** - All secrets in one repository  
✅ **Easy Updates** - Change once, sync everywhere  
✅ **Consistent Configuration** - All apps use same secrets  
✅ **Access Control** - Manage permissions centrally  
✅ **Audit Trail** - Track secret changes in one place  
✅ **Automated Sync** - No manual secret management  

## Security Considerations

- 🔒 `hatch-ai-provisioner` should be **private**
- 🔒 Limit access to provisioner repository
- 🔒 Rotate `PROVISIONER_PAT` regularly
- 🔒 Use least-privilege Railway tokens
- 🔒 Monitor provisioner workflow logs
- 🔒 Audit secret access periodically

## Related Documentation

- [RAILWAY_CONFIG.md](../RAILWAY_CONFIG.md) - Manual Railway configuration
- [ENVIRONMENT_PROVISIONING.md](ENVIRONMENT_PROVISIONING.md) - Local provisioning
- [DEBUG_SECRETS.md](../DEBUG_SECRETS.md) - Secret debugging guide

## Integration with hatch-ai-provisioner

The yoracle repository expects the provisioner to:

1. **Listen for `provision-secrets` event** via repository_dispatch
2. **Receive payload:**
   ```json
   {
     "repository": "fwl-tech/yoracle",
     "railway_service_id": "service-id",
     "railway_environment_id": "env-id"
   }
   ```
3. **Sync secrets to target repository** using GitHub Secrets API
4. **Update Railway environment variables** using Railway GraphQL API

See `hatch-ai-provisioner` repository for implementation details.
