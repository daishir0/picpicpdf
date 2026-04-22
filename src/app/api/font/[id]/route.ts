import { NextRequest, NextResponse } from "next/server";
import { getFontPath } from "@/lib/extract";
import fs from "fs/promises";
import path from "path";

const FONT_MIME_MAP: Record<string, string> = {
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".ttc": "font/collection",
  ".pfb": "application/vnd.ms-fontobject",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
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

  const fontPath = getFontPath(sessionId, filename);
  if (!fontPath) {
    return NextResponse.json({ error: "無効なリクエストです" }, { status: 400 });
  }

  try {
    const data = await fs.readFile(fontPath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = FONT_MIME_MAP[ext] || "application/octet-stream";

    const download = request.nextUrl.searchParams.get("download") === "1";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=600",
      "Access-Control-Allow-Origin": "*",
    };

    if (download) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new NextResponse(new Uint8Array(data), { headers });
  } catch {
    return NextResponse.json({ error: "フォントが見つかりません" }, { status: 404 });
  }
}
