import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import LayoutContent from "@/components/LayoutContent";
import AuthProvider from "@/components/AuthProvider";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hearth — a meditative journal that listens",
  description: "Write freely, and over time, it gently shows you who you are.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} antialiased`}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
