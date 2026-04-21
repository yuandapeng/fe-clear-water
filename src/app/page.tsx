"use client";
import { useState } from "react";
import { UserOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { Button, Upload, Avatar, message } from "antd";
import VFCanvas from "@/components/VFCanvas";
import type { WatermarkRect } from "@/components/VFCanvas";

export default function WatermarkRemovePage() {
  // 1. 原始文件（首次上传的图片）
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  // 2. 当前处理中的文件（每次去水印后更新）
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  // 3. 画布显示的图片URL
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 首次上传图片：初始化原始文件和当前文件
  const handleUpload: UploadProps["beforeUpload"] = (file) => {
    const url = URL.createObjectURL(file);
    setOriginalFile(file); // 保存原始文件
    setCurrentFile(file); // 初始当前文件 = 原始文件
    setMediaSrc(url);
    message.success("图片加载成功");
    return false;
  };

  // 核心：把Blob转为File对象（关键！后端需要File格式）
  const blobToFile = (blob: Blob, fileName: string): File => {
    // 保留原始文件名和类型
    return new File([blob], fileName, {
      type: blob.type || "image/png",
      lastModified: Date.now(),
    });
  };

  // 多次去水印逻辑：用currentFile作为输入，更新为处理后的文件
  const handleRemoveWatermark = async (rect: WatermarkRect) => {
    // 校验：必须有当前文件
    if (!currentFile) {
      message.warning("请先上传图片");
      return;
    }

    // 构建FormData（用currentFile，不是originalFile）
    const formData = new FormData();
    formData.append("image", currentFile); // ✅ 用当前处理中的文件
    formData.append("x", rect.x.toString());
    formData.append("y", rect.y.toString());
    formData.append("w", rect.width.toString());
    formData.append("h", rect.height.toString());

    try {
      setLoading(true);
      const res = await fetch("/api/remove-watermark", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`请求失败：${res.status}`);
      }

      // 1. 获取处理后的图片Blob
      const processedBlob = await res.blob();
      // 2. 转为File对象（用于下一次请求）
      const processedFile = blobToFile(processedBlob, currentFile.name);
      // 3. 生成预览URL
      const processedUrl = URL.createObjectURL(processedBlob);

      // 4. 更新状态：当前文件 = 处理后的文件，画布显示新图片
      setCurrentFile(processedFile);
      setMediaSrc(processedUrl);

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
        />
      </main>
    </div>
  );
}
