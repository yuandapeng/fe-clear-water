import { create } from "zustand";

type HistoryStep = {
  file: File | null;
  src: string | null; // 把 src 也存进去
};

type WatermarkStore = {
  originalFile: File | null;
  currentFile: File | null;
  mediaSrc: string | null; // 直接状态存储
  history: HistoryStep[];
  historyIndex: number;

  setOriginal: (file: File) => void;
  setCurrentFile: (file: File) => void;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
};

export const useWatermarkStore = create<WatermarkStore>((set, get) => ({
  originalFile: null,
  currentFile: null,
  mediaSrc: null,
  history: [],
  historyIndex: -1,

  // 上传原图
  setOriginal: (file) => {
    const src = URL.createObjectURL(file);
    set({
      originalFile: file,
      currentFile: file,
      mediaSrc: src,
      history: [{ file, src }],
      historyIndex: 0,
    });
  },

  // 更新当前文件（去水印后调用）
  setCurrentFile: (file) => {
    set({
      currentFile: file,
      mediaSrc: URL.createObjectURL(file),
    });
  },

  // 保存历史步骤
  saveHistory: () => {
    const { currentFile, mediaSrc, history, historyIndex } = get();
    if (!currentFile || !mediaSrc) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ file: currentFile, src: mediaSrc });

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // 撤销 ←
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const prev = history[historyIndex - 1];
    set({
      currentFile: prev.file,
      mediaSrc: prev.src,
      historyIndex: historyIndex - 1,
    });
  },

  // 重做 →
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const next = history[historyIndex + 1];
    set({
      currentFile: next.file,
      mediaSrc: next.src,
      historyIndex: historyIndex + 1,
    });
  },

  // 重置回原图
  reset: () => {
    const { originalFile } = get();
    if (!originalFile) return;

    const src = URL.createObjectURL(originalFile);
    set({
      currentFile: originalFile,
      mediaSrc: src,
      history: [{ file: originalFile, src }],
      historyIndex: 0,
    });
  },
}));
