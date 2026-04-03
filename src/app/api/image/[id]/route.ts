import { NextRequest, NextResponse } from "next/server";
import { getImagePath } from "@/lib/extract";
import fs from "fs/promises";
import path from "path";

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
    return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
  }

  const imagePath = getImagePath(sessionId, filename);
  if (!imagePath) {
    return NextResponse.json({ error: "無効なリクエストです" }, { status: 400 });
  }

  try {
    const data = await fs.readFile(imagePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    const download = request.nextUrl.searchParams.get("download") === "1";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=600",
    };

    if (download) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new NextResponse(data, { headers });
  } catch {
    return NextResponse.json({ error: "画像が見つかりません" }, { status: 404 });
  }
}
