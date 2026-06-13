/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/apps/yoracle',
  env: { NEXT_PUBLIC_BASE_PATH: '/apps/yoracle' },
  // Preserve trailing slashes so Next.js doesn't redirect /apps/yoracle/ → /apps/yoracle.
  // Without this, Railway's internal HTTP forwarding causes a http:// ↔ https:// loop
  // via the nginx reverse proxy at hatchai.fairwaterlabs.com.
  trailingSlash: true,
  experimental: {
    serverActions: { allowedOrigins: ['hatchai.fairwaterlabs.com'] },
  },
}
module.exports = nextConfig
