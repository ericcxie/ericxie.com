"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

import type { PostItem } from "@/types";

/**
 * Always-mounted, near-zero-cost trigger. Listens for the `immersive:enter`
 * window event (dispatched by the command palette) and lazy-loads the heavy
 * 3D world only on demand. three.js never enters the normal page bundle.
 */
const ImmersiveWorld = dynamic(() => import("./ImmersiveWorld"), {
  ssr: false,
  loading: () => <LoadingVeil />,
});

export default function ImmersiveGate({ posts = [] }: { posts?: PostItem[] }) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileNote, setShowMobileNote] = useState(false);

  useEffect(() => {
    setMounted(true);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = window.innerWidth < 768;
    setIsMobile(coarse || small);
  }, []);

  const exit = useCallback(() => setActive(false), []);

  useEffect(() => {
    const onEnter = () => {
      if (isMobile) {
        setShowMobileNote(true);
        return;
      }
      setActive(true);
    };
    window.addEventListener("immersive:enter", onEnter);
    return () => window.removeEventListener("immersive:enter", onEnter);
  }, [isMobile]);

  // Lock body scroll while the world is open.
  useEffect(() => {
    if (!active) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [active]);

  if (!mounted) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            key="immersive"
            className="fixed inset-0 z-[200] bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ImmersiveWorld posts={posts} onExit={exit} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMobileNote && (
          <motion.div
            key="mobile-note"
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileNote(false)}
          >
            <div className="max-w-xs rounded-lg border border-white/15 bg-neutral-950 p-6 text-center text-white shadow-2xl">
              <p className="text-lg font-semibold">Immersive mode</p>
              <p className="mt-2 text-sm text-white/70">
                This experience uses a keyboard and mouse — best explored on a
                desktop. Come back on a bigger screen.
              </p>
              <button
                onClick={() => setShowMobileNote(false)}
                className="mt-5 rounded-md bg-white px-4 py-2 text-sm font-medium text-black"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}

function LoadingVeil() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        className="text-sm tracking-[0.3em] text-white/70"
      >
        ENTERING
      </motion.div>
    </div>
  );
}
