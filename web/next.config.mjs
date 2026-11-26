/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-hosted: output as a standard Node.js server (not static export)
  // Required for API routes, Server-Sent Events, and Better Auth
  output: 'standalone',
}

export default nextConfig
