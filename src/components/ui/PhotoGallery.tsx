"use client";
import { cn } from "@/utils/cn";
import { MotionConfig, motion } from "framer-motion";
import { Images, LayoutGrid, Shuffle } from "lucide-react";
import { Caveat } from "next/font/google";
import Image from "next/image";
import { useRef, useState } from "react";

import PhotoLightbox from "@/components/ui/PhotoLightbox";

const caveat = Caveat({ subsets: ["latin"], weight: ["500"] });

interface PhotoWithLocation {
  image: string;
  location: string;
  date?: string;
}

// Table layout, in rem. Cards sit on a loose 4-column grid that gets jittered,
// so rows overlap like prints tossed onto a table. INSET keeps tilted corners
// inside the site column.
const COLS = 4;
const CARD_W = 10;
const CARD_H = 16.5;
const ROW_PITCH = 9.5;
const JITTER_Y = 1.5;
const PAD = 1;
const INSET = 1.25;

const PRINT_SHADOW =
  "shadow-[0_1px_2px_rgba(0,0,0,0.12),0_6px_16px_-4px_rgba(0,0,0,0.25)]";
const PRINT_SHADOW_LIFTED =
  "transition-shadow duration-300 group-hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_24px_40px_-8px_rgba(0,0,0,0.4)]";

// Seeded PRNG so the server and client render the same scatter.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scatter(n: number, seed: number) {
  const rand = mulberry32(seed);

  // Shuffle which grid slot each photo lands in so trips don't clump together.
  const slots = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  return slots.map((slot) => {
    const row = Math.floor(slot / COLS);
    const col = slot % COLS;
    const inRow = Math.min(COLS, n - row * COLS);
    const fx =
      inRow === 1
        ? 0.5
        : Math.min(1, Math.max(0, (col + (rand() - 0.5) * 0.7) / (inRow - 1)));
    return {
      fx,
      y: PAD + row * ROW_PITCH + rand() * JITTER_Y,
      rotate: (rand() - 0.5) * 16,
    };
  });
}

function caption(photo: PhotoWithLocation) {
  const place = photo.location?.split(",")[0];
  if (!photo.date) return place;
  const d = new Date(photo.date);
  const month = d.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const year = String(d.getUTCFullYear()).slice(2);
  return place ? `${place} · ${month} '${year}` : `${month} '${year}`;
}

