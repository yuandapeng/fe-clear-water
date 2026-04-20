"use client";
import { useRef, useEffect, forwardRef, use } from "react";
import { useDebounceFn } from "ahooks";
import { message, Spin } from "antd";

export type WatermarkRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface VFCanvasProps {
  src: string | null;
  onRectChange?: (rect: WatermarkRect) => void;
  className?: string;
  loading?: boolean;
}

const VFCanvas = forwardRef<HTMLCanvasElement, VFCanvasProps>(
  ({ src, onRectChange, loading }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const scaleRef = useRef(1);
    const offsetRef = useRef({ x: 0, y: 0 });
    const spacePressedRef = useRef(false);
    const isPanningRef = useRef(false);
    const lastMouseRef = useRef({ x: 0, y: 0 });
    const isSelectingRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0 });
    const currentRectRef = useRef<WatermarkRect | null>(null);

    // ==============================================
    // 🔴 核心修复：纯JS控制光标，拖动时锁定grabbing
    // ==============================================
    // 设置Canvas光标（纯JS）
    const setCanvasCursor = (cursor: string) => {
      if (canvasRef.current) {
        canvasRef.current.style.cursor = cursor;
      }
    };

    // 防抖窗口resize，保持居中适配
    const { run } = useDebounceFn(
      () => {
        if (!canvasRef.current || !imgRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        fitToCenter();
      },
      {
        wait: 500,
      },
    );

    useEffect(() => {
      window.addEventListener("resize", run);
      return () => window.removeEventListener("resize", run);
    }, []);

    // 空格按键监听（仅控制初始grab，不干扰拖动中的grabbing）
    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          e.preventDefault();
          spacePressedRef.current = true;
          // 只有没在拖动时，才显示grab
          if (!isPanningRef.current) {
            setCanvasCursor("grab");
          }
        }
      };

      const up = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          spacePressedRef.current = false;
          // 只有没在拖动时，才恢复默认
          if (!isPanningRef.current) {
            setCanvasCursor("default");
          }
        }
      };

      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      return () => {
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
        setCanvasCursor("default");
      };
    }, []);

    // 图片加载 + 首次居中
    useEffect(() => {
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        fitToCenter();
      };
      img.src = src;
    }, [src]);

    // 等比居中适配（通用）
    const fitToCenter = () => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.width;
      const ih = img.height;

      const scale = Math.min(cw / iw, ch / ih);
      const ox = (cw - iw * scale) / 2;
      const oy = (ch - ih * scale) / 2;

      scaleRef.current = scale;
      offsetRef.current = { x: ox, y: oy };
      currentRectRef.current = null;
      redraw();
    };

    // 重绘函数
    const redraw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !imgRef.current) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(offsetRef.current.x, offsetRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);
      ctx.drawImage(imgRef.current, 0, 0);

      if (currentRectRef.current) {
        ctx.strokeStyle = "#ff4d4f";
        ctx.lineWidth = 2 / scaleRef.current;
        ctx.strokeRect(
          currentRectRef.current.x,
          currentRectRef.current.y,
          currentRectRef.current.width,
          currentRectRef.current.height,
        );
      }
      ctx.restore();
    };

    // 鼠标坐标转图片原始坐标（不越界）
    const getImagePos = (clientX: number, clientY: number) => {
      const c = canvasRef.current;
      const img = imgRef.current;
      if (!c || !img) return { x: 0, y: 0 };
      const r = c.getBoundingClientRect();
      const cx = clientX - r.left;
      const cy = clientY - r.top;
      let x = (cx - offsetRef.current.x) / scaleRef.current;
      let y = (cy - offsetRef.current.y) / scaleRef.current;
      x = Math.max(0, Math.min(img.width, x));
      y = Math.max(0, Math.min(img.height, y));
      return { x, y };
    };

    // // 滚轮缩放（鼠标中心）
    // const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    //   e.preventDefault();
    //   const canvas = canvasRef.current;
    //   if (!canvas) return;
    //   const rect = canvas.getBoundingClientRect();
    //   const x = e.clientX - rect.left;
    //   const y = e.clientY - rect.top;

    //   const newScale =
    //     e.deltaY < 0 ? scaleRef.current * 1.1 : scaleRef.current * 0.9;
    //   const clamped = Math.max(0.2, Math.min(5, newScale));
    //   const factor = clamped / scaleRef.current;

    //   offsetRef.current = {
    //     x: x - (x - offsetRef.current.x) * factor,
    //     y: y - (y - offsetRef.current.y) * factor,
    //   };
    //   scaleRef.current = clamped;
    //   redraw();
    // };

    // 鼠标按下：锁定grabbing，直到鼠标松开
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (spacePressedRef.current) {
        isPanningRef.current = true;
        // 按下鼠标，强制设置为grabbing，锁定直到松开
        setCanvasCursor("grabbing");
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const pos = getImagePos(e.clientX, e.clientY);
      isSelectingRef.current = true;
      startPosRef.current = pos;
      currentRectRef.current = { ...pos, width: 0, height: 0 };
    };

    // 鼠标移动：保持grabbing（直到松开鼠标）
    const handleMouseMove = (e: React.MouseEvent) => {
      if (spacePressedRef.current && isPanningRef.current) {
        offsetRef.current = {
          x: offsetRef.current.x + e.clientX - lastMouseRef.current.x,
          y: offsetRef.current.y + e.clientY - lastMouseRef.current.y,
        };
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        // 移动时保持grabbing，不切换
        setCanvasCursor("grabbing");
        redraw();
        return;
      }

      if (isSelectingRef.current) {
        const pos = getImagePos(e.clientX, e.clientY);
        currentRectRef.current = {
          x: Math.min(startPosRef.current.x, pos.x),
          y: Math.min(startPosRef.current.y, pos.y),
          width: Math.abs(pos.x - startPosRef.current.x),
          height: Math.abs(pos.y - startPosRef.current.y),
        };
        redraw();
      }
    };

    // ==============================================
    // 🔴 修复2：滚轮事件改为手动绑定，显式设置passive: false
    // ==============================================
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleWheel = (e: WheelEvent) => {
        // 阻止默认滚轮行为（比如页面滚动）
        if (e.cancelable) {
          e.preventDefault();
        }
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newScale =
          e.deltaY < 0 ? scaleRef.current * 1.1 : scaleRef.current * 0.9;
        const clamped = Math.max(0.2, Math.min(5, newScale));
        const factor = clamped / scaleRef.current;

        offsetRef.current = {
          x: x - (x - offsetRef.current.x) * factor,
          y: y - (y - offsetRef.current.y) * factor,
        };
        scaleRef.current = clamped;
        redraw();
      };

      // 手动绑定滚轮事件，显式设置passive: false
      canvas.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        canvas.removeEventListener("wheel", handleWheel);
      };
    }, []);

    // 鼠标松开：才恢复光标（核心修复点）
    const handleMouseUp = () => {
      isPanningRef.current = false;
      // 只有松开鼠标，才判断是否恢复grab或默认
      if (spacePressedRef.current) {
        // 还按住空格 → 恢复grab（空心小手）
        setCanvasCursor("grab");
      } else {
        // 松开空格 → 恢复默认
        setCanvasCursor("default");
      }

      if (isSelectingRef.current) {
        // 检查是一个矩形（宽高都大于10像素），才触发回调
        if (
          currentRectRef.current &&
          currentRectRef.current.width > 10 &&
          currentRectRef.current.height > 10
        ) {
          onRectChange?.(currentRectRef.current);
        } else {
          message.warning("请选择一个较大的区域");
        }
        isSelectingRef.current = false;
      }
    };

    return (
      <div className="w-full h-full relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="bg-white shadow-lg block w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={fitToCenter}
        />
        {/* ✅ 悬浮遮罩，绝对定位，完全不影响画布宽高布局 */}
        {loading && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-50">
            <Spin size="large" description="处理中..." />
          </div>
        )}
      </div>
    );
  },
);

VFCanvas.displayName = "VFCanvas";
export default VFCanvas;
