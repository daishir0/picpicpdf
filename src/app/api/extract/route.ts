import { NextRequest, NextResponse } from "next/server";
import { extractImagesFromPdf } from "@/lib/extract";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "PDFファイルが必要です" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "ファイルサイズが100MBを超えています" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Check PDF magic bytes
    if (buffer.length < 4 || buffer.toString("ascii", 0, 4) !== "%PDF") {
      return NextResponse.json({ error: "有効なPDFファイルではありません" }, { status: 400 });
    }

    const result = await extractImagesFromPdf(buffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: "画像の抽出中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
