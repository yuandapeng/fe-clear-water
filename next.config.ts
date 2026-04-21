import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: "/fe-clear-water",
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_HOST}/:path*`,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
