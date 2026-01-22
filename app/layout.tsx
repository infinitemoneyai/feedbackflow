import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Feedback Flow — AI Bug Tracker & Feedback Tool for Modern AI Development",
  description:
    "An issue tracking widget for people shipping faster than their attention span allows. Screenshot capture, screen recording with audio, and AI-powered triage. AI bug tracker & feedback tool for AI-assisted development teams",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "FeedbackFlow - Turn Screenshots into product improvements",
    description:
      "An issue tracking widget for people shipping faster than their attention span allows. AI bug tracker & feedback tool for AI-assisted development teams.",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FeedbackFlow - Turn Screenshots into product improvements",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FeedbackFlow - Turn Screenshots into product improvements",
    description:
      "An issue tracking widget for people shipping faster than their attention span allows. AI bug tracker & feedback tool for AI-assisted development teams",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
