#!/usr/bin/env python3
"""Extract embedded images and font usage info from a PDF / Adobe Illustrator (.ai) file using PyMuPDF (fitz).

Usage: python extract_assets.py <input_path> <output_dir> [--filetype=pdf|ai]
Output: JSON manifest to stdout with fileType, pageCount, images, fonts.
"""

import sys
import os
import re
import io
import json
import argparse
import fitz
from PIL import Image


# Formats not directly viewable in browsers — converted to JPEG/PNG before serving.
UNSUPPORTED_IMG_FORMATS = {"jpx", "jp2", "jb2", "jbig2"}
# Formats that browsers can render directly.
SUPPORTED_IMG_FORMATS = {"png", "jpg", "jpeg", "gif", "webp", "bmp"}

SUBSET_PREFIX_RE = re.compile(r"^[A-Z]{6}\+")
CAMEL_SPLIT_RE = re.compile(r"(?<=[a-z])(?=[A-Z])")

STYLE_KEYWORDS = [
    "BoldItalic", "BoldOblique", "SemiBold", "Semibold",
    "ExtraBold", "ExtraLight", "UltraLight", "UltraBold",
    "Bold", "Italic", "Oblique", "Heavy", "Black", "Thin",
    "Light", "Medium", "Regular", "Book",
]

MAX_SAMPLES = 5
MAX_USAGES = 50
SAMPLE_MAX_LEN = 80

FONT_EXT_NORMALIZE = {
    "ttf": "ttf",
    "otf": "otf",
    "cff": "otf",
    "ttc": "ttc",
    "pfb": "pfb",
    "type1": "pfb",
    "type1c": "otf",
}


def strip_subset_prefix(name: str) -> str:
    return SUBSET_PREFIX_RE.sub("", name or "")


def prettify_style(raw: str) -> str:
    return CAMEL_SPLIT_RE.sub(" ", raw).strip() or "Regular"


def parse_family_style(postscript_name: str):
    name = postscript_name or ""
    if "-" in name:
        family, _, style = name.rpartition("-")
        return family.replace("_", " ").strip() or name, prettify_style(style)
    for kw in STYLE_KEYWORDS:
        if name.endswith(kw) and name != kw:
            return name[: -len(kw)].strip() or name, prettify_style(kw)
    return name, "Regular"


def detect_font_ext_from_buffer(buffer: bytes, hint: str) -> str:
    hint_lower = (hint or "").lower()
    if hint_lower in FONT_EXT_NORMALIZE:
        return FONT_EXT_NORMALIZE[hint_lower]
    if not buffer:
        return "bin"
    head = buffer[:4]
    if head == b"OTTO":
        return "otf"
    if head == b"\x00\x01\x00\x00" or head == b"true":
        return "ttf"
    if head[:2] == b"\x80\x01" or b"%!PS-AdobeFont" in buffer[:64]:
        return "pfb"
    return "bin"


def _convert_unsupported_image(image_data, original_ext):
    """Convert a PDF-embedded image in a browser-unsupported format to JPEG/PNG.

    JPEG 2000 (jpx/jp2) -> JPEG (quality=95) to minimise loss.
    JBIG2 (jb2/jbig2) and anything else falls back to lossless PNG.
    Returns (new_bytes, new_ext, width, height).
    """
    img = Image.open(io.BytesIO(image_data))
    width, height = img.size
    output = io.BytesIO()

    if original_ext in ("jpx", "jp2"):
        if img.mode == "RGBA" or (img.mode == "P" and "transparency" in img.info):
            img.save(output, format="PNG", optimize=True)
            return output.getvalue(), "png", width, height
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.save(output, format="JPEG", quality=95, optimize=True)
        return output.getvalue(), "jpg", width, height

    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    img.save(output, format="PNG", optimize=True)
    return output.getvalue(), "png", width, height


def extract_images(doc, images_dir):
    os.makedirs(images_dir, exist_ok=True)
    images = []
    seen_xrefs = set()
    idx = 0

    for page_num in range(len(doc)):
        page = doc[page_num]
        try:
            img_list = page.get_images(full=True)
        except Exception:
            continue
        for img_info in img_list:
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

            if ext in UNSUPPORTED_IMG_FORMATS:
                try:
                    image_data, ext, width, height = _convert_unsupported_image(image_data, ext)
                except Exception as e:
                    print(f"Warning: failed to convert {ext}: {e}", file=sys.stderr)
                    continue

            if ext not in SUPPORTED_IMG_FORMATS:
                ext = "png"

            idx += 1
            filename = f"img_{idx:04d}.{ext}"
            filepath = os.path.join(images_dir, filename)
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

    return images


