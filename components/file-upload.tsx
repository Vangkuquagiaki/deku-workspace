"use client";

import React, { useState, useRef } from "react";
import { FileIcon, UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: "messageFile" | "serverImage";
}

export function FileUpload({
  onChange,
  value,
  endpoint
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileType = value?.split(".").pop()?.toLowerCase();
  const isPdf = fileType === "pdf";

  // Upload file to local /api/upload
  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Tải tệp lên thất bại");
      }

      onChange(data.url);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Lỗi tải tệp. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  // Preview Image (for server image or message image)
  if (value && !isPdf) {
    return (
      <div className="relative h-28 w-28 mx-auto group">
        <Image
          fill
          src={value}
          alt="Upload"
          className={endpoint === "serverImage" ? "rounded-full object-cover border-2 border-indigo-500 shadow-md" : "rounded-md object-cover border border-zinc-300 dark:border-zinc-700 shadow"}
        />
        <button
          onClick={() => onChange("")}
          className="bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-md transition"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Preview PDF / document
  if (value && isPdf) {
    return (
      <div className="relative flex items-center p-3 mt-2 rounded-md bg-zinc-100 dark:bg-[#2b2d31] border border-zinc-200 dark:border-zinc-700 max-w-sm mx-auto">
        <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-500 shrink-0" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-xs font-semibold text-indigo-500 dark:text-indigo-400 hover:underline truncate"
        >
          {value.split("/").pop()}
        </a>
        <button
          onClick={() => onChange("")}
          className="bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-md transition"
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Drag & drop dropzone
  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={endpoint === "serverImage" ? "image/*" : "image/*,application/pdf"}
        onChange={onFileChange}
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition select-none ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-[#2b2d31]/50"
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-y-2 py-4">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Đang tải tệp lên...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-y-2 text-center">
            <div className="h-12 w-12 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 mb-1">
              {endpoint === "serverImage" ? (
                <ImageIcon className="h-6 w-6" />
              ) : (
                <UploadCloud className="h-6 w-6" />
              )}
            </div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Kéo thả tệp vào đây hoặc{" "}
              <span className="text-indigo-500 hover:underline">duyệt tìm tệp</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {endpoint === "serverImage"
                ? "Hỗ trợ hình ảnh: PNG, JPG, GIF (Tối đa 10MB)"
                : "Hỗ trợ: Hình ảnh PNG, JPG, GIF hoặc tài liệu PDF (Tối đa 25MB)"}
            </p>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-rose-500 mt-2 text-center font-medium">
          {uploadError}
        </p>
      )}
    </div>
  );
}
