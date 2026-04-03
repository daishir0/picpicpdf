"use client";

import { Download } from "lucide-react";
import type { ImageInfo } from "@/lib/types";

interface ThumbnailCardProps {
  image: ImageInfo;
  sessionId: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ThumbnailCard({ image, sessionId }: ThumbnailCardProps) {
  const thumbUrl = `/api/image/${sessionId}?file=${encodeURIComponent(image.filename)}`;
  const downloadUrl = `${thumbUrl}&download=1`;

  return (
    <a
      href={downloadUrl}
      download={image.filename}
      className="group relative block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
    >
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl}
          alt={image.filename}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow">
          <Download className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      <div className="p-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 truncate">{image.filename}</p>
        <p className="text-xs text-gray-400">
          {image.width}x{image.height} / {formatSize(image.size)}
        </p>
      </div>
    </a>
  );
}
