#!/usr/bin/env python3
"""Extract embedded images from a PDF file using PyMuPDF (fitz).

Usage: python extract_images.py <pdf_path> <output_dir>
Output: JSON manifest to stdout with image metadata.
"""

import sys
import os
import json
import fitz


def extract_images(pdf_path: str, output_dir: str) -> list[dict]:
    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    images = []
    seen_xrefs = set()
    idx = 0

    for page_num in range(len(doc)):
        page = doc[page_num]
        for img_info in page.get_images(full=True):
            xref = img_info[0]
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)

            try:
                extracted = doc.extract_image(xref)
            except Exception:
                continue

            if not extracted or not extracted.get("image"):
                continue

            ext = extracted.get("ext", "png")
            if ext == "jb2":
                ext = "png"
            if ext not in ("png", "jpg", "jpeg", "bmp", "gif", "tiff", "webp"):
                ext = "png"

            idx += 1
            filename = f"img_{idx:04d}.{ext}"
            filepath = os.path.join(output_dir, filename)

            with open(filepath, "wb") as f:
                f.write(extracted["image"])

            images.append({
                "filename": filename,
                "width": extracted.get("width", 0),
                "height": extracted.get("height", 0),
                "format": ext,
                "size": len(extracted["image"]),
                "page": page_num + 1,
            })

    doc.close()
    return images


def main():
    if len(sys.argv) != 3:
        print("Usage: extract_images.py <pdf_path> <output_dir>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.isfile(pdf_path):
        print(f"File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    images = extract_images(pdf_path, output_dir)
    print(json.dumps(images, ensure_ascii=False))


if __name__ == "__main__":
    main()
