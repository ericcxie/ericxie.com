import photosData from "@/content/photos/photos.json";
import type { PhotoEntry } from "@/types";

export const photoSrc = (filename: string) => `/img/photos/${filename}`;

// Newest first
export const photos: PhotoEntry[] = [...photosData].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);
