/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3005";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/candles",
        destination: `${backendUrl}/candles`,
      },
    ];
  },
};

export default nextConfig;
