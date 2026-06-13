/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/apps/yoracle',
  env: { NEXT_PUBLIC_BASE_PATH: '/apps/yoracle' },
  experimental: {
    // Railway terminates TLS at the edge and forwards HTTP to the container.
    // Next.js generates absolute redirect URLs using the request scheme (http://),
    // which causes an infinite loop with nginx's HTTP→HTTPS upgrade:
    //   /apps/yoracle/  →308→  /apps/yoracle  →307→  http://.../apps/yoracle/  →loop
    // Skipping the trailing-slash redirect breaks the loop while keeping all routes intact.
    skipTrailingSlashRedirect: true,
    serverActions: { allowedOrigins: ['hatchai.fairwaterlabs.com'] },
  },
}
module.exports = nextConfig
