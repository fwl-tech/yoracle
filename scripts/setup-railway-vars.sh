#!/bin/bash
# One-time setup script to configure Railway environment variables
# This script will prompt for each required variable and set it in Railway

set -e

echo "🚂 Railway Environment Variable Setup"
echo "======================================"
echo ""
echo "This script will help you configure all required environment variables in Railway."
echo "You'll be prompted to enter each value. Press Ctrl+C to cancel at any time."
echo ""

# Check required Railway credentials
if [ -z "$RAILWAY_TOKEN" ] || [ -z "$RAILWAY_SERVICE_ID" ] || [ -z "$RAILWAY_ENVIRONMENT_ID" ]; then
    echo "❌ Missing Railway credentials. Please set:"
    echo "   export RAILWAY_TOKEN='your-token'"
    echo "   export RAILWAY_SERVICE_ID='your-service-id'"
    echo "   export RAILWAY_ENVIRONMENT_ID='your-environment-id'"
    echo ""
    echo "Get these values from Railway CLI:"
    echo "   railway login"
    echo "   railway token"
    echo "   railway service"
    echo "   railway environment"
    exit 1
fi

# Function to set a Railway variable
set_railway_var() {
    local var_name=$1
    local var_value=$2
    
    echo "Setting $var_name..."
    
    # Escape quotes in the value
    local escaped_value=$(echo "$var_value" | sed 's/"/\\"/g')
    
    local mutation='mutation { variableUpsert(input: { serviceId: \"'$RAILWAY_SERVICE_ID'\", environmentId: \"'$RAILWAY_ENVIRONMENT_ID'\", name: \"'$var_name'\", value: \"'$escaped_value'\" }) { name } }'
    
    local response=$(curl -s -X POST https://backboard.railway.app/graphql/v2 \
        -H "Authorization: Bearer $RAILWAY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$mutation\"}")
    
    if echo "$response" | grep -q '"errors"'; then
        echo "❌ Failed to set $var_name"
        echo "   Response: $response"
        return 1
    fi
    
    echo "✓ Set $var_name"
}

# Prompt for each variable
echo "📋 Enter values for each environment variable:"
echo ""

# NEXT_PUBLIC_BASE_PATH (has default)
echo "1. NEXT_PUBLIC_BASE_PATH"
echo "   Default: /apps/yoracle"
read -p "   Enter value (press Enter for default): " BASE_PATH
BASE_PATH=${BASE_PATH:-/apps/yoracle}
set_railway_var "NEXT_PUBLIC_BASE_PATH" "$BASE_PATH"
echo ""

# Supabase variables
echo "2. NEXT_PUBLIC_SUPABASE_URL"
echo "   Example: https://xxxxx.supabase.co"
read -p "   Enter value: " SUPABASE_URL
if [ -n "$SUPABASE_URL" ]; then
    set_railway_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
else
    echo "⚠️  Skipped (empty)"
fi
echo ""

echo "3. SUPABASE_SERVICE_ROLE_KEY (secret)"
echo "   This is the service_role key from Supabase"
read -sp "   Enter value: " SUPABASE_SERVICE_KEY
echo ""
if [ -n "$SUPABASE_SERVICE_KEY" ]; then
    set_railway_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_KEY"
else
    echo "⚠️  Skipped (empty)"
fi
echo ""

echo "4. NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   This is the anon/public key from Supabase"
read -p "   Enter value: " SUPABASE_ANON_KEY
if [ -n "$SUPABASE_ANON_KEY" ]; then
    set_railway_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
else
    echo "⚠️  Skipped (empty)"
fi
echo ""

# Clerk variables
echo "5. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "   Example: pk_test_xxxxx"
read -p "   Enter value: " CLERK_PUB_KEY
if [ -n "$CLERK_PUB_KEY" ]; then
    set_railway_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "$CLERK_PUB_KEY"
else
    echo "⚠️  Skipped (empty)"
fi
echo ""

echo "6. CLERK_SECRET_KEY (secret)"
echo "   Example: sk_test_xxxxx"
read -sp "   Enter value: " CLERK_SECRET
echo ""
if [ -n "$CLERK_SECRET" ]; then
    set_railway_var "CLERK_SECRET_KEY" "$CLERK_SECRET"
else
    echo "⚠️  Skipped (empty)"
fi
echo ""

# Anthropic
echo "7. ANTHROPIC_API_KEY (secret)"
read -sp "   Enter value: " ANTHROPIC_KEY
echo ""
if [ -n "$ANTHROPIC_KEY" ]; then
    set_railway_var "ANTHROPIC_API_KEY" "$ANTHROPIC_KEY"
else
    echo "⚠️  Skipped (empty)"
fi
echo ""

# Encryption key
echo "8. CONNECTOR_ENCRYPTION_KEY (secret)"
echo "   Generate with: openssl rand -hex 16"
read -sp "   Enter value: " ENCRYPTION_KEY
echo ""
if [ -n "$ENCRYPTION_KEY" ]; then
    set_railway_var "CONNECTOR_ENCRYPTION_KEY" "$ENCRYPTION_KEY"
else
    echo "⚠️  Skipped (empty)"
fi
echo ""

echo "======================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify variables in Railway dashboard"
echo "2. Trigger a redeploy: railway redeploy"
echo "3. Check application logs: railway logs"
