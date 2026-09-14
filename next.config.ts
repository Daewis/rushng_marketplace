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
    // Exclude cross-origin requests that the SW cannot control. Without
    // this, Workbox tries to cache Google auth / Firebase / Paystack
    // responses and throws opaque-error warnings. Each entry is a regex
    // tested against the request URL.
    exclude: [
      /^https:\/\/apis\.google\.com\/.*/,
      /^https:\/\/.*\.googleapis\.com\/.*/,
      /^https:\/\/accounts\.google\.com\/.*/,
      /^https:\/\/.*\.firebaseio\.com\/.*/,
      /^https:\/\/.*\.firebaseapp\.com\/.*/,
      /^https:\/\/js\.paystack\.co\/.*/,
      /^https:\/\/checkout\.paystack\.com\/.*/,
    ],
  },
});

const nextConfig: NextConfig = {
  transpilePackages: ['jwks-rsa', 'jose'],
  output: "standalone",
  // Strict: TypeScript errors must fail the build. Previously this was
  // `ignoreBuildErrors: true`, which silently shipped real runtime bugs
  // (e.g. `db.$transaction` not existing on the Mongo shim). Keeping it
  // off forces us to fix type errors when they appear instead of letting
  // them slip to production.
  typescript: {
    ignoreBuildErrors: false,
  },
  // Surface effect bugs (stale deps, double-fires) in development.
  reactStrictMode: true,
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
    const securityHeaders = [
      // Lock down where resources can be loaded from. `default-src 'self'`
      // is the baseline; the rest are relaxed just enough for the app
      // to actually work (Firebase auth, Paystack iframe + images,
      // Unsplash product images, ui-avatars, OpenStreetMap tiles,
      // Resend's webhooks, inline styles/scripts for Next.js's hydration).
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://www.google.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://*.googleapis.com https://apis.google.com https://identitytoolkit.googleapis.com wss://*.firebaseio.com https://api.paystack.co",
          "frame-src 'self' https://*.firebaseapp.com https://js.paystack.co https://checkout.paystack.com",
          "frame-ancestors 'self'",
          "form-action 'self'",
          "base-uri 'self'",
          "object-src 'none'",
        ].join("; "),
      },
      // Don't let anyone iframe us (defense-in-depth on top of CSP frame-ancestors).
      { key: "X-Frame-Options", value: "DENY" },
      // Prevent MIME-sniffing — browsers must respect declared Content-Type.
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Referrer policy — only send origin for cross-origin requests.
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // HSTS — once a browser sees this, it sticks to HTTPS for 2 years.
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      // Permissions policy — lock down powerful APIs to same-origin.
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
      },
    ];

    return [
      ...securityHeaders.map((h) => ({ source: "/(.*)", headers: [h] })),
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
        source: "/uploads/:path*",
        // Legacy rule for when uploads were stored on the filesystem.
        // Now that uploads go through /api/uploads/:id (GridFS), this
        // path is unreachable in normal operation. Kept defensively
        // in case any pre-existing /uploads/<file>.webp URLs are still
        // embedded in product data — they'll 404 cleanly.
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'none'" },
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
