"use client";
import { useState } from "react";
import { UserOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { Button, Upload, Avatar, message } from "antd";
import VFCanvas from "@/components/VFCanvas";
import type { WatermarkRect } from "@/components/VFCanvas";
import { base642File, urlToBase64 } from "@/utils";
import { http } from "@/service/http";

export default function WatermarkRemovePage() {
  // 1. 原始文件（首次上传的图片）
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  // 2. 当前处理中的文件（每次去水印后更新）
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  // 3. 画布显示的图片URL
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isAI, setIsAI] = useState(false); // AI模式开关

  // 首次上传图片：初始化原始文件和当前文件
  const handleUpload: UploadProps["beforeUpload"] = (file) => {
    const url = URL.createObjectURL(file);
    setOriginalFile(file); // 保存原始文件
    setCurrentFile(file); // 初始当前文件 = 原始文件
    setMediaSrc(url);
    message.success("图片加载成功");
    return false;
  };

  // 多次去水印逻辑：用currentFile作为输入，更新为处理后的文件
  const handleRemoveWatermark = async (rect: WatermarkRect) => {
    // 校验：必须有当前文件
    if (!currentFile) {
      message.warning("请先上传图片");
      return;
    }

    
    const rects = [{
      x: rect.x,
      y: rect.y,
      w: rect.width,
      h: rect.height,
    }]; // 目前只处理一个矩形，后续可扩展为多个

    try {
      setLoading(true);

      // 注意：格式转换成了png 格式，ai 模型更适合处理png格式的图片，且png支持透明背景，去水印后效果更好
      const image = await urlToBase64(URL.createObjectURL(currentFile)); 
     
      const payload = {
        image: image, // 转换为base64字符串
        rects: rects,
        type: isAI ? "AI" : "normal",
      };

      const res = await http.post<{ image: string }>("/api/remove-watermark", payload);

      const processImg = res.data.image; // 后端返回的base64字符串
      // 4. 更新状态：当前文件 = 处理后的文件，画布显示新图片
      setCurrentFile(base642File(processImg, currentFile.name)); // 转回File对象
      setMediaSrc(processImg);

      message.success("水印去除成功（已更新为最新图片）");
    } catch (err) {
      console.error("去水印失败：", err);
      message.error("去除失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 可选：重置为原始图片
  const handleReset = () => {
    if (!originalFile) return;
    setCurrentFile(originalFile);
    setMediaSrc(URL.createObjectURL(originalFile));
    message.success("已重置为原始图片");
  };

  // 保存当前图片到本地
  const handleSaveImage = () => {
    if (!mediaSrc) {
      message.warning("暂无图片可保存");
      return;
    }
    const link = document.createElement("a");
    link.href = mediaSrc;
    link.download = `processed_${originalFile!.name}`;
    link.click();
    message.success("图片保存成功");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="h-14 w-full flex items-center justify-between px-6 bg-white shadow-sm sticky top-0 z-10">
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
          {/* 重置按钮：回到原始图片 */}
          <Button shape="round" onClick={handleReset} disabled={!originalFile}>
            重置原始图
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button
            type="primary"
            loading={loading}
            shape="round"
            onClick={handleSaveImage}
            disabled={!mediaSrc}
          >
            保存图片
          </Button>
          <Avatar size={36} icon={<UserOutlined />} />
        </div>
      </header>
      <main className="flex-1 relative w-full h-full overflow-auto flex justify-center items-center p-8">
        <VFCanvas
          src={mediaSrc}
          onRectChange={handleRemoveWatermark}
          loading={loading}
          onModeChange={(checked) => setIsAI(checked)}
          isAI={isAI}
        />
      </main>
    </div>
  );
}
