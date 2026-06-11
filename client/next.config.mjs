/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  distDir: 'dist',
  env: {
    NEXT_PUBLIC_BACKEND_URL: "https://api.nexura.intuition.box",
    NEXT_PUBLIC_NETWORK: "testnet",
    NEXT_PUBLIC_ENV: "production",
  },
  eslint: {
    // Foundation phase: don't fail the build on lint while pages are still being ported.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
