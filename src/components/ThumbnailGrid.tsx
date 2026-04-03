"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { ImageInfo } from "@/lib/types";
import ThumbnailCard from "./ThumbnailCard";

interface ThumbnailGridProps {
  images: ImageInfo[];
  sessionId: string;
}

export default function ThumbnailGrid({ images, sessionId }: ThumbnailGridProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/download-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) throw new Error("ZIP download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "picpicpdf-images.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("ZIPダウンロードに失敗しました");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          <span className="font-semibold text-gray-800">{images.length}</span> 件の画像を検出
        </p>
        <button
          onClick={handleDownloadAll}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          すべてダウンロード (ZIP)
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((img) => (
          <ThumbnailCard key={img.filename} image={img} sessionId={sessionId} />
        ))}
      </div>
    </div>
  );
}
