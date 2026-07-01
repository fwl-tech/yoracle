import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'

describe('Railway Environment Provisioning', () => {
  const scriptsDir = join(process.cwd(), 'scripts')

  describe('Provisioning Scripts', () => {
    it('provision-railway-env.sh exists', () => {
      const scriptPath = join(scriptsDir, 'provision-railway-env.sh')
      expect(existsSync(scriptPath)).toBe(true)
    })

    it('provision-railway-env.sh is executable', () => {
      const scriptPath = join(scriptsDir, 'provision-railway-env.sh')
      const stats = statSync(scriptPath)
      const isExecutable = (stats.mode & 0o111) !== 0
      expect(isExecutable).toBe(true)
    })

    it('provision-railway-env.ts exists', () => {
      const scriptPath = join(scriptsDir, 'provision-railway-env.ts')
      expect(existsSync(scriptPath)).toBe(true)
    })

    it('provision-railway-env.sh has valid bash shebang', () => {
      const scriptPath = join(scriptsDir, 'provision-railway-env.sh')
      const content = readFileSync(scriptPath, 'utf-8')
      expect(content.startsWith('#!/bin/bash')).toBe(true)
    })

    it('provision-railway-env.ts has valid node shebang', () => {
      const scriptPath = join(scriptsDir, 'provision-railway-env.ts')
      const content = readFileSync(scriptPath, 'utf-8')
      expect(content.startsWith('#!/usr/bin/env tsx')).toBe(true)
    })
  })

  describe('Required Environment Variables', () => {
    const scriptPath = join(scriptsDir, 'provision-railway-env.sh')
    const scriptContent = readFileSync(scriptPath, 'utf-8')

    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'AUTH_SESSION_SECRET',
      'ANTHROPIC_API_KEY',
      'CONNECTOR_ENCRYPTION_KEY',
      'NEXT_PUBLIC_BASE_PATH',
    ]

    requiredVars.forEach(varName => {
      it(`checks for ${varName}`, () => {
        expect(scriptContent).toContain(varName)
      })
    })
  })

  describe('GitHub Actions Integration', () => {
    it('deploy workflow includes provisioning step', () => {
      const workflowPath = join(process.cwd(), '.github/workflows/deploy.yml')
      expect(existsSync(workflowPath)).toBe(true)

      const content = readFileSync(workflowPath, 'utf-8')
      expect(content).toContain('Provision Railway environment variables')
      expect(content).toContain('scripts/provision-railway-env.sh')
    })

    it('deploy workflow has Railway credentials', () => {
      const workflowPath = join(process.cwd(), '.github/workflows/deploy.yml')
      const content = readFileSync(workflowPath, 'utf-8')

      expect(content).toContain('RAILWAY_TOKEN')
      expect(content).toContain('RAILWAY_SERVICE_ID')
      expect(content).toContain('RAILWAY_ENVIRONMENT_ID')
    })

    it('deploy workflow passes application secrets', () => {
      const workflowPath = join(process.cwd(), '.github/workflows/deploy.yml')
      const content = readFileSync(workflowPath, 'utf-8')

      const expectedSecrets = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'AUTH_SESSION_SECRET',
        'ANTHROPIC_API_KEY',
        'CONNECTOR_ENCRYPTION_KEY',
      ]

      expectedSecrets.forEach(secret => {
        expect(content).toContain(secret)
      })
    })

    it('provisioning runs before redeploy', () => {
      const workflowPath = join(process.cwd(), '.github/workflows/deploy.yml')
      const content = readFileSync(workflowPath, 'utf-8')

      const provisionIndex = content.indexOf('Provision Railway environment variables')
      const redeployIndex = content.indexOf('Trigger Railway redeploy')

      expect(provisionIndex).toBeGreaterThan(-1)
      expect(redeployIndex).toBeGreaterThan(-1)
      expect(provisionIndex).toBeLessThan(redeployIndex)
    })
  })

  describe('Documentation', () => {
    it('scripts/README.md exists', () => {
      const readmePath = join(scriptsDir, 'README.md')
      expect(existsSync(readmePath)).toBe(true)
    })

    it('docs/ENVIRONMENT_PROVISIONING.md exists', () => {
      const docsPath = join(process.cwd(), 'docs/ENVIRONMENT_PROVISIONING.md')
      expect(existsSync(docsPath)).toBe(true)
    })

    it('RAILWAY_CONFIG.md mentions automated provisioning', () => {
      const configPath = join(process.cwd(), 'RAILWAY_CONFIG.md')
      const content = readFileSync(configPath, 'utf-8')
      expect(content).toContain('Automated Provisioning')
      expect(content).toContain('GitHub Actions')
    })
  })

  describe('Package.json Integration', () => {
    it('has provision:railway script', () => {
      const packagePath = join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

      expect(packageJson.scripts).toHaveProperty('provision:railway')
      expect(packageJson.scripts['provision:railway']).toContain('provision-railway-env.sh')
    })
  })

  describe('Railway GraphQL API Usage', () => {
    const scriptPath = join(scriptsDir, 'provision-railway-env.sh')
    const scriptContent = readFileSync(scriptPath, 'utf-8')

    it('uses correct Railway API endpoint', () => {
      expect(scriptContent).toContain('https://backboard.railway.app/graphql/v2')
    })

    it('includes authorization header', () => {
      expect(scriptContent).toContain('Authorization: Bearer')
    })

    it('has variable check function', () => {
      expect(scriptContent).toContain('check_variable')
    })

    it('has variable set function', () => {
      expect(scriptContent).toContain('set_variable')
    })
  })
})
