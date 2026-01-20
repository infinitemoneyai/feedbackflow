import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    // Allow external images from Convex storage and user avatars
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "*.clerk.accounts.dev",
      },
    ],
    // Optimize image formats
    formats: ["image/avif", "image/webp"],
    // Reduce image sizes for smaller screens
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Enable experimental features for better performance
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "recharts",
    ],
  },

  // Compiler options for production optimization
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },

  // Enable gzip compression
  compress: true,

  // Optimize production builds
  poweredByHeader: false,

  // Generate source maps for production debugging
  productionBrowserSourceMaps: false,
};

export default nextConfig;
