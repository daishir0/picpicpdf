import { NextRequest, NextResponse } from "next/server";
import { extractAssets } from "@/lib/extract";
import type { FileType } from "@/lib/types";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = (formData.get("file") || formData.get("pdf")) as File | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "ファイルサイズが100MBを超えています" }, { status: 400 });
    }

    const lowerName = (file.name || "").toLowerCase();
    const isAi = lowerName.endsWith(".ai");
    const isPdf = lowerName.endsWith(".pdf");

    if (!isAi && !isPdf) {
      return NextResponse.json(
        { error: "PDFまたはAdobe Illustrator (.ai) ファイルをアップロードしてください" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length < 5 || buffer.toString("ascii", 0, 5) !== "%PDF-") {
      if (isAi) {
        return NextResponse.json(
          {
            error:
              "このIllustratorファイルは対応していない形式です（CS2以降のPDF互換.aiが必要）",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "有効なPDFファイルではありません" },
        { status: 400 }
      );
    }

    const fileType: FileType = isAi ? "ai" : "pdf";
    const result = await extractAssets(buffer, fileType);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: "ファイルの解析中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
