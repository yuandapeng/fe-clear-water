import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: "/clear-water",

  async rewrites() {
    return [
      {
        basePath: process.env.NODE_ENV === "production" ? undefined : false , // 生产环境使用basePath，开发环境不使用basePath
        source: "/api/:path*",
        destination: `${process.env.API_HOST}/:path*`, // 代理到后端API服务器
      },
    ];  
  },
};

export default nextConfig;
