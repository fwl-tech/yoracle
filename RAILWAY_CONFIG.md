# Railway Environment Variables Configuration

## Automated Provisioning (NEW)

Environment variables are now **automatically provisioned** on every deployment via GitHub Actions!

### How It Works
1. Add required secrets to GitHub repository (Settings > Secrets and variables > Actions)
2. On every push to `main`, the provisioner syncs secrets to Railway
3. Missing variables are automatically set
4. Deployment proceeds with correct configuration

See `scripts/README.md` for detailed setup instructions.

---

## Manual Configuration (Legacy)

If you prefer to set variables manually or if automated provisioning is not yet configured:

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

## How to Fix Manually

1. Go to Railway dashboard
2. Select the yoracle service
3. Click "Variables" tab
4. Add all required variables above
5. Redeploy the service

## How to Enable Automated Provisioning

1. Add these secrets to GitHub repository (Settings > Secrets and variables > Actions):
   - `RAILWAY_TOKEN` - Get via `railway login && railway token`
   - `RAILWAY_SERVICE_ID` - Found in Railway dashboard URL
   - `RAILWAY_ENVIRONMENT_ID` - Found in Railway environment settings
   - All application secrets listed above

2. Push to `main` branch - provisioner runs automatically

3. Check GitHub Actions logs to verify provisioning succeeded

The application now includes better error messages that will indicate which specific variables are missing.
