# Setup PROVISIONER_PAT Secret

## Current Status

The integration with `hatch-ai-provisioner` is configured, but the workflow failed with:

```
"message": "Bad credentials"
"status": "401"
```

This means the `PROVISIONER_PAT` secret is **missing** from the yoracle repository.

## What You Need to Do

### Step 1: Create Personal Access Token (if you don't have one)

1. Go to: **https://github.com/settings/tokens/new**
2. Token name: `hatch-ai-provisioner-access`
3. Expiration: Choose appropriate duration (recommend 90 days or 1 year)
4. Select scopes:
   - ✅ **`repo`** - Full control of private repositories
   - ✅ **`workflow`** - Update GitHub Action workflows
5. Click **"Generate token"**
6. **COPY THE TOKEN** immediately (you won't see it again!)

### Step 2: Add PAT to Yoracle Repository

1. Go to: **https://github.com/fwl-tech/yoracle/settings/secrets/actions**
2. Click **"New repository secret"**
3. Name: `PROVISIONER_PAT` (must match exactly)
4. Value: Paste the token from Step 1
5. Click **"Add secret"**

### Step 3: Test the Integration

Trigger a deployment to test:

```bash
# Option 1: Push a commit
git commit --allow-empty -m "Test provisioner integration with PAT"
git push origin main

# Option 2: Manually trigger sync workflow
# Go to: https://github.com/fwl-tech/yoracle/actions/workflows/sync-secrets-from-provisioner.yml
# Click "Run workflow"
```

### Step 4: Verify Success

After the workflow completes, check the logs:

1. Go to: https://github.com/fwl-tech/yoracle/actions
2. Click on the latest "Deploy to Railway" workflow
3. Expand "sync-secrets" job
4. Look for:
   ```
   ✅ Response should be empty (204 No Content) or success
   ⚠️ Should NOT show "Bad credentials"
   ```

5. Check if secrets are now in Railway:
   - Go to: https://railway.app/dashboard → yoracle → Variables
   - Verify all 7 secrets are present

## Expected Flow After Setup

Once `PROVISIONER_PAT` is configured:

1. **Push to main** → Deploy workflow triggers
2. **sync-secrets job** → Calls `hatch-ai-provisioner` via API ✅
3. **Provisioner** → Copies secrets from central store to yoracle ✅
4. **deploy job** → Provisions Railway with synced secrets ✅
5. **Railway** → Redeploys with correct environment variables ✅
6. **Application** → Works without errors! ✅

## Alternative: Use Existing PAT

If you already have a PAT that has `repo` and `workflow` scopes:

1. Go to: https://github.com/settings/tokens
2. Find your existing token
3. Click on it to verify it has the required scopes
4. If scopes are correct, add it to yoracle as `PROVISIONER_PAT`
5. If not, regenerate with correct scopes

## Important Notes

- The PAT must have access to **both** repositories:
  - `fwl-tech/hatch-ai-provisioner` (to trigger workflows)
  - `fwl-tech/yoracle` (already has access since you're adding it here)

- The PAT needs these permissions:
  - **`repo`**: To read secrets from provisioner and write to yoracle
  - **`workflow`**: To trigger the provisioner workflow via API

- Keep the PAT secure:
  - Never commit it to code
  - Store only in GitHub Secrets
  - Rotate regularly (recommend every 90 days)

## Troubleshooting

### Still getting "Bad credentials" after adding PAT

1. Verify the secret name is exactly `PROVISIONER_PAT` (case-sensitive)
2. Verify the token hasn't expired
3. Verify the token has `repo` and `workflow` scopes
4. Try regenerating the token with the same scopes
5. Delete and re-add the secret in GitHub

### Provisioner triggered but secrets still empty

1. Check `hatch-ai-provisioner` workflow logs:
   - https://github.com/fwl-tech/hatch-ai-provisioner/actions
2. Verify the provisioner workflow completed successfully
3. Verify the provisioner has the secrets configured
4. Check for errors in the provisioner logs

### How to verify PAT is working

Run this command locally to test the PAT:

```bash
# Replace YOUR_PAT with your actual token
curl -H "Authorization: Bearer YOUR_PAT" \
  https://api.github.com/repos/fwl-tech/hatch-ai-provisioner

# Should return repo details, not "Bad credentials"
```

## Next Steps After Setup

Once `PROVISIONER_PAT` is configured and working:

1. ✅ Secrets will automatically sync on every deployment
2. ✅ Railway variables will be automatically updated
3. ✅ Application will deploy without manual intervention
4. ✅ You can focus on development, not infrastructure!

## Questions?

If you're still having issues after following these steps:

1. Share the output of the sync-secrets job logs
2. Verify you can access https://github.com/fwl-tech/hatch-ai-provisioner
3. Check if the provisioner repository has the expected workflow files

The most common issue is forgetting to add the `PROVISIONER_PAT` secret or using a token without the correct scopes. Double-check these first!
