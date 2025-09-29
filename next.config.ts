import type { NextConfig } from "next";
export default {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' wss: stun:",
              "font-src 'self' data:",
              "img-src 'self' data:",
              "media-src 'none'",
              "object-src 'none'",
              "frame-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // XSS Protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // HSTS - Force HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Prevent referrer leaks
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy - Restrict dangerous features (only widely supported features)
          {
            key: "Permissions-Policy",
            value: [
              "accelerometer=()",
              "autoplay=()",
              "camera=()",
              "display-capture=()",
              "encrypted-media=()",
              "fullscreen=()",
              "geolocation=()",
              "gyroscope=()",
              "magnetometer=()",
              "microphone=()",
              "midi=()",
              "payment=()",
              "picture-in-picture=()",
              "publickey-credentials-get=()",
              "sync-xhr=()",
              "usb=()",
              "web-share=()",
              "xr-spatial-tracking=()",
            ].join(", "),
          },
          // Prevent DNS prefetching
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
          // Remove server info
          {
            key: "Server",
            value: "",
          },
          // Prevent download execution
          {
            key: "X-Download-Options",
            value: "noopen",
          },
          // Prevent content type sniffing in IE
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
        ],
      },
    ];
  },
  // Additional security settings
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
} satisfies NextConfig;
