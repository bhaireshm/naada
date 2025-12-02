import type { Metadata, Viewport } from "next";
import { Notifications } from "@mantine/notifications";
import ThemeProvider from "@/components/ThemeProvider";
import ClientLayout from "@/components/ClientLayout";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/InstallPrompt";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naada Music - Your Personal Music Library",
  description: "Upload, organize, and stream your personal music collection",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Naada Music",
  },
  applicationName: "Naada Music",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Naada Music - Your Personal Music Library",
    description: "Upload, organize, and stream your personal music collection",
    type: "website",
    siteName: "Naada Music",
  },
  twitter: {
    card: "summary",
    title: "Naada Music",
    description: "Upload, organize, and stream your personal music collection",
  },
};

export const viewport: Viewport = {
  themeColor: "#b08968",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Naada" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <Notifications position="top-right" />
          <ServiceWorkerRegistration />
          <InstallPrompt />
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
