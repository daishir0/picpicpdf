"use client";

import type { ExtractResult } from "@/lib/types";

interface SummaryPanelProps {
  result: ExtractResult;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SummaryPanel({ result }: SummaryPanelProps) {
  const totalImageSize = result.images.reduce((sum, img) => sum + img.size, 0);
  const formatCounts = result.images.reduce<Record<string, number>>((acc, img) => {
    acc[img.format] = (acc[img.format] || 0) + 1;
    return acc;
  }, {});

  const embeddedCount = result.fonts.filter((f) => f.embedded).length;
  const embedRate =
    result.fonts.length > 0 ? Math.round((embeddedCount / result.fonts.length) * 100) : 0;
  const topFonts = [...result.fonts]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 3);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* File */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">ファイル情報</h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">形式</dt>
            <dd className="font-medium text-gray-800 uppercase">{result.fileType}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">ページ数</dt>
            <dd className="font-medium text-gray-800">{result.pageCount}</dd>
          </div>
        </dl>
      </div>

      {/* Images */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">画像サマリ</h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">検出数</dt>
            <dd className="font-medium text-gray-800">{result.images.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">合計サイズ</dt>
            <dd className="font-medium text-gray-800">{formatSize(totalImageSize)}</dd>
          </div>
          {Object.keys(formatCounts).length > 0 && (
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">形式内訳</dt>
              <dd className="font-medium text-gray-800 text-right">
                {Object.entries(formatCounts)
                  .map(([fmt, cnt]) => `${fmt.toUpperCase()}×${cnt}`)
                  .join(" / ")}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Fonts */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm md:col-span-2">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">フォントサマリ</h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">検出数</dt>
            <dd className="font-medium text-gray-800">{result.fonts.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">埋め込み率</dt>
            <dd className="font-medium text-gray-800">
              {embeddedCount} / {result.fonts.length} ({embedRate}%)
            </dd>
          </div>
        </dl>
        {topFonts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">使用回数トップ3</p>
            <ul className="space-y-1 text-sm">
              {topFonts.map((f) => (
                <li key={f.id} className="flex justify-between gap-2">
                  <span className="truncate text-gray-700" title={f.name}>
                    {f.name}
                  </span>
                  <span className="text-gray-500 flex-shrink-0">{f.usageCount}回</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
