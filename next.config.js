/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/apps/yoracle',
  env: { NEXT_PUBLIC_BASE_PATH: '/apps/yoracle' },
  // Railway terminates TLS at the edge and forwards HTTP to the container.
  // Skipping the trailing-slash redirect breaks the nginx HTTP→HTTPS redirect loop.
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      // Local dev: http://localhost:3000/ → app (basePath is not applied to these routes)
      { source: '/', destination: '/apps/yoracle', permanent: false, basePath: false },
    ]
  },
  experimental: {
    serverActions: { allowedOrigins: ['hatchai.fairwaterlabs.com', 'localhost:3000'] },
  },
}
module.exports = nextConfig
