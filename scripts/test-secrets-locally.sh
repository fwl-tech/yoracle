#!/bin/bash
# Test if secrets can be read from GitHub locally
# This helps diagnose secret configuration issues

echo "🔍 Testing GitHub Secrets Accessibility"
echo "========================================"
echo ""
echo "This script helps diagnose why secrets might not be available in GitHub Actions."
echo ""

# Check if gh CLI is authenticated
if ! gh auth status &>/dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "   Run: gh auth login"
    exit 1
fi

echo "✓ GitHub CLI authenticated"
echo ""

# Try to list secrets (will fail with 403 but that's expected)
echo "Attempting to list repository secrets..."
gh secret list 2>&1 || echo "  (403 error is expected - secrets are private)"
echo ""

echo "================================================"
echo "Manual Check Required:"
echo ""
echo "1. Go to: https://github.com/fwl-tech/yoracle/settings/secrets/actions"
echo "2. Verify you see these secrets listed:"
echo "   - RAILWAY_TOKEN"
echo "   - RAILWAY_SERVICE_ID"
echo "   - RAILWAY_ENVIRONMENT_ID"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - AUTH_SESSION_SECRET"
echo "   - ANTHROPIC_API_KEY"
echo "   - CONNECTOR_ENCRYPTION_KEY"
echo ""
echo "3. Click 'Update' on each secret to verify it has a value"
echo "4. Ensure secrets are at REPOSITORY level, not environment level"
echo ""
echo "Common Issues:"
echo "  - Secrets set at organization level may not be accessible"
echo "  - Environment-specific secrets require environment name in workflow"
echo "  - Empty secret values will show as 'set' but pass empty string"
echo "  - Secret names are case-sensitive"
