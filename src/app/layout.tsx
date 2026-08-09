import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { ConnectivityBanner } from "@/components/pwa/connectivity-banner";
import { ThemeInitScript, ThemeHydrationGuard } from "@/components/theme/theme-init-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stay — Hotel Management",
  description:
    "Minimalist hotel management PMS — rooms, bookings, guests, payments and GST.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stay",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // iOS ignores manifest icons entirely — this is the only one it reads.
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // ThemeInitScript adds/removes "dark" on this element before
      // hydration based on a stored preference the server can't know about
      // — an expected, intentional mismatch (same fix next-themes uses),
      // not a real bug. Scoped to just this element, not a blanket
      // suppression.
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeHydrationGuard />
        <ConnectivityBanner />
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
