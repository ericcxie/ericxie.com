/** @type {import('next').NextConfig} */
const buildTime = new Date().toISOString();

const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: buildTime,
  },
  // The blog moved to /writing; keep old (and search-indexed) links working
  async redirects() {
    return [
      { source: "/blog", destination: "/writing", permanent: true },
      { source: "/blog/:path*", destination: "/writing/:path*", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.microlink.io",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
