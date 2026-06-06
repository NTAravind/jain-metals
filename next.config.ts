import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    WHATSAPPCONTACT: process.env.WHATSAPPCONTACT,
  },
  images: {
    remotePatterns: [
      // ── Garage S3 (local dev) ────────────────────────────────────────────
      {
        protocol: "http",
        hostname: "localhost",
        port: "3902",
      },
      {
        protocol: "http",
        hostname: "jain-bucket.localhost",
        port: "3902",
      },
      // ── Garage S3 (production — update hostname when you deploy) ─────────
      // { protocol: "https", hostname: "images.yourdomain.com" },
      // ── Legacy: GitHub CDN / jsDelivr (for old images already in DB) ────
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      // ── Placeholder images ───────────────────────────────────────────────
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
