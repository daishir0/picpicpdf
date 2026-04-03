"use client";

import { useState } from "react";
import { ImageIcon, Loader2, RotateCcw } from "lucide-react";
import DropZone from "@/components/DropZone";
import ThumbnailGrid from "@/components/ThumbnailGrid";
import type { ImageInfo } from "@/lib/types";

type AppState = "idle" | "uploading" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileSelected = async (file: File) => {
    setState("uploading");
    setErrorMsg("");
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      if (data.images.length === 0) {
        throw new Error("このPDFには埋め込み画像が見つかりませんでした");
      }

      setSessionId(data.sessionId);
      setImages(data.images);
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "エラーが発生しました");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setImages([]);
    setSessionId("");
    setErrorMsg("");
    setFileName("");
  };

  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ImageIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">PicPicPDF</h1>
            <p className="text-sm text-gray-500">PDFから画像を抽出</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        {state === "idle" && <DropZone onFileSelected={handleFileSelected} />}

        {state === "uploading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">画像を抽出中...</p>
              <p className="text-sm text-gray-400 mt-1">{fileName}</p>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="p-4 bg-red-50 rounded-full">
              <ImageIcon className="w-10 h-10 text-red-400" />
            </div>
            <p className="text-lg font-medium text-gray-700">{errorMsg}</p>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              もう一度試す
            </button>
          </div>
        )}

        {state === "done" && (
          <div className="w-full flex flex-col items-center gap-6">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              別のPDFをアップロード
            </button>
            <ThumbnailGrid images={images} sessionId={sessionId} />
          </div>
        )}
      </div>
    </main>
  );
}
