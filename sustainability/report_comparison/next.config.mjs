/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/sustainability/report_comparison",
  trailingSlash: true,
  images: { unoptimized: true },
  output: "export",
  distDir: "../esg-export",
};

export default nextConfig;
