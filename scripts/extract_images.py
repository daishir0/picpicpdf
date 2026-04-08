#!/usr/bin/env python3
"""Extract embedded images from a PDF file using PyMuPDF (fitz).

Usage: python extract_images.py <pdf_path> <output_dir>
Output: JSON manifest to stdout with image metadata.
"""

import sys
import os
import json
import io
import fitz
from PIL import Image


# Formats not supported by browsers that need conversion
UNSUPPORTED_FORMATS = {"jpx", "jp2", "jb2", "jbig2"}

# Browser-supported formats (no conversion needed)
SUPPORTED_FORMATS = {"png", "jpg", "jpeg", "gif", "webp", "bmp"}


def convert_unsupported(image_data: bytes, original_ext: str) -> tuple[bytes, str, int, int]:
    """Convert unsupported format to browser-compatible format.

    JPEG 2000 (jpx, jp2) -> JPEG (high quality, minimal loss)
    JBIG2 (jb2, jbig2) -> PNG (lossless for monochrome/document images)

    Returns: (image_data, new_ext, width, height)
    """
    img = Image.open(io.BytesIO(image_data))
    width, height = img.size
    output = io.BytesIO()

    # JPEG 2000 -> JPEG (high quality to minimize loss)
    if original_ext in ("jpx", "jp2"):
        # Convert to RGB if needed
        if img.mode in ("RGBA", "LA", "P"):
            # If has transparency, use PNG instead
            if img.mode == "RGBA" or (img.mode == "P" and "transparency" in img.info):
                img.save(output, format="PNG", optimize=True)
                return output.getvalue(), "png", width, height
            img = img.convert("RGB")
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Save as high-quality JPEG
        img.save(output, format="JPEG", quality=95, optimize=True)
        return output.getvalue(), "jpg", width, height

    # JBIG2 -> PNG (lossless, good for document/monochrome images)
    else:
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")
        img.save(output, format="PNG", optimize=True)
        return output.getvalue(), "png", width, height


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

            ext = extracted.get("ext", "png").lower()
            image_data = extracted["image"]
            width = extracted.get("width", 0)
            height = extracted.get("height", 0)

            # Only convert browser-unsupported formats
            if ext in UNSUPPORTED_FORMATS:
                try:
                    image_data, ext, width, height = convert_unsupported(image_data, ext)
                except Exception as e:
                    print(f"Warning: Failed to convert {ext}: {e}", file=sys.stderr)
                    continue

            # For any other unknown format, try to keep as-is or convert to png
            if ext not in SUPPORTED_FORMATS:
                ext = "png"

            idx += 1
            filename = f"img_{idx:04d}.{ext}"
            filepath = os.path.join(output_dir, filename)

            with open(filepath, "wb") as f:
                f.write(image_data)

            images.append({
                "filename": filename,
                "width": width,
                "height": height,
                "format": ext,
                "size": len(image_data),
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
