import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

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
    template: "%s | Ken Video Stock",
    default: "Ken Video Stock | Nền tảng Video 4K Bản Quyền",
  },
  description: "Mua bán Stock Video 4K, VFX, Footage chuyên nghiệp. Thanh toán tự động, nhận file ngay lập tức qua Google Drive.",
  keywords: ["stock video", "vfx", "footage", "4k video", "video bản quyền"],
  authors: [{ name: "Ken" }],
  openGraph: {
    title: "Ken Video Stock",
    description: "Nền tảng Video 4K Bản Quyền. Thanh toán tự động nhận file ngay.",
    siteName: "Ken Video Stock",
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
