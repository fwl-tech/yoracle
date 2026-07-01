#!/bin/bash
# Railway Environment Variable Provisioner
# Simple shell script version for systems without Node.js/TypeScript

set -e

echo "🚂 Railway Environment Variable Provisioner"
echo "============================================================"

# Check required Railway credentials
if [ -z "$RAILWAY_TOKEN" ] || [ -z "$RAILWAY_SERVICE_ID" ] || [ -z "$RAILWAY_ENVIRONMENT_ID" ]; then
    echo "❌ Missing Railway credentials:"
    echo "   RAILWAY_TOKEN: ${RAILWAY_TOKEN:+set}"
    echo "   RAILWAY_SERVICE_ID: ${RAILWAY_SERVICE_ID:+set}"
    echo "   RAILWAY_ENVIRONMENT_ID: ${RAILWAY_ENVIRONMENT_ID:+set}"
    exit 1
fi

# Function to check if a variable exists in Railway
check_variable() {
    local var_name=$1
    local query='query($serviceId: String!, $environmentId: String!) { variables(serviceId: $serviceId, environmentId: $environmentId) { edges { node { name } } } }'
    local payload
    payload=$(jq -n --arg query "$query" --arg serviceId "$RAILWAY_SERVICE_ID" --arg environmentId "$RAILWAY_ENVIRONMENT_ID" \
        '{query: $query, variables: {serviceId: $serviceId, environmentId: $environmentId}}')

    curl -s -X POST https://backboard.railway.app/graphql/v2 \
        -H "Authorization: Bearer $RAILWAY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$payload" | grep -q "\"name\":\"$var_name\""
}

# Function to set a Railway variable
set_variable() {
    local var_name=$1
    local var_value=$2
    local mutation='mutation($serviceId: String!, $environmentId: String!, $name: String!, $value: String!) { variableUpsert(input: { serviceId: $serviceId, environmentId: $environmentId, name: $name, value: $value }) { name } }'
    local payload
    payload=$(jq -n --arg query "$mutation" --arg serviceId "$RAILWAY_SERVICE_ID" --arg environmentId "$RAILWAY_ENVIRONMENT_ID" --arg name "$var_name" --arg value "$var_value" \
        '{query: $query, variables: {serviceId: $serviceId, environmentId: $environmentId, name: $name, value: $value}}')

    curl -s -X POST https://backboard.railway.app/graphql/v2 \
        -H "Authorization: Bearer $RAILWAY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$payload" > /dev/null
}

echo "📋 Checking required environment variables..."
echo ""

MISSING_COUNT=0
SET_COUNT=0
EXISTING_COUNT=0

# Check and set NEXT_PUBLIC_BASE_PATH (has default value)
if check_variable "NEXT_PUBLIC_BASE_PATH"; then
    echo "✓ NEXT_PUBLIC_BASE_PATH: /apps/yoracle"
    EXISTING_COUNT=$((EXISTING_COUNT + 1))
else
    echo "+ NEXT_PUBLIC_BASE_PATH: Setting to /apps/yoracle"
    set_variable "NEXT_PUBLIC_BASE_PATH" "/apps/yoracle"
    SET_COUNT=$((SET_COUNT + 1))
fi

# Clerk route URLs (disabled — replaced with simple email/password auth)
CLERK_URL_VARS=()

for entry in "${CLERK_URL_VARS[@]}"; do
    var="${entry%%:*}"
    default="${entry#*:}"
    if check_variable "$var"; then
        echo "✓ $var: [configured]"
        EXISTING_COUNT=$((EXISTING_COUNT + 1))
    else
        echo "+ $var: Setting to $default"
        set_variable "$var" "$default"
        SET_COUNT=$((SET_COUNT + 1))
    fi
done

# Check other required variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "AUTH_SESSION_SECRET"
    "ANTHROPIC_API_KEY"
    "CONNECTOR_ENCRYPTION_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if check_variable "$var"; then
        echo "✓ $var: [configured]"
        EXISTING_COUNT=$((EXISTING_COUNT + 1))
    elif [ -n "${!var}" ]; then
        echo "+ $var: Setting from GitHub Secret"
        set_variable "$var" "${!var}"
        SET_COUNT=$((SET_COUNT + 1))
    else
        echo "⚠️  $var: MISSING"
        MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
done

echo ""
echo "============================================================"
echo "📊 Summary:"
echo "   ✓ Existing: $EXISTING_COUNT"
echo "   + Set: $SET_COUNT"
echo "   ⚠️  Missing: $MISSING_COUNT"
echo ""

if [ $MISSING_COUNT -gt 0 ]; then
    echo "⚠️  WARNING: Some required environment variables are missing."
    echo "   Add them to GitHub Secrets or Railway Dashboard."
else
    echo "✅ All required environment variables are configured!"
fi
