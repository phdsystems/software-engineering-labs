import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SearchProvider } from "@/components/search/search-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SE Learning System - Software Engineering from First Principles",
  description: "Learn software engineering from fundamental principles to distributed systems. Comprehensive guides on SOLID, design patterns, clean architecture, microservices, and more.",
  keywords: ["software engineering", "design patterns", "SOLID principles", "clean architecture", "microservices", "event sourcing", "CQRS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <SearchProvider />
        </Providers>
      </body>
    </html>
  );
}
