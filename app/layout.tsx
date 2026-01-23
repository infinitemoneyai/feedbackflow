import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { PostHogProvider } from "@/lib/posthog-provider";
import { StructuredData } from "@/components/structured-data";
// In your layout.tsx
import Script from 'next/script'



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
  title:
    "FeedbackFlow - Feedback Layer for AI Development Pipelines | Product Feedback Automation",
  description:
    "Turn user feedback into structured input for your AI development pipeline. The missing piece between user reports and AI agents that can act on them. AI feedback pipeline for developers shipping with AI assistance.",
  keywords: [
    "ai development pipeline",
    "ai feedback pipeline",
    "product feedback automation",
    "ai dev workflow",
    "ai agent development",
    "structured feedback for ai",
    "ai assisted development",
    "feedback automation tool",
    "ai development infrastructure",
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "FeedbackFlow - Feedback Layer for AI Development Pipelines",
    description:
      "Turn user feedback into structured input for your AI development pipeline. Built for teams shipping with AI agents.",
    type: "website",
    url: "https://feedbackflow.cc",
    siteName: "FeedbackFlow",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FeedbackFlow - AI Feedback Pipeline",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FeedbackFlow - Feedback Layer for AI Development Pipelines",
    description:
      "Turn user feedback into structured input for your AI development pipeline. Built for teams shipping with AI agents.",
    images: ["/og-image.jpg"],
    creator: "@infinitemoney_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://feedbackflow.cc",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ConvexClientProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </ConvexClientProvider>
        <Script
          src="https://www.feedbackflow.cc/widget.js"
          data-widget-key="wk_jUHmNX2EXhOqCLXNlGlMocRp"
          data-api-url="https://www.feedbackflow.cc/api/widget/submit"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
