"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import { useSnowfall } from "@/lib/useSnowfall";

// One flake per this many px of viewport width, up to MAX_FLAKES
const PX_PER_FLAKE = 18;
const MAX_FLAKES = 80;

// Snow settles along the top edge of anything marked with data-snow, and of
// the images in a post. data-no-snow opts out everything inside it.
const SURFACES = "[data-snow]:not([data-no-snow] *), .post img";
// A pile is a row of heights, one per COLUMN px of the edge
const COLUMN = 4;
const MAX_PILE = 7;
// The rest fall past, so it keeps snowing in front of the page
const LAND_CHANCE = 0.5;
// A landed flake raises its column by this much of its radius, fading out
// over SPREAD columns either side
const DEPOSIT = 0.8;
const SPREAD = 4;

// How close the pointer has to pass to a pile to brush it off
const BRUSH_REACH = 12;
// Scrolling faster than this (px/s) shakes every pile loose, as does shaking
// the device harder than SHAKE_FORCE (m/s²)
const FLICK_SPEED = 3000;
const SHAKE_FORCE = 18;

const GRAVITY = 500;
const MAX_LOOSE = 600;

// White disappears on the light background, so light mode gets a cool grey
const COLORS = {
  dark: { flake: "255, 255, 255", pile: "rgba(255, 255, 255, 0.92)" },
  light: { flake: "130, 140, 155", pile: "rgba(176, 186, 200, 0.95)" },
};

type Flake = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  sway: number;
  swaySpeed: number;
  phase: number;
  opacity: number;
};

// Snow knocked off a pile, tumbling out of view
type Loose = { x: number; y: number; vx: number; vy: number; radius: number };

type Surface = {
  el: Element;
  // Keeps the pile off the rounded corners
  inset: number;
  pile: Float32Array;
  left: number;
  top: number;
  width: number;
  onScreen: boolean;
  // Something else is drawn over it: the sticky header, a lightbox, the palette
  covered: boolean;
};

// Bigger flakes read as closer: they fall faster and are more opaque
const spawn = (width: number, y: number): Flake => {
  const depth = Math.random();
  return {
    x: Math.random() * width,
    y,
    radius: 1 + depth * 2,
    speed: 20 + depth * 40,
    sway: 6 + Math.random() * 14,
    swaySpeed: 0.4 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.3 + depth * 0.5,
  };
};

const SnowCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  // A ref, so switching theme recolours the snow without restarting it
  const colors = useRef(COLORS.dark);
  colors.current = resolvedTheme === "light" ? COLORS.light : COLORS.dark;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    const flakes: Flake[] = [];
    const loose: Loose[] = [];
    let surfaces: Surface[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(MAX_FLAKES, Math.round(width / PX_PER_FLAKE));
      // New flakes start above the viewport, so the snow drifts in
      while (flakes.length < count) {
        flakes.push(spawn(width, -Math.random() * height));
      }
      flakes.length = count;
    };
    resize();
    window.addEventListener("resize", resize);

    // Pages come and go, so the list of surfaces is re-read now and then. A
    // surface that's still around keeps its pile.
    const findSurfaces = () => {
      const known = new Map(surfaces.map((s) => [s.el, s]));
      surfaces = Array.from(document.querySelectorAll(SURFACES), (el) => {
        const old = known.get(el);
        if (old) return old;
        const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius);
        return {
          el,
          inset: (radius || 0) * 0.5,
          pile: new Float32Array(0),
          left: 0,
          top: 0,
          width: 0,
          onScreen: false,
          covered: true,
        };
      });
    };
    findSurfaces();
    const findTimer = setInterval(findSurfaces, 1000);

    // Surfaces move as the page scrolls, so they're measured every frame
    const measure = () => {
      for (const s of surfaces) {
        const rect = s.el.getBoundingClientRect();
        s.left = rect.left + s.inset;
        s.top = rect.top;
        s.width = Math.max(0, rect.width - s.inset * 2);
        s.onScreen =
          s.width > COLUMN * SPREAD * 2 &&
          rect.top > 0 &&
          rect.top < height &&
          rect.right > 0 &&
          rect.left < width;
        const columns = Math.ceil(s.width / COLUMN);
        if (s.pile.length !== columns) s.pile = new Float32Array(columns);
      }
    };

    // Hit-testing is the slow part, so it runs less often than measuring
    const checkCovered = () => {
      for (const s of surfaces) {
        if (!s.onScreen) continue;
        const x = Math.min(
          Math.max(s.left + s.width / 2, 1),
          Math.max(width - 1, 1),
        );
        s.covered = !s.el.contains(document.elementFromPoint(x, s.top + 2));
      }
    };
    const coveredTimer = setInterval(checkCovered, 250);

    const settle = (s: Surface, x: number, radius: number) => {
      const column = Math.floor((x - s.left) / COLUMN);
      if (s.pile[column] >= MAX_PILE) return false;
      for (let d = -SPREAD; d <= SPREAD; d++) {
        const i = column + d;
        if (i < 0 || i >= s.pile.length) continue;
        const share = 0.5 + 0.5 * Math.cos((Math.PI * d) / (SPREAD + 1));
        s.pile[i] = Math.min(MAX_PILE, s.pile[i] + radius * DEPOSIT * share);
      }
      return true;
    };

    // Knock the snow off a stretch of a pile and send it tumbling
    const knock = (s: Surface, from: number, to: number, vx = 0, vy = 0) => {
      const end = Math.min(to, s.pile.length - 1);
      for (let i = Math.max(from, 0); i <= end; i++) {
        const depth = s.pile[i];
        s.pile[i] = 0;
        if (depth < 0.3 || loose.length >= MAX_LOOSE) continue;
        loose.push({
          x: s.left + (i + Math.random()) * COLUMN,
          y: s.top - Math.random() * depth,
          vx: vx + (Math.random() - 0.5) * 80,
          vy: vy - Math.random() * 60,
          radius: 0.8 + depth * 0.25,
        });
      }
    };

    const shake = () => {
      for (const s of surfaces) {
        if (s.onScreen && !s.covered) knock(s, 0, s.pile.length - 1);
      }
    };

    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(now - lastScrollTime, 8) / 1000;
      const speed = Math.abs(window.scrollY - lastScrollY) / dt;
      lastScrollY = window.scrollY;
      lastScrollTime = now;
      if (speed > FLICK_SPEED) shake();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // iOS only sends these after a permission prompt, which isn't worth
    // showing for an easter egg; a scroll flick does the same job there
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.acceleration;
      if (a && Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0) > SHAKE_FORCE) shake();
    };
    window.addEventListener("devicemotion", onMotion);

    const pointer = { x: 0, y: 0, vx: 0, vy: 0, time: -Infinity };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const now = performance.now();
      const dt = (now - pointer.time) / 1000;
      // A fresh sample has a previous position to measure speed from
      const moving = dt > 0 && dt < 0.1;
      const fromX = moving ? pointer.x : e.clientX;
      pointer.vx = moving ? (e.clientX - pointer.x) / dt : 0;
      pointer.vy = moving ? (e.clientY - pointer.y) / dt : 0;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.time = now;

      // Brush off whatever the pointer swept across since the last sample
      for (const s of surfaces) {
        if (!s.onScreen || s.covered) continue;
        if (
          pointer.y < s.top - MAX_PILE - BRUSH_REACH ||
          pointer.y > s.top + BRUSH_REACH
        ) {
          continue;
        }
        const lo = Math.min(fromX, pointer.x) - BRUSH_REACH;
        const hi = Math.max(fromX, pointer.x) + BRUSH_REACH;
        if (hi < s.left || lo > s.left + s.width) continue;
        knock(
          s,
          Math.floor((lo - s.left) / COLUMN),
          Math.floor((hi - s.left) / COLUMN),
          pointer.vx * 0.25,
          Math.min(pointer.vy * 0.25, 0),
        );
      }
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Capped, so flakes don't leap after the tab has been in the background
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      measure();
      const open = surfaces.filter((s) => s.onScreen && !s.covered);
      const drag = Math.exp(-dt * 1.2);
      const { flake: rgb, pile: pileColor } = colors.current;

      ctx.clearRect(0, 0, width, height);

      flakes.forEach((flake, i) => {
        const fromY = flake.y;
        flake.phase += flake.swaySpeed * dt;
        flake.y += flake.speed * dt;
        const x = flake.x + Math.sin(flake.phase) * flake.sway;

        const landed = open.some(
          (s) =>
            fromY < s.top &&
            flake.y >= s.top &&
            x >= s.left &&
            x <= s.left + s.width &&
            Math.random() < LAND_CHANCE &&
            settle(s, x, flake.radius),
        );
        if (landed || flake.y - flake.radius > height) {
          flakes[i] = spawn(width, -flake.radius);
          return;
        }

        ctx.beginPath();
        ctx.arc(x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${flake.opacity})`;
        ctx.fill();
      });

      ctx.fillStyle = pileColor;
      for (const s of open) {
        const columns = s.pile.length;
        // Sits a pixel into the edge, so no gap shows above the border
        const base = s.top + 1;
        ctx.beginPath();
        ctx.moveTo(s.left, base);
        for (let i = 0; i < columns; i++) {
          // Thins out towards both ends
          const taper = Math.min(1, i / 3, (columns - 1 - i) / 3);
          ctx.lineTo(s.left + (i + 0.5) * COLUMN, base - s.pile[i] * taper);
        }
        ctx.lineTo(s.left + s.width, base);
        ctx.fill();
      }

      ctx.beginPath();
      for (let i = loose.length - 1; i >= 0; i--) {
        const clump = loose[i];
        clump.vx *= drag;
        clump.vy += GRAVITY * dt;
        clump.x += clump.vx * dt;
        clump.y += clump.vy * dt;
        if (clump.y > height + clump.radius) {
          loose[i] = loose[loose.length - 1];
          loose.pop();
          continue;
        }
        ctx.moveTo(clump.x + clump.radius, clump.y);
        ctx.arc(clump.x, clump.y, clump.radius, 0, Math.PI * 2);
      }
      ctx.fill();

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(findTimer);
      clearInterval(coveredTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    />
  );
};

// Easter egg: light snow over the whole page, toggled from the command palette.
// It settles on anything marked data-snow, and comes off when the pointer
// brushes it or the page is scrolled hard.
export const Snowfall = () => {
  const { isSnowing } = useSnowfall();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isSnowing && !reduceMotion && <SnowCanvas />}
    </AnimatePresence>
  );
};
