import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,

  // Telegram Mini App: allow embedding in Telegram's webview iframe
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow Telegram to embed this site in an iframe
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://*.telegram.org https://*.cloudinary.com",
              "style-src 'self' 'unsafe-inline' https://telegram.org https://*.cloudinary.com",
              "img-src 'self' data: https: blob: https://*.cloudinary.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com wss://*.firebaseio.com https://telegram.org https://*.vercel-analytics.com https://api.cloudinary.com https://*.cloudinary.com",
              "frame-ancestors 'self' https://web.telegram.org https://*.web.telegram.org",
              "frame-src https://telegram.org https://*.telegram.org https://*.cloudinary.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
