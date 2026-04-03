import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import type { ImageInfo, ExtractResult } from "./types";

const execFileAsync = promisify(execFile);

const PROJECT_ROOT = process.cwd();
const OUTPUTS_DIR = path.join(PROJECT_ROOT, "outputs");
const SCRIPT_PATH = path.join(PROJECT_ROOT, "scripts", "extract_images.py");
const PYTHON_CMD = process.env.PYTHON_CMD || "python3";
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Track sessions for cleanup
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

export async function extractImagesFromPdf(
  pdfBuffer: Buffer
): Promise<ExtractResult> {
  const sessionId = uuidv4();
  const sessionDir = path.join(OUTPUTS_DIR, `tmp-${sessionId}`);
  const inputPath = path.join(sessionDir, "input.pdf");
  const outputDir = path.join(sessionDir, "images");

  await fs.mkdir(sessionDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(inputPath, pdfBuffer);

  try {
    const { stdout, stderr } = await execFileAsync(PYTHON_CMD, [
      SCRIPT_PATH,
      inputPath,
      outputDir,
    ], { timeout: 60000 });

    if (stderr) {
      console.error("Python stderr:", stderr);
    }

    const images: ImageInfo[] = JSON.parse(stdout);
    scheduleCleanup(sessionId, sessionDir);

    return { sessionId, images };
  } catch (error) {
    await fs.rm(sessionDir, { recursive: true, force: true });
    throw error;
  }
}

export function getSessionDir(sessionId: string): string | null {
  // Validate UUID format to prevent path traversal
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return null;
  }
  const dirPath = path.join(OUTPUTS_DIR, `tmp-${sessionId}`);
  return dirPath;
}

export function getImagePath(sessionId: string, filename: string): string | null {
  const sessionDir = getSessionDir(sessionId);
  if (!sessionDir) return null;

  // Prevent path traversal
  const sanitized = path.basename(filename);
  if (sanitized !== filename || filename.includes("..")) {
    return null;
  }

  return path.join(sessionDir, "images", sanitized);
}
