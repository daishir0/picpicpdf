export interface ImageInfo {
  filename: string;
  width: number;
  height: number;
  format: string;
  size: number;
  page: number;
}

export interface ExtractResult {
  sessionId: string;
  images: ImageInfo[];
}
