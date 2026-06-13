/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/apps/yoracle',
  env: { NEXT_PUBLIC_BASE_PATH: '/apps/yoracle' },
  experimental: { serverActions: { allowedOrigins: ['hatchai.fairwaterlabs.com'] } },
}
module.exports = nextConfig
