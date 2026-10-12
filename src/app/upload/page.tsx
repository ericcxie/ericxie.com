"use client";

import { useCallback, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import type { PhotoMetadata } from "@/types";
import exifr from "exifr";
import { useAuth } from "@/lib/useAuth";
import AdminLogin, { adminButton } from "@/components/AdminLogin";
import { reverseGeocode } from "@/lib/places";
import LocationInput from "@/components/ui/LocationInput";

interface StagedPhoto {
  id: string;
  file: File;
  preview: string;
  location: string;
  lng?: number;
  lat?: number;
  date: string;
  locationLoading: boolean;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
}

const COMPRESS_QUALITY = 0.85;
const MAX_DIMENSION = 4096;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Resize if needed to stay within canvas limits (especially iOS Safari)
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      // Try WebP first, fall back to JPEG if unsupported (Safari iOS)
      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob && webpBlob.type === "image/webp") {
            const name = file.name.replace(/\.[^.]+$/, ".webp");
            resolve(new File([webpBlob], name, { type: "image/webp" }));
            return;
          }
          // WebP not supported — fall back to JPEG
          canvas.toBlob(
            (jpegBlob) => {
              if (!jpegBlob) {
                resolve(file);
                return;
              }
              const name = file.name.replace(/\.[^.]+$/, ".jpg");
              resolve(new File([jpegBlob], name, { type: "image/jpeg" }));
            },
            "image/jpeg",
            COMPRESS_QUALITY,
          );
        },
        "image/webp",
        COMPRESS_QUALITY,
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

async function extractMetadata(
  file: File,
): Promise<{ location: string; date: string; locationLoading: boolean }> {
  const today = new Date().toISOString().split("T")[0];
  try {
    const exif = await exifr.parse(file, {
      gps: true,
      pick: ["DateTimeOriginal", "CreateDate", "latitude", "longitude"],
    });
    if (!exif) return { location: "", date: today, locationLoading: false };

    const date = exif.DateTimeOriginal || exif.CreateDate;
    const dateStr = date ? new Date(date).toISOString().split("T")[0] : today;

    const hasGps = exif.latitude !== undefined && exif.longitude !== undefined;

    return {
      location: "",
      date: dateStr,
      locationLoading: hasGps,
    };
  } catch {
    return { location: "", date: today, locationLoading: false };
  }
}

// GPS-tagged photos keep their exact coordinates; only the label is looked up.
async function extractGpsLocation(
  file: File,
): Promise<{ location: string; lng?: number; lat?: number }> {
  try {
    const exif = await exifr.parse(file, {
      gps: true,
      pick: ["latitude", "longitude"],
    });
    if (!exif || exif.latitude === undefined || exif.longitude === undefined)
      return { location: "" };
    const location = await reverseGeocode(exif.longitude, exif.latitude);
    if (!location) return { location: "" };
    return { location, lng: exif.longitude, lat: exif.latitude };
  } catch {
    return { location: "" };
  }
}

