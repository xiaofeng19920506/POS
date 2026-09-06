import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { brand } from "@/lib/brand";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: `${brand.displayName} · 餐饮收银`,
  description: `${brand.displayName} 门店桌台与点餐系统`,
  applicationName: brand.displayName,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brand.displayName,
  },
  icons: {
    icon: "/brand-mark.svg",
    apple: "/brand-mark.svg",
  },
};

export const viewport: Viewport = {
  themeColor: brand.primary,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
