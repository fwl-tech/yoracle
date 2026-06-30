# yoracle

Hatch AI app — https://hatchai.fairwaterlabs.com/apps/yoracle

## Quick Start

### Environment Setup

Yoracle uses **centralized secret management** via the `hatch-ai-provisioner` repository. Secrets are automatically synced on every deployment.

**Required GitHub Secret:**
- `PROVISIONER_PAT` - Personal access token with `repo` and `workflow` scopes

See [docs/CENTRALIZED_SECRETS.md](docs/CENTRALIZED_SECRETS.md) for detailed setup.

### Local Development

```bash
npm install
npm run dev
```

### Deployment

Push to `main` branch to trigger automated deployment:
1. Secrets sync from `hatch-ai-provisioner`
2. Railway environment variables provisioned
3. Application deployed to Railway

## Documentation

- [Centralized Secret Management](docs/CENTRALIZED_SECRETS.md)
- [Railway Configuration](RAILWAY_CONFIG.md)
- [Environment Provisioning](docs/ENVIRONMENT_PROVISIONING.md)
- [Quick Fix Guide](QUICK_FIX.md)

---

# yoracle

Built with [Hatch AI](https://hatchai.fairwaterlabs.com/apps/yoracle) by Fairwater Labs.

**Live app**: https://hatchai.fairwaterlabs.com/apps/yoracle
