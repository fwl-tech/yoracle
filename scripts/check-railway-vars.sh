#!/bin/bash
# Check which environment variables are currently set in Railway

set -e

echo "🔍 Railway Environment Variable Checker"
echo "========================================"
echo ""

# Check required Railway credentials
if [ -z "$RAILWAY_TOKEN" ] || [ -z "$RAILWAY_SERVICE_ID" ] || [ -z "$RAILWAY_ENVIRONMENT_ID" ]; then
    echo "❌ Missing Railway credentials. Please set:"
    echo ""
    echo "   export RAILWAY_TOKEN='your-token'"
    echo "   export RAILWAY_SERVICE_ID='your-service-id'"  
    echo "   export RAILWAY_ENVIRONMENT_ID='your-environment-id'"
    echo ""
    echo "Get these values:"
    echo "   railway login"
    echo "   railway token"
    echo "   railway service"
    echo "   railway environment"
    exit 1
fi

echo "Fetching current Railway environment variables..."
echo ""

# Query Railway for current variables
query='query { variables(serviceId: \"'$RAILWAY_SERVICE_ID'\", environmentId: \"'$RAILWAY_ENVIRONMENT_ID'\") { edges { node { name } } } }'

response=$(curl -s -X POST https://backboard.railway.app/graphql/v2 \
    -H "Authorization: Bearer $RAILWAY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\"}")

if echo "$response" | grep -q '"errors"'; then
    echo "❌ Failed to fetch variables"
    echo "Response: $response"
    exit 1
fi

# Extract variable names
variables=$(echo "$response" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

# Required variables
required_vars=(
    "NEXT_PUBLIC_BASE_PATH"
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "ANTHROPIC_API_KEY"
    "CONNECTOR_ENCRYPTION_KEY"
)

echo "📋 Required Variables Status:"
echo ""

missing_count=0
present_count=0

for var in "${required_vars[@]}"; do
    if echo "$variables" | grep -q "^${var}$"; then
        echo "✓ $var: SET"
        present_count=$((present_count + 1))
    else
        echo "✗ $var: MISSING"
        missing_count=$((missing_count + 1))
    fi
done

echo ""
echo "========================================"
echo "Summary:"
echo "  ✓ Present: $present_count"
echo "  ✗ Missing: $missing_count"
echo ""

if [ $missing_count -gt 0 ]; then
    echo "⚠️  Some required variables are missing!"
    echo ""
    echo "To fix:"
    echo "  1. Set variables in Railway dashboard"
    echo "  2. OR add to GitHub Secrets and push to main"
    echo "  3. OR run: bash scripts/setup-railway-vars.sh"
    echo ""
    echo "See QUICK_FIX.md for detailed instructions."
else
    echo "✅ All required variables are present!"
    echo ""
    echo "If you're still seeing errors, check:"
    echo "  1. Variable values are correct"
    echo "  2. Railway logs: railway logs"
    echo "  3. Application is redeployed"
fi
