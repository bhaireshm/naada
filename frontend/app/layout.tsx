import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import Navigation from "@/components/Navigation";
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
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider
          defaultColorScheme="auto"
          theme={{
            primaryColor: "blue",
            fontFamily: "Inter, system-ui, sans-serif",
            headings: {
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: "600",
            },
          }}
        >
          <Notifications position="top-right" />
          <Navigation />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
