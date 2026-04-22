export type FileType = "pdf" | "ai";

export interface ImageInfo {
  filename: string;
  width: number;
  height: number;
  format: string;
  size: number;
  page: number;
}

export interface FontUsage {
  text: string;
  page: number;
}

export interface FontInfo {
  id: string;
  name: string;
  family: string;
  style: string;
  type: string;
  embedded: boolean;
  fontFile: string | null;
  usageCount: number;
  samples: FontUsage[];
  allUsages: FontUsage[];
}

export interface ExtractResult {
  sessionId: string;
  fileType: FileType;
  pageCount: number;
  images: ImageInfo[];
  fonts: FontInfo[];
}
