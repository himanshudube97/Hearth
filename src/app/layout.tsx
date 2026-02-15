import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import Background from "@/components/Background";
import Navigation from "@/components/Navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";

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
        <Background />
        <Navigation />
        <main className="relative z-10 min-h-screen pt-20 pb-8 px-4">
          {children}
        </main>
        <ThemeSwitcher />
      </body>
    </html>
  );
}
