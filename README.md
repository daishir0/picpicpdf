# PicPicPDF

![PicPicPDF Screenshot](public/screenshot.png)

## Overview
PicPicPDF is a simple web tool that extracts embedded images from PDF files. Just drag and drop a PDF, and all embedded images are displayed as thumbnails for easy download — individually or as a ZIP archive.

Key features:
- Drag & drop PDF upload
- Extract all embedded images using PyMuPDF (fitz)
- Thumbnail preview of extracted images
- Individual image download (click to download)
- Bulk download as ZIP archive
- No login required — instant access utility

## Installation

### Prerequisites
- Node.js 18+
- Python 3 with PyMuPDF (`pip install PyMuPDF`)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/daishir0/picpicpdf.git
cd picpicpdf
```

2. Install dependencies:
```bash
npm install
```

3. Verify PyMuPDF is available:
```bash
python3 -c "import fitz; print(fitz.version)"
```

4. Build and start:
```bash
npm run build
npm start
```

5. Open http://localhost:3029 in your browser.

## Usage

1. Open the application URL in your browser
2. Drag and drop a PDF file onto the drop zone (or click to browse)
3. Wait for image extraction to complete
4. Browse the extracted image thumbnails
5. Click any thumbnail to download that image
6. Click "Download All (ZIP)" to download all images as a ZIP archive
7. Click "Upload another PDF" to process a new file

## Notes
- Maximum PDF file size: 100MB
- Extracted images are stored temporarily and automatically cleaned up after 10 minutes
- The tool extracts actual embedded images from the PDF structure, not page screenshots
- Supported output formats: PNG, JPEG, GIF, BMP, TIFF, WebP

## License
This project is licensed under the MIT License - see the LICENSE file for details.

---

# PicPicPDF

![PicPicPDF スクリーンショット](public/screenshot.png)

## 概要
PicPicPDFは、PDFファイルに埋め込まれた画像を抽出するシンプルなWebツールです。PDFをドラッグ&ドロップするだけで、埋め込まれた全画像がサムネイル表示され、個別またはZIPアーカイブとして簡単にダウンロードできます。

主な機能:
- ドラッグ&ドロップによるPDFアップロード
- PyMuPDF（fitz）を使用した埋め込み画像の抽出
- 抽出画像のサムネイルプレビュー
- 個別画像ダウンロード（クリックでダウンロード）
- ZIP一括ダウンロード
- ログイン不要 — すぐに使えるユーティリティ

## インストール方法

### 前提条件
- Node.js 18以上
- Python 3 + PyMuPDF（`pip install PyMuPDF`）

### セットアップ

1. リポジトリをクローン:
```bash
git clone https://github.com/daishir0/picpicpdf.git
cd picpicpdf
```

2. 依存関係をインストール:
```bash
npm install
```

3. PyMuPDFが利用可能か確認:
```bash
python3 -c "import fitz; print(fitz.version)"
```

4. ビルドして起動:
```bash
npm run build
npm start
```

5. ブラウザで http://localhost:3029 を開きます。

## 使い方

1. ブラウザでアプリケーションのURLを開く
2. PDFファイルをドロップゾーンにドラッグ&ドロップ（またはクリックして選択）
3. 画像抽出の完了を待つ
4. 抽出された画像のサムネイルを確認
5. サムネイルをクリックすると個別ダウンロード
6. 「すべてダウンロード (ZIP)」をクリックでZIP一括ダウンロード
7. 「別のPDFをアップロード」をクリックで新しいファイルを処理

## 注意点
- PDFファイルサイズ上限: 100MB
- 抽出画像は一時保存され、10分後に自動削除されます
- ページのスクリーンショットではなく、PDF構造に埋め込まれた実際の画像を抽出します
- 対応出力フォーマット: PNG, JPEG, GIF, BMP, TIFF, WebP

## ライセンス
このプロジェクトはMITライセンスの下で公開されています。詳細はLICENSEファイルを参照してください。
