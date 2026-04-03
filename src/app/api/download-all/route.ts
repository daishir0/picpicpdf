import { NextRequest, NextResponse } from "next/server";
import { getSessionDir } from "@/lib/extract";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { PassThrough } from "stream";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionIdが必要です" }, { status: 400 });
    }

    const sessionDir = getSessionDir(sessionId);
    if (!sessionDir) {
      return NextResponse.json({ error: "無効なセッションです" }, { status: 400 });
    }

    const imagesDir = path.join(sessionDir, "images");
    if (!fs.existsSync(imagesDir)) {
      return NextResponse.json({ error: "画像が見つかりません" }, { status: 404 });
    }

    const archive = archiver("zip", { zlib: { level: 5 } });
    const passthrough = new PassThrough();

    archive.pipe(passthrough);
    archive.directory(imagesDir, false);
    archive.finalize();

    const stream = new ReadableStream({
      start(controller) {
        passthrough.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        passthrough.on("end", () => {
          controller.close();
        });
        passthrough.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="picpicpdf-images.zip"',
      },
    });
  } catch (error) {
    console.error("Download-all error:", error);
    return NextResponse.json(
      { error: "ZIPファイルの作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
