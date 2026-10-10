"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type LightboxPhoto = {
  image: string;
  location?: string;
  date?: string;
};

// Same `sizes` as the gallery grid, so the browser reuses the thumbnail it
// already has and the photo shows the moment the lightbox opens.
const THUMB_SIZES = "(min-width: 768px) 240px, 50vw";
const FULL_SIZES = "(min-width: 768px) 640px, 92vw";
const SWIPE_PX = 60;

const navButton =
  "absolute z-10 hidden h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white md:flex";

export default function PhotoLightbox({
  photos,
  startIndex = 0,
  onClose,
}: {
  photos: LightboxPhoto[] | null;
  startIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  // Keyed by src rather than reset in an effect, so a cached image that loads
  // before the effect would run can't leave the full-size layer hidden.
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [aspects, setAspects] = useState<Record<string, number>>({});

  useEffect(() => setMounted(true), []);

  // Jump to the clicked photo whenever the set opens or the start changes.
  useEffect(() => {
    if (photos) setIndex(startIndex);
  }, [photos, startIndex]);

  const count = photos?.length ?? 0;

  const next = useCallback(
    () => setIndex((i) => (count ? (i + 1) % count : 0)),
    [count],
  );
  const prev = useCallback(
    () => setIndex((i) => (count ? (i - 1 + count) % count : 0)),
    [count],
  );

  useEffect(() => {
    if (!photos) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [photos, next, prev, onClose]);

  if (!mounted) return null;

  const photo = photos?.[index];
  // Most photos are 2:3 portraits; the real ratio replaces this once the
  // thumbnail reports its size.
  const aspect = (photo && aspects[photo.image]) || 2 / 3;

  // Warm the adjacent full-size images so next/prev is instant.
  const neighbors =
    photos && count > 1
      ? Array.from(new Set([(index + 1) % count, (index - 1 + count) % count]))
          .filter((i) => i !== index)
          .map((i) => photos[i])
      : [];

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {photos && photo && (
          <motion.div
            className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            <div
              aria-hidden
              className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
            >
              {neighbors.map((n) => (
                <Image
                  key={n.image}
                  src={n.image}
                  alt=""
                  width={1400}
                  height={1400}
                  sizes={FULL_SIZES}
                  loading="eager"
                />
              ))}
            </div>

            <button
              aria-label="Close"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>

            {count > 1 && (
              <>
                <button
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  className={`${navButton} left-6`}
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
                </button>
                <button
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  className={`${navButton} right-6`}
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
                </button>
              </>
            )}

            {/* The frame is sized up front, so nothing jumps while loading */}
            <motion.div
              className="relative z-[1] touch-pan-y overflow-hidden rounded-xl bg-white/5"
              style={{
                aspectRatio: aspect,
                width: `min(100%, 56rem, calc(80dvh * ${aspect}))`,
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 34 }}
              drag={count > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, { offset }) => {
                if (offset.x < -SWIPE_PX) next();
                else if (offset.x > SWIPE_PX) prev();
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* The grid thumbnail shows straight away, then the full-size
                  image fades in over it */}
              <Image
                key={`thumb-${photo.image}`}
                src={photo.image}
                alt=""
                fill
                sizes={THUMB_SIZES}
                draggable={false}
                className="!m-0 object-cover"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const src = photo.image;
                  if (img.naturalWidth && img.naturalHeight)
                    setAspects((a) => ({
                      ...a,
                      [src]: img.naturalWidth / img.naturalHeight,
                    }));
                }}
              />
              <Image
                key={photo.image}
                src={photo.image}
                alt={photo.location ?? "Photo"}
                fill
                sizes={FULL_SIZES}
                draggable={false}
                className={`!m-0 object-cover transition-opacity duration-300 ${
                  loaded[photo.image] ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setLoaded((l) => ({ ...l, [photo.image]: true }))}
              />
            </motion.div>

            <div
              className="relative z-[1] mt-3 flex items-baseline gap-3 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {photo.location && (
                <span className="text-white/90">{photo.location}</span>
              )}
              {photo.date && (
                <span className="text-white/50">
                  {new Date(photo.date).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
              )}
              {count > 1 && (
                <span className="tabular-nums text-white/50">
                  {index + 1} / {count}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
