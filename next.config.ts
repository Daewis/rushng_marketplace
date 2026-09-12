import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// PWA — service worker for offline support + installable web app.
// In development we disable the SW to avoid caching surprises; in
// production the SW is generated and registered automatically.
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  transpilePackages: ['jwks-rsa', 'jose'],
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.space-z.ai"],
  // Next.js 16 enables Turbopack by default, but @ducanh2912/next-pwa
  // injects a webpack config. Silence the "no turbopack config" warning
  // by setting an empty turbopack config; the PWA plugin's webpack
  // rules then take effect.
  turbopack: {},
  // Static metadata for the PWA manifest + icons. The full metadata
  // block (manifest, appleWebApp, formatDetection, etc.) lives in
  // src/app/layout.tsx so it stays close to the rest of the app's
  // head configuration.
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
