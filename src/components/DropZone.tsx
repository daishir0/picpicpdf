"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".ai"];

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export default function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && isAcceptedFile(file)) {
        onFileSelected(file);
      }
    },
    [onFileSelected, disabled]
  );

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      e.target.value = "";
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center
        w-full max-w-2xl mx-auto
        border-2 border-dashed rounded-2xl
        p-12 sm:p-16
        transition-all duration-200
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-400 hover:bg-blue-50/50"}
        ${isDragOver ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-gray-300 bg-white"}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.ai,application/pdf,application/illustrator,application/postscript"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={`mb-4 p-4 rounded-full transition-colors ${
          isDragOver ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        {isDragOver ? (
          <FileText className="w-10 h-10 text-blue-500" />
        ) : (
          <Upload className="w-10 h-10 text-gray-400" />
        )}
      </div>

      <p className="text-lg font-medium text-gray-700 mb-1">
        {isDragOver ? "ドロップしてアップロード" : "PDF / Illustrator (.ai) をドラッグ&ドロップ"}
      </p>
      <p className="text-sm text-gray-400">
        またはクリックしてファイルを選択（最大100MB）
      </p>
    </div>
  );
}