def _flush_usage(fonts, name, text_chunks, page):
    if not name or not text_chunks:
        return
    text = "".join(text_chunks).strip()
    if len(text) <= 1:
        return
    display = text if len(text) <= SAMPLE_MAX_LEN else text[:SAMPLE_MAX_LEN] + "…"

    entry = fonts.setdefault(name, {
        "usageCount": 0,
        "samples": [],
        "allUsages": [],
        "_seen": set(),
    })
    entry["usageCount"] += 1
    if display not in entry["_seen"] and len(entry["samples"]) < MAX_SAMPLES:
        entry["samples"].append({"text": display, "page": page})
        entry["_seen"].add(display)
    if len(entry["allUsages"]) < MAX_USAGES:
        entry["allUsages"].append({"text": display, "page": page})


def extract_fonts(doc, fonts_dir):
    os.makedirs(fonts_dir, exist_ok=True)

    font_xref_map = {}
    for page_num in range(len(doc)):
        page = doc[page_num]
        try:
            font_entries = page.get_fonts(full=True)
        except Exception:
            continue
        for entry in font_entries:
            if len(entry) < 4:
                continue
            xref = entry[0]
            ext_hint = entry[1] if len(entry) > 1 else ""
            font_type = entry[2] if len(entry) > 2 else ""
            basefont = entry[3] if len(entry) > 3 else ""
            if not basefont:
                continue
            stripped = strip_subset_prefix(basefont)
            if stripped not in font_xref_map:
                font_xref_map[stripped] = (xref, ext_hint, font_type)

    fonts = {}

    for page_num in range(len(doc)):
        page = doc[page_num]
        try:
            text_dict = page.get_text("dict")
        except Exception:
            continue
        for block in text_dict.get("blocks", []):
            if block.get("type", 0) != 0:
                continue
            for line in block.get("lines", []):
                current_font = None
                current_chunks = []
                for span in line.get("spans", []):
                    font_name = span.get("font") or ""
                    text = span.get("text") or ""
                    if not font_name or not text:
                        continue
                    stripped = strip_subset_prefix(font_name)
                    if current_font is None or stripped == current_font:
                        current_font = stripped
                        current_chunks.append(text)
                    else:
                        _flush_usage(fonts, current_font, current_chunks, page_num + 1)
                        current_font = stripped
                        current_chunks = [text]
                if current_font is not None:
                    _flush_usage(fonts, current_font, current_chunks, page_num + 1)

    all_names = set(font_xref_map.keys()) | set(fonts.keys())

    results = []
    sorted_names = sorted(
        all_names,
        key=lambda n: (-(fonts.get(n, {}).get("usageCount", 0)), n),
    )

    for idx, name in enumerate(sorted_names, start=1):
        info = fonts.get(name, {"usageCount": 0, "samples": [], "allUsages": []})
        family, style = parse_family_style(name)
        xref_entry = font_xref_map.get(name)

        font_file = None
        font_type = ""
        embedded = False

        if xref_entry:
            xref, ext_hint, ftype = xref_entry
            font_type = ftype or ""
            try:
                extracted = doc.extract_font(xref)
            except Exception:
                extracted = None
            buffer = b""
            fext = ""
            if extracted and isinstance(extracted, (tuple, list)) and len(extracted) >= 4:
                fext = extracted[1] or ""
                buffer = extracted[3] or b""
            if buffer:
                out_ext = detect_font_ext_from_buffer(buffer, fext or ext_hint)
                if out_ext != "bin":
                    font_filename = f"font_{idx:04d}.{out_ext}"
                    try:
                        with open(os.path.join(fonts_dir, font_filename), "wb") as f:
                            f.write(buffer)
                        font_file = font_filename
                        embedded = True
                    except Exception:
                        pass

        results.append({
            "id": f"font_{idx:04d}",
            "name": name,
            "family": family,
            "style": style,
            "type": font_type,
            "embedded": embedded,
            "fontFile": font_file,
            "usageCount": info.get("usageCount", 0),
            "samples": info.get("samples", [])[:MAX_SAMPLES],
            "allUsages": info.get("allUsages", [])[:MAX_USAGES],
        })

    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_path")
    parser.add_argument("output_dir")
    parser.add_argument("--filetype", default="pdf", choices=["pdf", "ai"])
    args = parser.parse_args()

    if not os.path.isfile(args.input_path):
        print(f"File not found: {args.input_path}", file=sys.stderr)
        sys.exit(1)

    images_dir = os.path.join(args.output_dir, "images")
    fonts_dir = os.path.join(args.output_dir, "fonts")

    doc = fitz.open(args.input_path)
    try:
        page_count = len(doc)
        images = extract_images(doc, images_dir)
        fonts = extract_fonts(doc, fonts_dir)
    finally:
        doc.close()

    result = {
        "fileType": args.filetype,
        "pageCount": page_count,
        "images": images,
        "fonts": fonts,
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
