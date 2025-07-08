/** @type {import('next').NextConfig} */
import nextMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypePrism from "@mapbox/rehype-prism";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    mdxRs: true,
  },
  // Optimize CSS
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
  },
});

export default withMDX(nextConfig);
