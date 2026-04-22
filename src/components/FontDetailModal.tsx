"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";
import type { FontInfo } from "@/lib/types";

interface FontDetailModalProps {
  font: FontInfo;
  previewFamily: string;
  onClose: () => void;
}

export default function FontDetailModal({ font, previewFamily, onClose }: FontDetailModalProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">{font.family} · {font.style}</p>
            <h2 className="text-lg font-semibold text-gray-800 truncate" title={font.name}>
              {font.name}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {font.type} · {font.embedded ? "埋め込みあり" : "埋め込みなし"} · 使用 {font.usageCount}回
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview row */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 space-y-2">
          <p className="text-2xl text-gray-800 leading-tight" style={{ fontFamily: previewFamily }}>
            Aa Bb Cc 0123 — The quick brown fox jumps over the lazy dog
          </p>
          <p className="text-xl text-gray-700 leading-tight" style={{ fontFamily: previewFamily }}>
            あいうえお アイウエオ 亜伊宇絵尾 一二三四五
          </p>
        </div>

        {/* All usages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs font-medium text-gray-500 mb-3">
            使用箇所 ({font.allUsages.length}件{font.allUsages.length >= 50 && "以上 — 先頭50件"})
          </p>
          {font.allUsages.length === 0 ? (
            <p className="text-sm text-gray-400">使用箇所は記録されていません</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {font.allUsages.map((u, i) => (
                <li
                  key={i}
                  className="py-2 flex items-start gap-3 hover:bg-gray-50 px-2 -mx-2 rounded"
                >
                  <span className="flex-shrink-0 text-xs text-gray-400 w-10 pt-0.5">p.{u.page}</span>
                  <span
                    className="flex-1 text-sm text-gray-800 break-words"
                    style={{ fontFamily: previewFamily }}
                  >
                    {u.text}
                  </span>
                  <button
                    onClick={() => handleCopy(u.text, i)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="コピー"
                  >
                    {copiedIdx === i ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
