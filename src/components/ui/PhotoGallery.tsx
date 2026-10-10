"use client";
import Image from "next/image";
import { useState } from "react";

import PhotoLightbox from "@/components/ui/PhotoLightbox";

interface PhotoWithLocation {
  image: string;
  location: string;
  date?: string;
}

function shortDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  const month = d.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  return `${month} '${String(d.getUTCFullYear()).slice(2)}`;
}

export const PhotoGallery = ({
  photosWithLocations,
  className,
}: {
  photosWithLocations: PhotoWithLocation[];
  className?: string;
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-5">
        {photosWithLocations.map((photo, i) => (
          <button
            key={photo.image}
            type="button"
            aria-label={`Open photo from ${photo.location || "photo"}`}
            className="group block text-left"
            onClick={() => setLightboxIndex(i)}
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 transition-colors duration-300 group-hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:group-hover:border-neutral-600">
              <Image
                src={photo.image}
                fill
                sizes="(min-width: 768px) 240px, 50vw"
                priority={i < 6}
                className="!m-0 object-cover"
                alt={photo.location || "photo"}
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate text-text-light-headerLight dark:text-white">
                {photo.location?.split(",")[0]}
              </span>
              <span className="shrink-0 text-text-light-body dark:text-text-dark-headerDark">
                {shortDate(photo.date)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <PhotoLightbox
        photos={lightboxIndex !== null ? photosWithLocations : null}
        startIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
};
