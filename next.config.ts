import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Notion S3 assets
      { protocol: "https", hostname: "**.notion.so" },
      { protocol: "https", hostname: "**.notion.com" },
      // Notion-hosted images (S3)
      { protocol: "https", hostname: "s3.us-west-2.amazonaws.com" },
      { protocol: "https", hostname: "s3-us-west-2.amazonaws.com" },
    ],
  },
};

export default nextConfig;
