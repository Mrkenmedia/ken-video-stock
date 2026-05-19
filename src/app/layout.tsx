import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { BRAND_CONFIG } from "@/config/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${BRAND_CONFIG.name}`,
    default: `${BRAND_CONFIG.name} | ${BRAND_CONFIG.slogan}`,
  },
  description: "Mua bán Stock Video 4K, VFX, Footage chuyên nghiệp. Thanh toán tự động, nhận file ngay lập tức qua Google Drive.",
  keywords: ["stock video", "vfx", "footage", "4k video", "video bản quyền"],
  authors: [{ name: "Ken" }],
  openGraph: {
    title: BRAND_CONFIG.name,
    description: `Nền tảng Video 4K Bản Quyền. Thanh toán tự động nhận file ngay.`,
    siteName: BRAND_CONFIG.name,
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
