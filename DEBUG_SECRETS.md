# Debugging GitHub Secrets Issue

## Problem Identified

Your GitHub Actions workflow shows that secrets **exist** but are **empty**:

```
RAILWAY_TOKEN: ***                          ✓ Working
RAILWAY_SERVICE_ID: ***                     ✓ Working  
RAILWAY_ENVIRONMENT_ID: ***                 ✓ Working
NEXT_PUBLIC_SUPABASE_URL:                   ✗ Empty
SUPABASE_SERVICE_ROLE_KEY:                  ✗ Empty
NEXT_PUBLIC_SUPABASE_ANON_KEY:              ✗ Empty
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:          ✗ Empty
CLERK_SECRET_KEY:                           ✗ Empty
ANTHROPIC_API_KEY:                          ✗ Empty
CONNECTOR_ENCRYPTION_KEY:                   ✗ Empty
```

## Root Cause

The most common causes are:

1. **Secrets are set at Organization level** instead of Repository level
2. **Secret values are actually empty** (secret exists but no value)
3. **Secrets are environment-specific** but workflow doesn't specify environment
4. **Secret names have typos** or don't match exactly

## How to Fix

### Step 1: Verify Secret Location

1. Go to: **https://github.com/fwl-tech/yoracle/settings/secrets/actions**

2. Check the "Repository secrets" section (not "Organization secrets")

3. You should see all these listed:
   - RAILWAY_TOKEN ✓ (working)
   - RAILWAY_SERVICE_ID ✓ (working)
   - RAILWAY_ENVIRONMENT_ID ✓ (working)
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   - CLERK_SECRET_KEY
   - ANTHROPIC_API_KEY
   - CONNECTOR_ENCRYPTION_KEY

### Step 2: Verify Secret Values

For each secret that's showing as empty:

1. Click **"Update"** next to the secret name
2. Verify there's a value in the text box (not empty/blank)
3. If empty, paste the correct value
4. Click **"Update secret"**

### Step 3: Check Secret Names Match Exactly

Secret names are **case-sensitive** and must match exactly:

```bash
# Correct names (copy these exactly):
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
ANTHROPIC_API_KEY
CONNECTOR_ENCRYPTION_KEY
```

### Step 4: Re-add Secrets if Needed

If secrets are at organization level or have wrong names, delete and re-add them:

1. Click **"New repository secret"**
2. Name: `NEXT_PUBLIC_SUPABASE_URL` (exact match)
3. Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
4. Click **"Add secret"**

Repeat for each secret.

### Step 5: Test the Fix

Run the diagnostic workflow to verify secrets are now accessible:

1. Go to: **https://github.com/fwl-tech/yoracle/actions/workflows/check-secrets.yml**
2. Click **"Run workflow"** → **"Run workflow"**
3. Wait for it to complete (10 seconds)
4. Click on the workflow run
5. Expand "Check which secrets are available"
6. Verify all show as **"✓ SET"**

### Step 6: Deploy Again

Once secrets are fixed:

1. Push any commit to `main`, OR
2. Manually trigger deploy workflow:
   ```bash
   git commit --allow-empty -m "Trigger deployment with fixed secrets"
   git push origin main
   ```

3. Watch the deployment logs - secrets should now sync to Railway
4. Test the application - error should be gone

## Alternative: Manual Railway Setup

If you're still having trouble with GitHub Secrets, you can set variables directly in Railway:

```bash
# Set variables in Railway Dashboard
https://railway.app/dashboard
→ Select yoracle project
→ Click Variables tab
→ Add each variable

# OR use Railway CLI:
railway variables set NEXT_PUBLIC_SUPABASE_URL=your-value
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-value
# ... etc
railway redeploy
```

## Where to Get Secret Values

### Supabase
- URL: https://supabase.com/dashboard → Project → Settings → API
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key (secret)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key

### Clerk
- URL: https://dashboard.clerk.com → Your App → API Keys
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Publishable key
- `CLERK_SECRET_KEY`: Secret key (secret)

### Anthropic
- URL: https://console.anthropic.com → API Keys
- `ANTHROPIC_API_KEY`: Your API key (secret)

### Encryption Key
Generate a random 32-character key:
```bash
openssl rand -hex 16
```
Use output for `CONNECTOR_ENCRYPTION_KEY`

## Verify Current Secret Status

Run this locally to check which secrets GitHub sees as configured:

```bash
cd /workspace
bash scripts/test-secrets-locally.sh
```

Or check manually at:
**https://github.com/fwl-tech/yoracle/settings/secrets/actions**

## Still Need Help?

If secrets are still not working after following these steps:

1. Share a screenshot of: https://github.com/fwl-tech/yoracle/settings/secrets/actions
2. Run the check-secrets workflow and share the output
3. Verify you have admin/write access to the repository

The issue is definitely with how secrets are configured in GitHub - once that's fixed, the automated provisioning will work correctly.
