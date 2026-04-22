"use client";

import type { FontInfo } from "@/lib/types";
import FontCard from "./FontCard";

interface FontGridProps {
  fonts: FontInfo[];
  sessionId: string;
}

export default function FontGrid({ fonts, sessionId }: FontGridProps) {
  if (fonts.length === 0) {
    return (
      <div className="w-full py-16 text-center">
        <p className="text-gray-500">このファイルではフォント情報が検出されませんでした</p>
        <p className="text-xs text-gray-400 mt-1">
          画像のみのPDFや、テキストがアウトライン化されたAIファイルの可能性があります
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600">
          <span className="font-semibold text-gray-800">{fonts.length}</span> 種類のフォントを検出
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fonts.map((f) => (
          <FontCard key={f.id} font={f} sessionId={sessionId} />
        ))}
      </div>
    </div>
  );
}
