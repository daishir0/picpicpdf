import { NextRequest } from "next/server";
import { getImagePath } from "@/lib/extract";
import fs from "fs/promises";
import path from "path";

// キャッシュを無効化
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".webp": "image/webp",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const filename = request.nextUrl.searchParams.get("file");

  if (!sessionId || !filename) {
    return new Response(JSON.stringify({ error: "パラメータが不足しています" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const imagePath = getImagePath(sessionId, filename);
  if (!imagePath) {
    return new Response(JSON.stringify({ error: "無効なリクエストです" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // ファイルの存在確認
    await fs.access(imagePath);

    // バイナリデータを読み込み
    const data = await fs.readFile(imagePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    const download = request.nextUrl.searchParams.get("download") === "1";

    const headers: HeadersInit = {
      "Content-Type": contentType,
      "Content-Length": data.byteLength.toString(),
      "Cache-Control": "no-store, must-revalidate",
      "Pragma": "no-cache",
    };

    if (download) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    // Web標準のResponseでArrayBufferを返す
    return new Response(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), {
      status: 200,
      headers,
    });
  } catch {
    return new Response(JSON.stringify({ error: "画像が見つかりません" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}
