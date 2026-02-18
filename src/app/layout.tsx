import type { Metadata, Viewport } from "next";
import { Playfair_Display, Caveat } from "next/font/google";
import "./globals.css";
import LayoutContent from "@/components/LayoutContent";
import AuthProvider from "@/components/AuthProvider";
import E2EEProvider from "@/components/e2ee/E2EEProvider";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f1a" },
  ],
};

export const metadata: Metadata = {
  title: "Hearth — a meditative journal that listens",
  description: "Write freely, and over time, it gently shows you who you are.",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hearth",
  },

  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  openGraph: {
    title: "Hearth",
    description: "A meditative journal that listens",
    siteName: "Hearth",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${caveat.variable} antialiased`}>
        <AuthProvider>
          <E2EEProvider>
            <LayoutContent>{children}</LayoutContent>
          </E2EEProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
