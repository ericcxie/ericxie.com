"use client";

import { motion } from "framer-motion";
import { Map, X } from "lucide-react";

export function HUD({
  onOpenDirectory,
  onExit,
}: {
  onOpenDirectory: () => void;
  onExit: () => void;
}) {
  return (
    <>
      <div className="pointer-events-none absolute left-4 top-4 z-20">
        <button
          onClick={onOpenDirectory}
          className="pointer-events-auto flex h-9 items-center gap-2 rounded-md border border-white/15 bg-black/55 px-3 text-sm text-white/80 shadow-lg backdrop-blur-md transition hover:bg-black/70 hover:text-white"
        >
          <Map className="h-4 w-4" />
          Directory
        </button>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-20">
        <button
          onClick={onExit}
          className="pointer-events-auto flex h-9 items-center gap-1.5 rounded-md border border-white/15 bg-black/55 px-3 text-sm text-white/80 shadow-lg backdrop-blur-md transition hover:bg-black/70 hover:text-white"
          aria-label="Exit immersive mode"
        >
          <X className="h-4 w-4" />
          Exit
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45 }}
        className="pointer-events-none absolute bottom-4 left-4 z-20 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 rounded-lg border border-white/10 bg-black/55 px-3 py-2.5 text-xs text-white/65 shadow-lg backdrop-blur-md"
      >
        <Legend keys="W / S" label="Drive / brake" />
        <Legend keys="A / D" label="Steer" />
        <Legend keys="Drag" label="Look around" />
        <Legend keys="E" label="Interact" />
      </motion.div>
    </>
  );
}

function Legend({ keys, label }: { keys: string; label: string }) {
  return (
    <>
      <kbd className="min-w-12 rounded border border-white/10 bg-white/10 px-1.5 py-0.5 text-center font-medium text-white/90">
        {keys}
      </kbd>
      <span className="self-center">{label}</span>
    </>
  );
}
