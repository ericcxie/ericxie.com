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
// How far a flick carries past where the finger lifted, in seconds of velocity.
const FLICK_S = 0.2;

// `dir` is +1 for next, -1 for previous, so photos leave and enter from the
// side the swipe points to.
const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

// Faded per layer rather than on the whole overlay: while an ancestor's
// opacity is below 1 the browser can't blur what's behind it, so the blur
// would snap on only when the fade finished.
const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
};

// Framer hands opacity animations to the browser (WAAPI) unless the element
// has an onUpdate. When one of those ends, framer drops it a frame before
// writing the final value, and Safari can paint that gap: the photo blinks
// out right after opening and back in right after closing. Running the
// animation in JS writes every frame itself, so there's no gap.
const noWaapi = { onUpdate: () => {} };

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
  const [dir, setDir] = useState(1);
  const [mounted, setMounted] = useState(false);
  // Keyed by src rather than reset in an effect, so a cached image that loads
  // before the effect would run can't leave the full-size layer hidden.
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [aspects, setAspects] = useState<Record<string, number>>({});

  useEffect(() => setMounted(true), []);

  // Jump to the clicked photo whenever the lightbox opens or the start
  // changes. This runs during render, not in an effect, so the last-viewed
  // photo never paints first and slides over to the new one. It keys off
  // open/closed rather than the `photos` array, which callers may rebuild on
  // every render.
  const open = photos !== null;
  const [shown, setShown] = useState({ open, startIndex });
  // Each opening gets a fresh overlay. Reopening while the last one is still
  // fading out would otherwise revive it, and its carousel would slide from
  // the old photo to the new one.
  const [session, setSession] = useState(0);
  if (shown.open !== open || shown.startIndex !== startIndex) {
    setShown({ open, startIndex });
    if (open) {
      setIndex(startIndex);
      if (!shown.open) setSession((n) => n + 1);
    }
  }

  const count = photos?.length ?? 0;

  const next = useCallback(() => {
    setDir(1);
    setIndex((i) => (count ? (i + 1) % count : 0));
  }, [count]);
  const prev = useCallback(() => {
    setDir(-1);
    setIndex((i) => (count ? (i - 1 + count) % count : 0));
  }, [count]);

  const recordAspect = (src: string, img: HTMLImageElement) => {
    if (img.naturalWidth && img.naturalHeight)
      setAspects((a) =>
        a[src] ? a : { ...a, [src]: img.naturalWidth / img.naturalHeight },
      );
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev, onClose]);

  // Lock page scroll while open. Hiding the scrollbar would widen the page
  // and shift everything sideways, so pad by its width to keep things still.
  useEffect(() => {
    if (!open) return;
    const { style } = document.body;
    const saved = { overflow: style.overflow, paddingRight: style.paddingRight };
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    style.overflow = "hidden";
    if (scrollbar > 0) style.paddingRight = `${scrollbar}px`;
    return () => {
      style.overflow = saved.overflow;
      style.paddingRight = saved.paddingRight;
    };
  }, [open]);

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
            key={session}
            // Stop a closing overlay from catching taps meant for the page
            exit={{ pointerEvents: "none" }}
            className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 md:p-10"
            onClick={onClose}
          >
            <motion.div
              {...fade}
              {...noWaapi}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

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
                  // Learn the neighbor's shape early so it slides in at the
                  // right size
                  onLoad={(e) => recordAspect(n.image, e.currentTarget)}
                />
              ))}
            </div>

            <motion.button
              {...fade}
              {...noWaapi}
              aria-label="Close"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </motion.button>

            {count > 1 && (
              <>
                <motion.button
                  {...fade}
                  {...noWaapi}
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  className={`${navButton} left-6`}
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
                </motion.button>
                <motion.button
                  {...fade}
                  {...noWaapi}
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  className={`${navButton} right-6`}
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
                </motion.button>
              </>
            )}

            <motion.div
              className="relative z-[1] flex w-full justify-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={fade.transition}
              {...noWaapi}
            >
              <AnimatePresence initial={false} custom={dir} mode="popLayout">
                {/* The frame is sized up front, so nothing jumps while
                    loading. It tracks the finger 1:1, and on release the
                    spring picks up the drag's velocity. */}
                <motion.div
                  key={photo.image}
                  className="relative touch-pan-y overflow-hidden rounded-xl bg-white/5"
                  style={{
                    aspectRatio: aspect,
                    width: `min(100%, 56rem, calc(80dvh * ${aspect}))`,
                  }}
                  custom={dir}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  {...noWaapi}
                  transition={{
                    x: { type: "spring", stiffness: 320, damping: 34 },
                    opacity: { duration: 0.2 },
                  }}
                  drag={count > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(_, { offset, velocity }) => {
                    const swipe = offset.x + velocity.x * FLICK_S;
                    if (swipe < -SWIPE_PX) next();
                    else if (swipe > SWIPE_PX) prev();
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* The grid thumbnail shows straight away, then the
                      full-size image fades in over it */}
                  <Image
                    src={photo.image}
                    alt=""
                    fill
                    sizes={THUMB_SIZES}
                    loading="eager"
                    draggable={false}
                    className="!m-0 object-cover"
                    onLoad={(e) => recordAspect(photo.image, e.currentTarget)}
                  />
                  <Image
                    src={photo.image}
                    alt={photo.location ?? "Photo"}
                    fill
                    sizes={FULL_SIZES}
                    loading="eager"
                    draggable={false}
                    className={`!m-0 object-cover transition-opacity duration-300 ${
                      loaded[photo.image] ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() =>
                      setLoaded((l) => ({ ...l, [photo.image]: true }))
                    }
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.div
              {...fade}
              {...noWaapi}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
