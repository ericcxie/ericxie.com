"use client";
import { cn } from "@/utils/cn";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";

import PhotoLightbox from "@/components/ui/PhotoLightbox";

interface PhotoWithLocation {
  image: string;
  location: string;
  date?: string;
}

function PhotoImage({
  photo,
  className,
  onClick,
  priority,
}: {
  photo: PhotoWithLocation;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
}) {
  return (
    <div className="relative" onClick={onClick}>
      <Image
        src={photo.image}
        className={cn(
          "h-70 !m-0 w-full gap-5 rounded-lg object-cover object-left-top !p-0 transition duration-500",
          className,
        )}
        height={600}
        width={600}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        placeholder="empty"
        loading={priority ? "eager" : "lazy"}
        alt={photo.location || "photo"}
      />
    </div>
  );
}

export const PhotoGallery = ({
  photosWithLocations,
  className,
}: {
  photosWithLocations: PhotoWithLocation[];
  className?: string;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { scrollYProgress } = useScroll({
    container: gridRef,
    offset: ["start start", "end start"],
  });

  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, -200]);

  // Distribute photos across 3 columns, remembering each photo's original
  // index so the lightbox can open the full gallery at the right spot.
  const columns: { photo: PhotoWithLocation; index: number }[][] = [
    [],
    [],
    [],
  ];
  photosWithLocations.forEach((photo, index) => {
    columns[index % 3].push({ photo, index });
  });

  return (
    <div
      className={cn(
        "hide-scrollbar h-full w-full items-start overflow-y-auto rounded-lg md:h-[50rem]",
        className,
      )}
      ref={gridRef}
    >
      {/* Mobile: Single column in chronological order */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:hidden">
        {photosWithLocations.map((photo, idx) => (
          <div
            key={`mobile-${idx}`}
            className="relative cursor-pointer"
            onClick={() => setLightboxIndex(idx)}
          >
            <PhotoImage photo={photo} priority={idx < 2} />
            {photo.location && (
              <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                📍 {photo.location}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: 3-column masonry grid */}
      <div className="mx-auto hidden max-w-5xl grid-cols-1 items-start gap-5 md:grid md:grid-cols-2 lg:grid-cols-3">
        {columns.map((column, colIdx) => {
          const translate = [translateFirst, translateSecond, translateThird][
            colIdx
          ];
          return (
            <div key={colIdx} className="grid gap-5">
              {column.map(({ photo, index }) => (
                <motion.div
                  style={{ y: translate }}
                  key={`grid-${index}`}
                  className="group relative cursor-pointer"
                  onClick={() => setLightboxIndex(index)}
                >
                  <PhotoImage
                    photo={photo}
                    priority={index < 3}
                    className="hover:grayscale"
                  />
                  {photo.location && (
                    <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      📍 {photo.location}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>

      <PhotoLightbox
        photos={lightboxIndex !== null ? photosWithLocations : null}
        startIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
};
