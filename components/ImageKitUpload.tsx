"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImageKitClient } from "imagekitio-next";

type ImageKitUploadProps = {
  onSuccess: (url: string) => void;
  folder?: string;
  buttonClassName?: string;
  label?: string;
  disabled?: boolean;
  mode?: "button" | "tile";
};

const defaultButtonClassName =
  "editorial-button-secondary rounded-[1rem] px-4 py-3 text-[0.68rem]";

// 🔥 spinner loader
const Spinner = () => (
  <div className="flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
  </div>
);

export default function ImageKitUpload({
  onSuccess,
  folder,
  buttonClassName,
  label = "Choose file",
  disabled,
  mode = "button",
}: ImageKitUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!urlEndpoint || !publicKey) {
    return (
      <p className="text-sm text-stone-500">
        Image upload is not configured yet.
      </p>
    );
  }

  const pickFile = () => {
    inputRef.current?.click();
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setUploading(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const uploadFile = async (nextFile: File) => {
    setUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/imagekit/auth");
      if (!res.ok) throw new Error("ImageKit auth failed");

      const { token, expire, signature } = await res.json();

      const imagekit = new ImageKitClient({
        publicKey,
        urlEndpoint,
      });

      const uploadRes: { url?: string } = await imagekit.upload({
        file: nextFile,
        fileName: nextFile.name,
        token,
        expire,
        signature,
        useUniqueFileName: true,
        folder,
      });

      if (!uploadRes.url) throw new Error("Upload failed");

      onSuccess(uploadRes.url);
      reset();
    } catch {
      setError("Upload failed. Try again.");
      setUploading(false);
    }
  };

  return (
    <div className="flex w-full h-full flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const nextFile = e.target.files?.[0] || null;
          setFile(nextFile);
          if (nextFile) {
            void uploadFile(nextFile);
          }
        }}
      />

      {previewUrl ? (
        <button
          type="button"
          onClick={pickFile}
          disabled={uploading}
          className="w-full h-full"
        >
          <div className="overflow-hidden h-full w-full rounded-[1.4rem] bg-[#eff0ef] p-2">
            <div className="relative h-full w-full overflow-hidden rounded-[1rem]">
              <Image
                src={previewUrl}
                alt="Upload preview"
                fill
                unoptimized
                className={`object-cover transition-opacity ${uploading ? "opacity-60" : "opacity-100"
                  }`}
              />

              {/* 🔥 overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                {uploading ? (
                  <Spinner />
                ) : (
                  <span className="text-sm font-medium text-white">
                    Change image
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={pickFile}
          className={`${mode === "tile"
              ? `group flex aspect-square h-full w-full items-center justify-center overflow-hidden rounded-none border border-stone-900/8 bg-[#eceae6] transition-colors hover:bg-[#e4e1dc] ${buttonClassName || ""
              }`
              : `${buttonClassName || defaultButtonClassName}`
            } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {mode === "tile" ? (
            uploading ? (
              <Spinner />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/86 text-xl font-medium text-stone-500 shadow-[0_8px_20px_rgba(15,15,15,0.06)] transition-colors group-hover:text-stone-900">
                +
              </span>
            )
          ) : uploading ? (
            <Spinner />
          ) : (
            label
          )}
        </button>
      )}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
