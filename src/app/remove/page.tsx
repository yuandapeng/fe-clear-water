"use client";
import { useState } from "react";
import { UserOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { Button, Upload, Avatar, message } from "antd";
import VFCanvas from "@/components/VFCanvas";
import type { WatermarkRect } from "@/components/VFCanvas";
import { base642File, urlToBase64 } from "@/utils";
import { http } from "@/service/http";
import { useWatermarkStore } from "@/store/useWatermarkStore";

export default function WatermarkRemovePage() {
  // ✅ 所有状态全部来自 store
  const {
    originalFile,
    currentFile,
    mediaSrc,
    setOriginal,
    setCurrentFile,
    saveHistory,
    undo,
    redo,
    reset,
  } = useWatermarkStore();

  const [loading, setLoading] = useState(false);
  const [isAI, setIsAI] = useState(false);

  // 上传
  const handleUpload: UploadProps["beforeUpload"] = (file) => {
    setOriginal(file);
    message.success("图片加载成功");
    return false;
  };

  // 去水印
  const handleRemoveWatermark = async (rect: WatermarkRect) => {
    if (!currentFile) {
      message.warning("请先上传图片");
      return;
    }

    try {
      setLoading(true);
      const image = await urlToBase64(mediaSrc!);
      const payload = {
        image,
        rects: [{ x: rect.x, y: rect.y, w: rect.width, h: rect.height }],
        type: isAI ? "AI" : "normal",
      };

      const res = await http.post<{ image: string }>(
        "/api/remove-watermark",
        payload,
      );
      const processImg = res.data.image;
      const newFile = base642File(processImg, currentFile.name);

      // ✅ 更新 store
      setCurrentFile(newFile);
      saveHistory(); // 保存一步时间旅行

      message.success("水印去除成功");
    } catch (err) {
      message.error("去除失败");
    } finally {
      setLoading(false);
    }
  };

  // 保存图片
  const handleSaveImage = () => {
    if (!mediaSrc) return;
    const a = document.createElement("a");
    a.href = mediaSrc;
    a.download = `processed_${originalFile!.name}`;
    a.click();
    message.success("保存成功");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="h-14 min-h-14 px-6 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-blue-600">水滴去水印</h1>

          <Upload
            beforeUpload={handleUpload}
            showUploadList={false}
            accept="image/*"
          >
            <Button type="primary" shape="round">
              打开图片
            </Button>
          </Upload>

          <Button onClick={reset} disabled={!originalFile}>
            重置原始图
          </Button>

          {/* 时间旅行 */}
          <Button onClick={undo}>← 撤销</Button>
          <Button onClick={redo}>重做 →</Button>
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="primary"
            loading={loading}
            onClick={handleSaveImage}
            disabled={!mediaSrc}
          >
            保存图片
          </Button>
          <Avatar icon={<UserOutlined />} />
        </div>
      </header>

      <main className="flex-1 flex justify-center items-center p-8">
        <VFCanvas
          src={mediaSrc}
          onRectChange={handleRemoveWatermark}
          loading={loading}
          isAI={isAI}
          onModeChange={setIsAI}
        />
      </main>
      <footer className="h-10 min-h-10 text-center text-sm text-gray-500">
        copyright © 2026 水滴去水印 - 免费在线图片视频去水印工具
      </footer>
    </div>
  );
}
