import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import ClientLayout from "@/components/ClientLayout";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music Player - Stream Your Music",
  description: "Upload, organize, and stream your music collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider
          defaultColorScheme="auto"
          theme={{
            primaryColor: "deepBlue",
            fontFamily: "Inter, system-ui, sans-serif",
            headings: {
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: "600",
            },
            colors: {
              deepBlue: [
                '#e6f0ff',
                '#b3d1ff',
                '#80b3ff',
                '#4d94ff',
                '#1a75ff',
                '#0056e6',
                '#003db3',
                '#011f4b', // Primary dark blue
                '#001633',
                '#000d1a',
              ],
              silver: [
                '#f8f9fa',
                '#e9ecef',
                '#dee2e6',
                '#ced4da',
                '#bdc3c7', // Silver gray
                '#adb5bd',
                '#868e96',
                '#495057',
                '#343a40',
                '#212529',
              ],
              slate: [
                '#ecf0f1',
                '#d5dbdb',
                '#bdc3c7',
                '#95a5a6',
                '#7f8c8d',
                '#566573',
                '#34495e',
                '#2c3e50', // Dark slate
                '#212f3c',
                '#1c2833',
              ],
              pastelPink: [
                '#fff5f8',
                '#ffe6f0',
                '#ffd6e8',
                '#ffc7e0',
                '#ffb7d8',
                '#ffa7d0',
                '#ff97c8',
                '#ff87c0',
                '#ff77b8',
                '#ff67b0',
              ],
              pastelBlue: [
                '#f0f8ff',
                '#e6f2ff',
                '#d6ebff',
                '#c7e4ff',
                '#b7ddff',
                '#a7d6ff',
                '#97cfff',
                '#87c8ff',
                '#77c1ff',
                '#67baff',
              ],
              pastelPurple: [
                '#f8f5ff',
                '#f0e6ff',
                '#e8d6ff',
                '#e0c7ff',
                '#d8b7ff',
                '#d0a7ff',
                '#c897ff',
                '#c087ff',
                '#b877ff',
                '#b067ff',
              ],
            },
            other: {
              gradient: 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
              gradientLight: 'linear-gradient(135deg, #0056e6 0%, #34495e 100%)',
              gradientAccent: 'linear-gradient(135deg, #1a75ff 0%, #7f8c8d 100%)',
              gradientSubtle: 'linear-gradient(135deg, #bdc3c7 0%, #ecf0f1 100%)',
              gradientPastelBlue: 'linear-gradient(135deg, #e6f0ff 0%, #f0e6ff 100%)',
              gradientPastelPink: 'linear-gradient(135deg, #fff5f8 0%, #ffe6f0 100%)',
              gradientPastelPurple: 'linear-gradient(135deg, #f8f5ff 0%, #e8d6ff 100%)',
            },
          }}
        >
          <Notifications position="top-right" />
          <ClientLayout>{children}</ClientLayout>
        </MantineProvider>
      </body>
    </html>
  );
}
