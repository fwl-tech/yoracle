#!/usr/bin/env tsx
/**
 * Railway Environment Variable Provisioner
 * 
 * Ensures all required environment variables are set in Railway.
 * Runs automatically on every app rebuild via GitHub Actions.
 */

interface EnvironmentVariable {
  key: string
  value?: string
  required: boolean
  description: string
  secret: boolean
}

const REQUIRED_ENV_VARS: EnvironmentVariable[] = [
  // Supabase
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    secret: false,
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (admin access)',
    secret: true,
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anon/public key',
    secret: false,
  },
  
  // Simple email/password auth
  {
    key: 'AUTH_SESSION_SECRET',
    required: true,
    description: 'Session cookie signing secret (32+ random chars)',
    secret: true,
  },

  // AI & Encryption
  {
    key: 'ANTHROPIC_API_KEY',
    required: true,
    description: 'Anthropic Claude API key',
    secret: true,
  },
  {
    key: 'CONNECTOR_ENCRYPTION_KEY',
    required: true,
    description: '32-character encryption key for connector credentials',
    secret: true,
  },
  
  // Application Config
  {
    key: 'NEXT_PUBLIC_BASE_PATH',
    value: '/apps/yoracle',
    required: true,
    description: 'Application base path',
    secret: false,
  },
]

interface RailwayVariable {
  name: string
  value: string
}

async function getRailwayVariables(
  serviceId: string,
  environmentId: string,
  token: string
): Promise<RailwayVariable[]> {
  const query = `
    query GetVariables($serviceId: String!, $environmentId: String!) {
      variables(serviceId: $serviceId, environmentId: $environmentId) {
        edges {
          node {
            name
            value
          }
        }
      }
    }
  `

  const response = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { serviceId, environmentId },
    }),
  })

  const result = await response.json()
  
  if (result.errors) {
    throw new Error(`Railway API error: ${JSON.stringify(result.errors)}`)
  }

  return result.data?.variables?.edges?.map((edge: any) => edge.node) || []
}

async function setRailwayVariable(
  serviceId: string,
  environmentId: string,
  token: string,
  name: string,
  value: string
): Promise<void> {
  const query = `
    mutation UpsertVariable($input: VariableUpsertInput!) {
      variableUpsert(input: $input) {
        name
        value
      }
    }
  `

  const response = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        input: {
          serviceId,
          environmentId,
          name,
          value,
        },
      },
    }),
  })

  const result = await response.json()

  if (result.errors) {
    throw new Error(`Failed to set variable ${name}: ${JSON.stringify(result.errors)}`)
  }
}

async function main() {
  console.log('🚂 Railway Environment Variable Provisioner')
  console.log('=' .repeat(60))

  const railwayToken = process.env.RAILWAY_TOKEN
  const serviceId = process.env.RAILWAY_SERVICE_ID
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID

  if (!railwayToken || !serviceId || !environmentId) {
    console.error('❌ Missing Railway credentials:')
    console.error(`   RAILWAY_TOKEN: ${!!railwayToken}`)
    console.error(`   RAILWAY_SERVICE_ID: ${!!serviceId}`)
    console.error(`   RAILWAY_ENVIRONMENT_ID: ${!!environmentId}`)
    process.exit(1)
  }

  console.log('📋 Fetching current Railway environment variables...')
  const existingVars = await getRailwayVariables(serviceId, environmentId, railwayToken)
  const existingVarMap = new Map(existingVars.map(v => [v.name, v.value]))

  console.log(`   Found ${existingVars.length} existing variables\n`)

  let missingCount = 0
  let setCount = 0
  let skippedCount = 0

  for (const envVar of REQUIRED_ENV_VARS) {
    const existingValue = existingVarMap.get(envVar.key)
    const sourceValue = process.env[envVar.key]

    if (existingValue) {
      const displayValue = envVar.secret ? '[REDACTED]' : existingValue
      console.log(`✓ ${envVar.key}: ${displayValue}`)
      skippedCount++
      continue
    }

    if (envVar.value) {
      // Has a default value, set it
      console.log(`+ ${envVar.key}: Setting default value "${envVar.value}"`)
      await setRailwayVariable(serviceId, environmentId, railwayToken, envVar.key, envVar.value)
      setCount++
    } else if (sourceValue) {
      // Value available from GitHub Secrets
      const displayValue = envVar.secret ? '[REDACTED from GitHub Secret]' : sourceValue
      console.log(`+ ${envVar.key}: ${displayValue}`)
      await setRailwayVariable(serviceId, environmentId, railwayToken, envVar.key, sourceValue)
      setCount++
    } else {
      // Missing and required
      const secretIndicator = envVar.secret ? ' (secret)' : ''
      console.log(`⚠️  ${envVar.key}: MISSING${secretIndicator}`)
      console.log(`   ${envVar.description}`)
      console.log(`   → Add to GitHub Secrets or Railway Dashboard\n`)
      missingCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary:')
  console.log(`   ✓ Existing: ${skippedCount}`)
  console.log(`   + Set: ${setCount}`)
  console.log(`   ⚠️  Missing: ${missingCount}`)

  if (missingCount > 0) {
    console.log('\n⚠️  WARNING: Some required environment variables are missing.')
    console.log('   The application may not function correctly until these are set.')
    console.log('   Add them to GitHub Secrets (for secrets) or Railway Dashboard.')
    // Don't fail the build, just warn
  } else {
    console.log('\n✅ All required environment variables are configured!')
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
})
