/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/apps/yoracle',
  env: { NEXT_PUBLIC_BASE_PATH: '/apps/yoracle' },
  experimental: {
    serverActions: { allowedOrigins: ['hatchai.fairwaterlabs.com'] },
  },
  // Trust X-Forwarded-For from the nginx reverse proxy so Clerk sees real
  // client IPs rather than the proxy IP, preventing false rate-limit triggers.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Forwarded-Host', value: 'hatchai.fairwaterlabs.com' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
