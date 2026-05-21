import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "covers.openlibrary.org" },
      { hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
