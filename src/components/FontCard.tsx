"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, XCircle } from "lucide-react";
import type { FontInfo } from "@/lib/types";
import { ensureFontFace, familyFor } from "./fontFaceRegistry";
import FontDetailModal from "./FontDetailModal";

interface FontCardProps {
  font: FontInfo;
  sessionId: string;
}

const PREVIEW_LATIN = "Aa Bb Cc 0123 — Quick brown fox jumps";
const PREVIEW_JP = "あいう アイウ 亜伊宇 一二三";

const BROWSER_RENDERABLE_EXTS = new Set(["ttf", "otf", "ttc", "woff", "woff2"]);

function isBrowserRenderable(filename: string | null): boolean {
  if (!filename) return false;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return BROWSER_RENDERABLE_EXTS.has(ext);
}

export default function FontCard({ font, sessionId }: FontCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const fontUrl = useMemo(() => {
    if (!font.fontFile) return null;
    return `/api/font/${sessionId}?file=${encodeURIComponent(font.fontFile)}`;
  }, [font.fontFile, sessionId]);

  const canRenderInBrowser = font.embedded && isBrowserRenderable(font.fontFile);

  useEffect(() => {
    if (canRenderInBrowser && fontUrl) {
      ensureFontFace(font.id, fontUrl);
    }
  }, [font.id, canRenderInBrowser, fontUrl]);

  const previewFamily = canRenderInBrowser
    ? `"${familyFor(font.id)}", system-ui, sans-serif`
    : `system-ui, sans-serif`;

  const firstSample = font.samples[0]?.text;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate" title={font.name}>
                {font.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {font.family}
                {font.style && font.style !== "Regular" && (
                  <span className="text-gray-400"> · {font.style}</span>
                )}
              </p>
            </div>
            <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {font.usageCount}回
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {font.embedded ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                埋め込みあり
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <XCircle className="w-3.5 h-3.5" />
                埋め込みなし
              </span>
            )}
            {font.embedded && !canRenderInBrowser && (
              <span
                className="text-xs text-amber-600"
                title="この形式 (.pfb 等) はブラウザで直接プレビューできません"
              >
                プレビュー非対応
              </span>
            )}
            {font.type && (
              <span className="text-xs text-gray-400">{font.type}</span>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="px-4 py-4 bg-gray-50/50 border-b border-gray-100 space-y-2">
          <p
            className="text-2xl text-gray-800 leading-tight truncate"
            style={{ fontFamily: previewFamily }}
            title={PREVIEW_LATIN}
          >
            {PREVIEW_LATIN}
          </p>
          <p
            className="text-xl text-gray-700 leading-tight truncate"
            style={{ fontFamily: previewFamily }}
            title={PREVIEW_JP}
          >
            {PREVIEW_JP}
          </p>
          {firstSample && (
            <p
              className="text-lg text-gray-600 leading-tight truncate"
              style={{ fontFamily: previewFamily }}
              title={firstSample}
            >
              {firstSample}
            </p>
          )}
        </div>

        {/* Usages */}
        <div className="px-4 py-3 flex-1">
          <p className="text-xs font-medium text-gray-500 mb-2">使用例</p>
          {font.samples.length === 0 ? (
            <p className="text-xs text-gray-400">使用テキストは検出されませんでした</p>
          ) : (
            <ul className="space-y-1">
              {font.samples.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="flex-1 truncate" title={s.text}>
                    「{s.text}」
                  </span>
                  <span className="flex-shrink-0 text-gray-400">p.{s.page}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
          <button
            onClick={() => setModalOpen(true)}
            disabled={font.usageCount === 0}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            全{font.usageCount}件を表示 →
          </button>
          {font.embedded && fontUrl && (
            <a
              href={`${fontUrl}&download=1`}
              download={font.fontFile ?? undefined}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              title="フォントファイルをダウンロード"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {modalOpen && (
        <FontDetailModal
          font={font}
          previewFamily={previewFamily}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