export default function UploadPage() {
  const auth = useAuth();
  const { password, authenticated } = auth;
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const newPhotos: StagedPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      const meta = await extractMetadata(file);
      newPhotos.push({
        id,
        file,
        preview,
        location: meta.location,
        date: meta.date,
        locationLoading: meta.locationLoading,
        uploading: false,
        uploaded: false,
      });
    }
    setStagedPhotos((prev) => [...prev, ...newPhotos]);

    // Resolve GPS locations in background
    for (const photo of newPhotos) {
      if (photo.locationLoading) {
        extractGpsLocation(photo.file).then((place) => {
          setStagedPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? { ...p, ...place, locationLoading: false }
                : p,
            ),
          );
        });
      }
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const removePhoto = (id: string) => {
    setStagedPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const updatePhoto = (id: string, updates: Partial<StagedPhoto>) => {
    setStagedPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const uploadAll = async () => {
    const toUpload = stagedPhotos.filter((p) => !p.uploaded);
    if (toUpload.length === 0) return;

    // Mark all as uploading
    for (const photo of toUpload) {
      updatePhoto(photo.id, { uploading: true, error: undefined });
    }

    // Step 1: Compress and upload all files in parallel (client-side upload to blob)
    const uploadResults = await Promise.allSettled(
      toUpload.map(async (photo) => {
        const compressed = await compressImage(photo.file);
        updatePhoto(photo.id, {
          originalSize: photo.file.size,
          compressedSize: compressed.size,
        });

        const blob = await upload(`photos/${compressed.name}`, compressed, {
          access: "public",
          handleUploadUrl: "/api/photos/upload",
          clientPayload: JSON.stringify({ password }),
        });

        return { id: photo.id, url: blob.url, filename: compressed.name };
      }),
    );

    // Process results and collect successful uploads for metadata
    const newPhotos: PhotoMetadata[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const result = uploadResults[i];
      if (result.status === "fulfilled") {
        updatePhoto(toUpload[i].id, { uploading: false, uploaded: true });
        newPhotos.push({
          url: result.value.url,
          filename: result.value.filename,
          location: toUpload[i].location,
          lng: toUpload[i].lng,
          lat: toUpload[i].lat,
          date: new Date(toUpload[i].date).toISOString(),
        });
      } else {
        updatePhoto(toUpload[i].id, {
          uploading: false,
          error: result.reason?.message || "Upload failed",
        });
      }
    }

    // Step 2: Save metadata once for all successful uploads
    if (newPhotos.length > 0) {
      try {
        await fetch("/api/photos/metadata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-upload-password": password,
          },
          body: JSON.stringify(newPhotos),
        });
      } catch {
        // Files are uploaded, metadata save failed — log but don't fail the UI
        console.error("Failed to save metadata");
      }
    }
  };

  const pending = stagedPhotos.filter((p) => !p.uploaded);
  const pendingCount = pending.length;
  const uploadedCount = stagedPhotos.filter((p) => p.uploaded).length;
  const isUploading = stagedPhotos.some((p) => p.uploading);
  const hasPlace = (p: StagedPhoto) => p.lng != null && p.lat != null;
  const missingInfo = pending.some((p) => !hasPlace(p) || !p.date);
  const isLocationLoading = pending.some((p) => p.locationLoading);

  if (!authenticated) return <AdminLogin title="Upload" auth={auth} />;

  return (
    <main className="flex flex-col gap-4">
      <h1
        className="animate-in font-system text-3xl font-bold"
        style={{ "--index": 1 } as React.CSSProperties}
      >
        Upload
      </h1>

      <div
        className="flex animate-in flex-col gap-4"
        style={{ "--index": 2 } as React.CSSProperties}
      >
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex min-h-[140px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            dragActive
              ? "border-neutral-500 bg-neutral-100 dark:bg-neutral-800"
              : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600"
          }`}
        >
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Tap to select photos or drag and drop
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Staged photos */}
        {stagedPhotos.length > 0 && (
          <div className="flex flex-col gap-3">
            {stagedPhotos.map((photo) => (
              <div
                key={photo.id}
                className={`flex gap-3 rounded-lg border p-3 ${
                  photo.uploaded
                    ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                    : photo.error
                      ? "border-red-300 dark:border-red-800"
                      : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {/* Thumbnail */}
                <img
                  src={photo.preview}
                  alt={photo.file.name}
                  className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
                />

                {/* Metadata */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">
                      {photo.file.name}
                    </span>
                    {!photo.uploaded && (
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="ml-2 flex-shrink-0 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        Remove
                      </button>
                    )}
                    {photo.uploaded && (
                      <span className="ml-2 flex-shrink-0 text-xs text-green-600 dark:text-green-400">
                        Uploaded
                        {photo.originalSize && photo.compressedSize && (
                          <span className="ml-1 text-neutral-400">
                            ({formatBytes(photo.originalSize)} →{" "}
                            {formatBytes(photo.compressedSize)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  {editingId === photo.id ? (
                    <div className="flex flex-col gap-1.5">
                      <LocationInput
                        value={photo.location}
                        onChange={(place) =>
                          updatePhoto(photo.id, {
                            lng: undefined,
                            lat: undefined,
                            ...place,
                          })
                        }
                        autoFocus
                      />
                      <input
                        type="date"
                        value={photo.date}
                        onChange={(e) =>
                          updatePhoto(photo.id, { date: e.target.value })
                        }
                        className="rounded border border-neutral-300 bg-transparent px-2 py-1 text-xs outline-none focus:border-neutral-500 dark:border-neutral-700 dark:focus:border-neutral-500"
                      />
                      <button
                        onClick={() => setEditingId(null)}
                        className="self-start text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => !photo.uploaded && setEditingId(photo.id)}
                      className="self-start text-left text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                    >
                      {photo.locationLoading ? (
                        <span className="italic">Detecting location...</span>
                      ) : (
                        <>
                          <span>
                            {photo.location || "No location"} &middot;{" "}
                            {photo.date}
                          </span>
                          {!photo.uploaded &&
                            photo.location &&
                            !hasPlace(photo) && (
                              <span className="ml-1.5 text-amber-600 dark:text-amber-400">
                                pick a suggested place
                              </span>
                            )}
                          {!photo.uploaded && (
                            <span className="ml-1.5 text-neutral-400">
                              (edit)
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  )}

                  {/* Error */}
                  {photo.error && (
                    <p className="text-xs text-red-500">{photo.error}</p>
                  )}

                  {/* Uploading indicator */}
                  {photo.uploading && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div className="h-full w-full animate-infinite-progress rounded-full bg-neutral-800 dark:bg-neutral-200" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Upload button */}
            {pendingCount > 0 && (
              <>
                <button
                  onClick={uploadAll}
                  disabled={isUploading || missingInfo || isLocationLoading}
                  className={adminButton}
                >
                  {isUploading
                    ? "Uploading..."
                    : isLocationLoading
                      ? "Detecting locations..."
                      : `Upload ${pendingCount} photo${pendingCount !== 1 ? "s" : ""}`}
                </button>
              </>
            )}

            {uploadedCount > 0 && pendingCount === 0 && (
              <p className="text-center text-sm text-green-600 dark:text-green-400">
                All photos uploaded!
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
