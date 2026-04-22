import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import type { ExtractResult, FileType, FontInfo, ImageInfo } from "./types";

const execFileAsync = promisify(execFile);

const PROJECT_ROOT = process.cwd();
const OUTPUTS_DIR = path.join(PROJECT_ROOT, "outputs");
const SCRIPT_PATH = path.join(PROJECT_ROOT, "scripts", "extract_assets.py");
const PYTHON_CMD = process.env.PYTHON_CMD || "python3";
const SESSION_TTL_MS = 10 * 60 * 1000;

const sessions = new Map<string, { createdAt: number; dirPath: string }>();

function scheduleCleanup(sessionId: string, dirPath: string) {
  sessions.set(sessionId, { createdAt: Date.now(), dirPath });
  setTimeout(async () => {
    sessions.delete(sessionId);
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }, SESSION_TTL_MS);
}

interface ScriptResult {
  fileType: FileType;
  pageCount: number;
  images: ImageInfo[];
  fonts: FontInfo[];
}

export async function extractAssets(
  fileBuffer: Buffer,
  fileType: FileType
): Promise<ExtractResult> {
  const sessionId = uuidv4();
  const sessionDir = path.join(OUTPUTS_DIR, `tmp-${sessionId}`);
  const inputPath = path.join(sessionDir, "input.pdf");

  await fs.mkdir(sessionDir, { recursive: true });
  await fs.writeFile(inputPath, fileBuffer);

  try {
    const { stdout, stderr } = await execFileAsync(
      PYTHON_CMD,
      [SCRIPT_PATH, inputPath, sessionDir, `--filetype=${fileType}`],
      { timeout: 90000, maxBuffer: 64 * 1024 * 1024 }
    );

    if (stderr) {
      console.error("Python stderr:", stderr);
    }

    const parsed: ScriptResult = JSON.parse(stdout);
    scheduleCleanup(sessionId, sessionDir);

    return {
      sessionId,
      fileType: parsed.fileType,
      pageCount: parsed.pageCount,
      images: parsed.images,
      fonts: parsed.fonts,
    };
  } catch (error) {
    await fs.rm(sessionDir, { recursive: true, force: true });
    throw error;
  }
}

export function getSessionDir(sessionId: string): string | null {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return null;
  }
  return path.join(OUTPUTS_DIR, `tmp-${sessionId}`);
}

function safeAssetPath(sessionId: string, filename: string, subdir: string): string | null {
  const sessionDir = getSessionDir(sessionId);
  if (!sessionDir) return null;

  const sanitized = path.basename(filename);
  if (sanitized !== filename || filename.includes("..")) {
    return null;
  }
  return path.join(sessionDir, subdir, sanitized);
}

export function getImagePath(sessionId: string, filename: string): string | null {
  return safeAssetPath(sessionId, filename, "images");
}

export function getFontPath(sessionId: string, filename: string): string | null {
  return safeAssetPath(sessionId, filename, "fonts");
}
