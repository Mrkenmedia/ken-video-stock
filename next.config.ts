import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Bật nén gzip/brotli cho tất cả response (HTML, JSON, CSS) ──────────
  compress: true,

  async headers() {
    return [
      // ── Bảo mật: Content-Security-Policy toàn site ──────────────────────
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: https://lh3.googleusercontent.com",
              "frame-src 'self' https://www.youtube.com https://youtube.com https://drive.google.com https://docs.google.com",
              "connect-src 'self' https:",
            ].join('; '),
          },
        ],
      },

      // ── Cache tài nguyên tĩnh trong /public ─────────────────────────────
      // (/_next/static được Next.js + Vercel tự xử lý – không cần đặt thủ công)
      {
        source: '/:path*(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
