import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Allow up to 25MB request body for file uploads through proxy
  // Default is 10MB (DEFAULT_BODY_CLONE_SIZE_LIMIT), insufficient for 20MB uploads.
  experimental: {
    proxyClientMaxBodySize: "25mb",
  },
  serverExternalPackages: [
    "pdfjs-dist",
    "@napi-rs/canvas",
    "pdfkit",
    "@fontsource/noto-sans-sc",
    "fonteditor-core",
  ],
  // Turbopack root fix
  turbopack: {
    root: process.cwd(),
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },

  // Redirect HTTP to HTTPS in production
  // (handled by reverse proxy in deployment)
};

export default nextConfig;
