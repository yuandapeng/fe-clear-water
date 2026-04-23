import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "水滴去水印 - 免费在线图片视频去水印工具",
  description:
    "水滴去水印是一款免费在线去水印工具，支持图片、视频一键去除水印，操作简单、处理快速、画质清晰，无需下载即可使用。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <AntdRegistry>
        <body className="min-h-full flex flex-col">{children}</body>
      </AntdRegistry>
    </html>
  );
}
