"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";

import type { Exhibit } from "./world.config";

export function InteractPrompt({ exhibit }: { exhibit: Exhibit | null }) {
  return (
    <AnimatePresence>
      {exhibit && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-white/15 bg-black/65 px-3 py-2 text-sm text-white/90 shadow-xl backdrop-blur-md"
        >
          <kbd className="flex h-6 min-w-6 items-center justify-center rounded border border-white/15 bg-white/10 px-1.5 text-xs font-medium">
            E
          </kbd>
          <span className="max-w-[260px] truncate">Open {exhibit.title}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ContentPanel({
  exhibit,
  onClose,
  onNavigate,
}: {
  exhibit: Exhibit | null;
  onClose: () => void;
  onNavigate: (href: string) => void;
}) {
  return (
    <AnimatePresence>
      {exhibit?.panel && (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: "spring", stiffness: 360, damping: 32 }}
          className="absolute right-4 top-20 z-30 w-[min(380px,calc(100vw-2rem))] rounded-lg border border-white/15 bg-neutral-950/90 p-5 text-white shadow-2xl backdrop-blur-xl"
          aria-label={`${exhibit.title} details`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              {exhibit.eyebrow && (
                <p className="mb-1 text-xs uppercase text-white/45">
                  {exhibit.eyebrow}
                </p>
              )}
              <h2 className="text-xl font-semibold">{exhibit.panel.heading}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
              aria-label="Close details"
              title="Close details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {exhibit.panel.body && (
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {exhibit.panel.body}
            </p>
          )}

          {exhibit.panel.fields && exhibit.panel.fields.length > 0 && (
            <dl className="mt-5 divide-y divide-white/10 border-y border-white/10">
              {exhibit.panel.fields.map((field, index) => (
                <div key={index} className="flex gap-3 py-2.5 text-sm">
                  {field.label && (
                    <dt className="w-14 shrink-0 text-white/40">
                      {field.label}
                    </dt>
                  )}
                  <dd className="text-white/80">{field.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {exhibit.panel.href && (
            <button
              onClick={() => onNavigate(exhibit.panel!.href!)}
              className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
            >
              {exhibit.panel.hrefLabel ?? "Open"}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
