"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Camera,
  FileText,
  LayoutGrid,
  Map,
  UserRound,
  X,
} from "lucide-react";

import {
  WORLD_DESTINATIONS,
  type WorldDestination,
} from "./world.config";

const icons = {
  plaza: Map,
  about: UserRound,
  projects: LayoutGrid,
  experience: BriefcaseBusiness,
  writing: FileText,
  photos: Camera,
};

export function Directory({
  open,
  onClose,
  onTravel,
}: {
  open: boolean;
  onClose: () => void;
  onTravel: (destination: WorldDestination) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-immersive-ui
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm"
          onMouseDown={onClose}
        >
          <motion.aside
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-[580px] overflow-hidden rounded-lg border border-white/15 bg-neutral-950/95 text-white shadow-2xl"
            aria-label="World directory"
          >
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase text-white/45">Central Plaza</p>
                <h2 className="mt-1 text-xl font-semibold">Directory</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
                aria-label="Close directory"
                title="Close directory"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2">
              {WORLD_DESTINATIONS.map((destination) => {
                const Icon = icons[destination.id];
                return (
                  <button
                    key={destination.id}
                    onClick={() => onTravel(destination)}
                    className="group flex min-h-[88px] items-center gap-3 border-b border-white/10 px-5 py-4 text-left transition hover:bg-white/[0.06] sm:odd:border-r"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-white/70 transition group-hover:bg-white group-hover:text-black">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {destination.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-white/45">
                        {destination.subtitle}
                      </span>
                    </span>
                    <span className="text-[10px] uppercase text-white/35">
                      {destination.direction}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
