"use client";

import { FileText, Image as ImageIconLucide, Type, RotateCcw } from "lucide-react";
import type { ExtractResult } from "@/lib/types";

interface FileInfoBarProps {
  result: ExtractResult;
  fileName: string;
  onReset: () => void;
}

export default function FileInfoBar({ result, fileName, onReset }: FileInfoBarProps) {
  const isAi = result.fileType === "ai";
  const badgeColor = isAi
    ? "bg-orange-100 text-orange-700 border-orange-200"
    : "bg-blue-100 text-blue-700 border-blue-200";
  const badgeLabel = isAi ? "AI" : "PDF";

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${badgeColor}`}
        >
          {badgeLabel}
        </span>
        <span className="text-sm font-medium text-gray-800 truncate" title={fileName}>
          {fileName}
        </span>
        <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
          <span className="inline-flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {result.pageCount}ページ
          </span>
          <span className="inline-flex items-center gap-1">
            <ImageIconLucide className="w-3.5 h-3.5" />
            画像 {result.images.length}
          </span>
          <span className="inline-flex items-center gap-1">
            <Type className="w-3.5 h-3.5" />
            フォント {result.fonts.length}
          </span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        別のファイル
      </button>
    </div>
  );
}
