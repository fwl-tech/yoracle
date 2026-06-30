# Quick Fix: Production Error 413630934

## Problem
The application is showing an error because **Supabase environment variables are not configured in Railway**.

## Fastest Solution (5 minutes)

### Option 1: Set Variables in Railway Dashboard (Recommended)

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/dashboard
   - Select your `yoracle` project
   - Click on the service
   - Go to the **"Variables"** tab

2. **Add these variables one by one:**

   Click **"+ New Variable"** for each:

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: [Your Supabase project URL, e.g., https://xxxxx.supabase.co]
   ```

   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [Your Supabase service_role key - found in Supabase Settings > API]
   ```

   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [Your Supabase anon key - found in Supabase Settings > API]
   ```

   ```
   Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   Value: [Your Clerk publishable key - found in Clerk Dashboard]
   ```

   ```
   Name: CLERK_SECRET_KEY
   Value: [Your Clerk secret key - found in Clerk Dashboard > API Keys]
   ```

   ```
   Name: ANTHROPIC_API_KEY
   Value: [Your Anthropic API key - from https://console.anthropic.com]
   ```

   ```
   Name: CONNECTOR_ENCRYPTION_KEY
   Value: [Generate with: openssl rand -hex 16]
   ```

3. **Railway will automatically redeploy** after you add/change variables

4. **Wait 1-2 minutes** for the deployment to complete

5. **Test the application** - the error should be gone!

---

### Option 2: Use Railway CLI

If you have the Railway CLI installed:

```bash
# Login
railway login

# Link to project
railway link

# Set variables (you'll be prompted for values)
railway variables set NEXT_PUBLIC_SUPABASE_URL=your-value
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-value
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-value
railway variables set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-value
railway variables set CLERK_SECRET_KEY=your-value
railway variables set ANTHROPIC_API_KEY=your-value
railway variables set CONNECTOR_ENCRYPTION_KEY=your-value

# Redeploy
railway up --detach
```

---

### Option 3: Enable Automated Sync (Long-term Solution)

Once you fix the immediate issue, set up automated provisioning:

1. **Add secrets to GitHub:**
   - Go to: https://github.com/fwl-tech/yoracle/settings/secrets/actions
   - Click **"New repository secret"**
   - Add each variable from above as a secret

2. **Push to main:**
   - Any push to `main` will automatically sync secrets to Railway

---

## Where to Find Your Credentials

### Supabase
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

### Clerk
1. Go to: https://dashboard.clerk.com
2. Select your application
3. Go to **API Keys**
4. Copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY` ⚠️ Keep secret!

### Anthropic
1. Go to: https://console.anthropic.com
2. Go to **API Keys**
3. Create or copy your API key → `ANTHROPIC_API_KEY` ⚠️ Keep secret!

### Encryption Key
Generate a random 32-character key:
```bash
openssl rand -hex 16
```
Copy the output → `CONNECTOR_ENCRYPTION_KEY` ⚠️ Keep secret!

---

## Verification

After setting the variables:

1. **Check Railway logs:**
   ```bash
   railway logs
   ```

2. **Test the application:**
   - Visit: https://yoracle-production.up.railway.app/apps/yoracle
   - Login with Clerk
   - Should see the dashboard (no error)

3. **Verify variables are set:**
   ```bash
   railway variables
   ```

---

## Still Having Issues?

If you still see the error after setting all variables:

1. **Check the Railway logs** for specific error messages
2. **Verify all keys are correct** (no extra spaces, complete values)
3. **Trigger a manual redeploy:** `railway redeploy` or push a commit to `main`
4. **Wait 1-2 minutes** for the deployment to complete

The most common issue is incorrect or incomplete environment variable values. Double-check each one matches your service provider's dashboard exactly.
