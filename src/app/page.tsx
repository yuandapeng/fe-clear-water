// app/page.tsx
"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 text-gray-800">
      {/* 导航栏 */}
      <header className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-blue-600">✨</span>
          <h1 className="text-xl font-bold text-blue-600">水滴去水印</h1>
        </div>
        <button
          onClick={() => router.push("/remove")}
          className="px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          开始使用
        </button>
      </header>

      {/* 首屏大屏 */}
      <main className="max-w-7xl mx-auto px-4 pt-16 pb-24 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-bold leading-tight">
            一键去除图片水印
            <span className="text-blue-600"> 极速高清</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            无需安装软件，无需复杂操作，AI 智能识别，框选即消除，保留原图画质
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => router.push("/remove")}
              className="px-8 py-3 rounded-full bg-blue-600 text-white text-lg hover:scale-105 transition flex items-center gap-2"
            >
              立即去水印 <span>→</span>
            </button>
            <button className="px-8 py-3 rounded-full border border-gray-300 text-lg hover:border-blue-500 hover:text-blue-600 transition">
              查看演示
            </button>
          </div>
        </div>

        {/* 核心优势 */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: "⚡",
              title: "AI 智能消除",
              desc: "智能修复背景，无痕去除水印",
            },
            {
              icon: "🖼️",
              title: "保留高清画质",
              desc: "处理后不模糊、不压缩、不失真",
            },
            {
              icon: "🔒",
              title: "本地隐私安全",
              desc: "图片不上云，处理更安全",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl">
                {item.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* 三步使用 */}
        <div className="mt-28">
          <h2 className="text-3xl font-bold mb-12">3 步快速去除水印</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: "1", title: "上传图片", desc: "选择需要去水印的文件" },
              { step: "2", title: "框选水印", desc: "涂抹或框选水印区域" },
              { step: "3", title: "保存结果", desc: "一键下载无水印图片" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 底部 */}
      <footer className="bg-white py-6 text-center text-sm text-gray-500">
        copyright © 2026 水滴去水印 - 免费在线图片去水印工具
      </footer>
    </div>
  );
}