"use client";

import { useState } from "react";
import { ImageIcon, Loader2, RotateCcw } from "lucide-react";
import DropZone from "@/components/DropZone";
import ThumbnailGrid from "@/components/ThumbnailGrid";
import FileInfoBar from "@/components/FileInfoBar";
import TabNav, { type TabKey } from "@/components/TabNav";
import FontGrid from "@/components/FontGrid";
import SummaryPanel from "@/components/SummaryPanel";
import type { ExtractResult } from "@/lib/types";

type AppState = "idle" | "uploading" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [tab, setTab] = useState<TabKey>("images");

  const handleFileSelected = async (file: File) => {
    setState("uploading");
    setErrorMsg("");
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      if (data.images.length === 0 && data.fonts.length === 0) {
        throw new Error("このファイルには画像もフォントも見つかりませんでした");
      }

      setResult(data as ExtractResult);
      setTab(data.images.length > 0 ? "images" : data.fonts.length > 0 ? "fonts" : "summary");
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "エラーが発生しました");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setErrorMsg("");
    setFileName("");
    setTab("images");
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
            <p className="text-sm text-gray-500">PDF / Illustrator から画像とフォントを抽出</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        {state === "idle" && (
          <div className="flex-1 flex items-center w-full">
            <DropZone onFileSelected={handleFileSelected} />
          </div>
        )}

        {state === "uploading" && (
          <div className="flex-1 flex items-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">ファイルを解析中...</p>
                <p className="text-sm text-gray-400 mt-1">{fileName}</p>
              </div>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="flex-1 flex items-center">
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
          </div>
        )}

        {state === "done" && result && (
          <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
            <FileInfoBar result={result} fileName={fileName} onReset={handleReset} />
            <TabNav
              tab={tab}
              setTab={setTab}
              imageCount={result.images.length}
              fontCount={result.fonts.length}
            />

            <div className="w-full">
              {tab === "images" && (
                <ThumbnailGrid images={result.images} sessionId={result.sessionId} />
              )}
              {tab === "fonts" && (
                <FontGrid fonts={result.fonts} sessionId={result.sessionId} />
              )}
              {tab === "summary" && <SummaryPanel result={result} />}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