function Polaroid({
  photo,
  sizes,
  priority,
  className,
}: {
  photo: PhotoWithLocation;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[3px] bg-[#fbfaf6] p-2 pb-0", className)}>
      <div className="relative aspect-[2/3] overflow-hidden bg-neutral-200">
        <Image
          src={photo.image}
          fill
          sizes={sizes}
          draggable={false}
          priority={priority}
          className="pointer-events-none !m-0 object-cover"
          alt={photo.location || "photo"}
        />
      </div>
      <p
        className={cn(
          caveat.className,
          "truncate px-1 pb-2 pt-1 text-center leading-tight text-neutral-700",
        )}
      >
        {caption(photo)}
      </p>
    </div>
  );
}

function TableCard({
  photo,
  pos,
  z,
  delay,
  boundsRef,
  priority,
  onLift,
  onOpen,
}: {
  photo: PhotoWithLocation;
  pos: { fx: number; y: number; rotate: number };
  z: number;
  delay: number;
  boundsRef: React.RefObject<HTMLDivElement>;
  priority: boolean;
  onLift: () => void;
  onOpen: () => void;
}) {
  // A drag shouldn't also count as a click that opens the lightbox.
  const dragged = useRef(false);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`Open photo from ${photo.location || "photo"}`}
      className="group absolute cursor-grab touch-none rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-sky-500 active:cursor-grabbing"
      style={{
        width: `${CARD_W}rem`,
        left: `calc(${INSET}rem + (100% - ${CARD_W + INSET * 2}rem) * ${pos.fx})`,
        top: `${pos.y}rem`,
        zIndex: z,
      }}
      drag
      dragConstraints={boundsRef}
      dragElastic={0}
      dragTransition={{
        power: 0.25,
        timeConstant: 220,
        bounceStiffness: 600,
        bounceDamping: 40,
      }}
      whileHover={{ scale: 1.03 }}
      // Straighten the print a little while it's held.
      whileDrag={{ scale: 1.06, rotate: -pos.rotate / 2 }}
      onPointerDown={() => {
        dragged.current = false;
        onLift();
      }}
      onDragStart={() => (dragged.current = true)}
      onClick={() => {
        if (!dragged.current) onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {/* Inner layer handles the drop-in, so its delay never slows hover/drag */}
      <motion.div
        initial={{ opacity: 0, scale: 1.15, rotate: pos.rotate * 2 }}
        animate={{ opacity: 1, scale: 1, rotate: pos.rotate }}
        transition={{ type: "spring", stiffness: 260, damping: 24, delay }}
      >
        <Polaroid
          photo={photo}
          sizes="160px"
          priority={priority}
          className={cn(PRINT_SHADOW, PRINT_SHADOW_LIFTED, "[&>p]:text-base")}
        />
      </motion.div>
    </motion.div>
  );
}

export const PhotoGallery = ({
  photosWithLocations,
  className,
}: {
  photosWithLocations: PhotoWithLocation[];
  className?: string;
}) => {
  const n = photosWithLocations.length;
  const boundsRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<"pile" | "grid">("pile");
  const [seed, setSeed] = useState(7);
  // Photos come in newest-first, so the newest memories start on top.
  const [zs, setZs] = useState(() => photosWithLocations.map((_, i) => n - i));
  const topZ = useRef(n);

  const positions = scatter(n, seed);
  const rows = Math.ceil(n / COLS);
  const tableHeight = PAD * 2 + (rows - 1) * ROW_PITCH + JITTER_Y + CARD_H;

  const lift = (i: number) => {
    topZ.current += 1;
    const z = topZ.current;
    setZs((prev) => prev.map((v, j) => (j === i ? z : v)));
  };

  const reshuffle = () => {
    setSeed((s) => s + 1);
    topZ.current = n;
    setZs(photosWithLocations.map((_, i) => n - i));
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={className}>
        {/* Mobile: a loose two-column stack, tap to open */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 pb-6 md:hidden">
          {photosWithLocations.map((photo, i) => {
            const tilt = (mulberry32(i + 1)() - 0.5) * 6;
            return (
              <button
                key={`mobile-${i}`}
                type="button"
                aria-label={`Open photo from ${photo.location || "photo"}`}
                className="text-left"
                style={{
                  transform: `rotate(${tilt}deg) translateY(${i % 2 ? 1.5 : 0}rem)`,
                }}
                onClick={() => setLightboxIndex(i)}
              >
                <Polaroid
                  photo={photo}
                  sizes="50vw"
                  priority={i < 4}
                  className={cn(PRINT_SHADOW, "p-1.5 pb-0 [&>p]:text-base")}
                />
              </button>
            );
          })}
        </div>

        {/* Desktop: a pile of prints to push around, or a tidy grid */}
        <div className="mb-4 hidden items-center justify-end text-sm text-text-light-body dark:text-text-dark-body md:flex">
          <div className="flex items-center gap-2">
            {mode === "pile" && (
              <button
                type="button"
                onClick={reshuffle}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-black/5 hover:text-text-light-header dark:hover:bg-white/10 dark:hover:text-text-dark-header"
              >
                <Shuffle className="h-3.5 w-3.5" />
                shuffle
              </button>
            )}
            <div className="flex rounded-lg border border-black/10 p-0.5 dark:border-white/10">
              {(
                [
                  ["pile", Images],
                  ["grid", LayoutGrid],
                ] as const
              ).map(([value, Icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-0.5 transition hover:text-text-light-header dark:hover:text-text-dark-header",
                    mode === value &&
                      "bg-black/5 text-text-light-header dark:bg-white/10 dark:text-text-dark-header",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        {mode === "pile" ? (
          <div
            className="relative isolate hidden select-none md:block"
            style={{ height: `${tableHeight}rem` }}
          >
            {/* Drag bounds, inset so tilted prints can't poke past the column */}
            <div
              ref={boundsRef}
              aria-hidden
              className="pointer-events-none absolute"
              style={{ inset: `${PAD}rem ${INSET}rem` }}
            />
            {photosWithLocations.map((photo, i) => (
              <TableCard
                key={`${seed}-${i}`}
                photo={photo}
                pos={positions[i]}
                z={zs[i]}
                // Oldest prints land first, so the pile builds up to the newest.
                delay={(n - 1 - i) * 0.04}
                boundsRef={boundsRef}
                priority={i < 5}
                onLift={() => lift(i)}
                onOpen={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        ) : (
          <div className="hidden grid-cols-3 gap-5 md:grid">
            {photosWithLocations.map((photo, i) => (
              <motion.button
                key={`grid-${i}`}
                type="button"
                aria-label={`Open photo from ${photo.location || "photo"}`}
                className="group text-left"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.025 }}
                onClick={() => setLightboxIndex(i)}
              >
                <Polaroid
                  photo={photo}
                  sizes="220px"
                  className={cn(
                    PRINT_SHADOW,
                    PRINT_SHADOW_LIFTED,
                    "transition duration-300 group-hover:-translate-y-1 [&>p]:text-base",
                  )}
                />
              </motion.button>
            ))}
          </div>
        )}

        <PhotoLightbox
          photos={lightboxIndex !== null ? photosWithLocations : null}
          startIndex={lightboxIndex ?? 0}
          onClose={() => setLightboxIndex(null)}
        />
      </div>
    </MotionConfig>
  );
};
