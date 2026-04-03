import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const TEST_PDF_PATH = "/tmp/test_picpicpdf_e2e.pdf";

test.beforeAll(async () => {
  // Create a test PDF with embedded images using PyMuPDF
  execSync(`/home/ec2-user/anaconda3/bin/python3 -c "
import fitz, struct, zlib
doc = fitz.open()
for i in range(3):
    page = doc.new_page()
    # Create a simple colored PNG
    r, g, b = [(255,0,0),(0,255,0),(0,0,255)][i]
    raw = bytes([0, r, g, b])
    compressed = zlib.compress(raw)
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    sig = b'\\x89PNG\\r\\n\\x1a\\n'
    ihdr = struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0)
    png = sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')
    page.insert_image(fitz.Rect(50, 50, 200, 200), stream=png)
doc.save('${TEST_PDF_PATH}')
doc.close()
"`);
});

test("トップページが表示される", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("PicPicPDF");
  await expect(page.locator("text=PDFをドラッグ&ドロップ")).toBeVisible();
});

test("PDFをアップロードしてサムネイルが表示される", async ({ page }) => {
  await page.goto("/");

  // Upload PDF via file input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(TEST_PDF_PATH);

  // Wait for extraction to complete
  await expect(page.locator("text=件の画像を検出")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("text=3 件の画像を検出")).toBeVisible();

  // Thumbnails should be rendered
  const thumbnails = page.locator("img[alt^='img_']");
  await expect(thumbnails).toHaveCount(3);

  // Download all button should be visible
  await expect(page.locator("text=すべてダウンロード")).toBeVisible();
});

test("個別画像をダウンロードできる", async ({ page }) => {
  await page.goto("/");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(TEST_PDF_PATH);
  await expect(page.locator("text=3 件の画像を検出")).toBeVisible({ timeout: 30000 });

  // Click first thumbnail link to download
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("a[download]").first().click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/^img_\d+\.\w+$/);
});

test("ZIP一括ダウンロードができる", async ({ page }) => {
  await page.goto("/");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(TEST_PDF_PATH);
  await expect(page.locator("text=3 件の画像を検出")).toBeVisible({ timeout: 30000 });

  // Click download all
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("text=すべてダウンロード").click(),
  ]);

  expect(download.suggestedFilename()).toBe("picpicpdf-images.zip");
});

test("別のPDFをアップロードできる（リセット）", async ({ page }) => {
  await page.goto("/");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(TEST_PDF_PATH);
  await expect(page.locator("text=3 件の画像を検出")).toBeVisible({ timeout: 30000 });

  // Click reset
  await page.locator("text=別のPDFをアップロード").click();

  // Should be back to drop zone
  await expect(page.locator("text=PDFをドラッグ&ドロップ")).toBeVisible();
});
