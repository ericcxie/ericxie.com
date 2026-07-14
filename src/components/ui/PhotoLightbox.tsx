"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type LightboxPhoto = {
  image: string;
  location?: string;
  date?: string;
};

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
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Jump to the clicked photo whenever the set opens or the start changes.
  useEffect(() => {
    if (photos) setIndex(startIndex);
  }, [photos, startIndex]);

  // Reset the loaded state each time the shown photo changes.
  useEffect(() => setLoaded(false), [index, photos]);

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

  return createPortal(
    <AnimatePresence>
      {photos && photo && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* Close */}
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev / Next */}
          {count > 1 && (
            <>
              <button
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image + caption */}
          <motion.div
            key={photo.image}
            className="relative z-[1] flex max-h-full max-w-4xl flex-col items-center"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex max-h-[80vh] min-h-[240px] min-w-[240px] items-center justify-center">
              {/* Placeholder box + spinner shown until the image paints */}
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white/80" />
                </div>
              )}
              <Image
                src={photo.image}
                alt={photo.location ?? "Photo"}
                width={1400}
                height={1400}
                sizes="(max-width: 768px) 100vw, 896px"
                onLoad={() => setLoaded(true)}
                className={`max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl transition-opacity duration-300 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
                priority
              />
            </div>
            {(photo.location || photo.date) && (
              <div className="mt-3 flex items-center gap-3 text-sm text-white/90">
                {photo.location && (
                  <span className="font-medium">📍 {photo.location}</span>
                )}
                {photo.date && (
                  <span className="text-white/50">
                    {new Date(photo.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                {count > 1 && (
                  <span className="text-white/50">
                    {index + 1} / {count}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
