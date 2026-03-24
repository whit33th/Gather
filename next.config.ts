import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    viewTransition: true,
    // Disable optimizeCss to avoid critters/beasties processing issues in dev.
    // This is blocking page rendering for some routes during screenshot verification.
    optimizeCss: false,
  },
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "a0.muscache.com",
      },
      {
        protocol: "https",
        hostname: "cf.bstatic.com",
      },
      {
        protocol: "https",
        hostname: "q-xx.bstatic.com",
      },
      {
        protocol: "https",
        hostname: "r-xx.bstatic.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  reactStrictMode: false,
  reactCompiler: true,
  transpilePackages: ["react-map-gl"],
};

export default nextConfig;
