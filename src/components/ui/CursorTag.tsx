"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Only a real mouse gets the tag; touch keeps whatever the component shows itself
export const CURSOR_MEDIA = "(hover: hover) and (pointer: fine)";

// Distance from the pointer to the tag's corner, in px
const OFFSET = 14;

type Props = {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  // span by default, so it can sit inline
  as?: "span" | "div";
};

// A small label that follows the pointer while it's over the children
export const CursorTag = ({
  label,
  children,
  className,
  as: Wrapper = "span",
}: Props) => {
  const reduceMotion = useReducedMotion();
  const [hovering, setHovering] = useState(false);
  // The portal waits for the client, so hydration matches the server's HTML
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Trails the pointer a touch; with reduced motion it sits right on it
  const spring = { stiffness: 600, damping: 40, mass: 0.4 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);

  const place = (e: React.PointerEvent, jump = false) => {
    const nx = e.clientX + OFFSET;
    const ny = e.clientY + OFFSET;
    if (jump) {
      // Appear where the pointer is, rather than flying in from the last spot
      sx.jump(nx);
      sy.jump(ny);
    }
    x.set(nx);
    y.set(ny);
  };

  return (
    <Wrapper
      className={className}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse" || !matchMedia(CURSOR_MEDIA).matches)
          return;
        place(e, true);
        setHovering(true);
      }}
      onPointerMove={(e) => hovering && place(e)}
      onPointerLeave={() => setHovering(false)}
    >
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {hovering && label && (
              <motion.div
                aria-hidden
                className="pointer-events-none fixed left-0 top-0 z-50"
                style={reduceMotion ? { x, y } : { x: sx, y: sy }}
              >
                <motion.span
                  // Re-keyed on the label so a change ("copied!") pops in
                  key={typeof label === "string" ? label : undefined}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="block origin-top-left whitespace-nowrap rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-light-headerLight shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-text-dark-body"
                >
                  {label}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </Wrapper>
  );
};
