/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app ships without an ESLint config; never let linting block a build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
