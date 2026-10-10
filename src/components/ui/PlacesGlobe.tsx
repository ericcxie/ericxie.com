"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Minus, Plus } from "lucide-react";
import {
  geoDistance,
  geoGraticule10,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import landTopology from "world-atlas/land-110m.json";

import PhotoLightbox from "@/components/ui/PhotoLightbox";
import type { Place } from "@/content/photos/locations";

// A line-drawn globe in the same spirit as the hairline figures: one canvas of
// thin strokes, with the photo pins as HTML on top so they keep their thumbnails,
// hover previews and lightbox.

const topology = landTopology as unknown as Topology<{
  land: GeometryCollection;
}>;
const land = feature(topology, topology.objects.land) as GeoPermissibleObjects;
const graticule = geoGraticule10();
const sphere = { type: "Sphere" } as GeoPermissibleObjects;

const MAX_HEIGHT = 400; // the panel is square on phones, capped at this on wider screens
const DEGREES_PER_SECOND = 3; // one turn every two minutes
const RESUME_AFTER_MS = 1500;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4; // the world outline is simplified, so it gets blocky past this
const POPUP_HEIGHT = 165; // the preview card: 110px photo plus its caption

const PALETTE = {
  dark: {
    outline: "#5a5a5a",
    land: "#8a8a8a",
    grid: "#222222",
    fill: "#0c0c0c",
  },
  light: {
    outline: "#c4c4c4",
    land: "#8a8a8a",
    grid: "#ededed",
    fill: "#fcfcfc",
  },
};

const optimized = (src: string, width: number, quality = 70) =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;

export default function PlacesGlobe({ places }: { places: Place[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pinRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [activePlace, setActivePlace] = useState<Place | null>(null);
  // Pins are positioned by the projection, so they only render once it exists
  // (otherwise they'd flash in the corner and fetch thumbnails during page load)
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  // Where the preview card goes: above the pin, or below it near the top edge
  const [popup, setPopup] = useState<{
    x: number;
    y: number;
    below: boolean;
  } | null>(null);

  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === "light" ? PALETTE.light : PALETTE.dark;
  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  // Anything that pauses the spin: a hovered pin, an open lightbox, a drag
  const pausedRef = useRef(false);
  pausedRef.current = hovered !== null || activePlace !== null;
  const drawRef = useRef<() => void>(() => {});
  const zoomByRef = useRef<(factor: number) => void>(() => {});

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const projection = geoOrthographic().rotate([100, -25]).clipAngle(90);
    const path = geoPath(projection, ctx);
    let width = 0;
    let zoom = 1;
    let height = 0;
    let baseScale = 0;

    const resize = () => {
      width = wrap.clientWidth;
      height = wrap.clientHeight;
      // Fit the globe to the panel's shorter side
      baseScale = Math.min(width, height) / 2 - 24;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      projection.scale(baseScale * zoom).translate([width / 2, height / 2]);
      draw();
    };

    const draw = () => {
      const c = colorsRef.current;
      ctx.clearRect(0, 0, width, height);
      ctx.lineJoin = "round";

      ctx.beginPath();
      path(sphere);
      ctx.fillStyle = c.fill;
      ctx.fill();

      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = c.grid;
      ctx.lineWidth = 0.75;
      ctx.stroke();

      ctx.beginPath();
      path(land);
      ctx.strokeStyle = c.land;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.beginPath();
      path(sphere);
      ctx.strokeStyle = c.outline;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Move each pin to its point; hide the ones on the far side
      const [lambda, phi] = projection.rotate();
      const center: [number, number] = [-lambda, -phi];
      places.forEach((place, i) => {
        const pin = pinRefs.current[i];
        if (!pin) return;
        const point: [number, number] = [place.lng, place.lat];
        const visible = geoDistance(point, center) < Math.PI / 2 - 0.08;
        const xy = projection(point);
        if (!xy) return;
        pin.style.translate = `${xy[0]}px ${xy[1]}px`;
        pin.style.opacity = visible ? "1" : "0";
        pin.style.pointerEvents = visible ? "auto" : "none";
      });
    };
    drawRef.current = draw;

    // Spin only while visible on screen, and not for reduced-motion visitors
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let onScreen = false;
    let raf = 0;
    let last = 0;
    let resumeAt = 0;
    const frame = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      if (!pausedRef.current && !dragging && now >= resumeAt) {
        const [l, p] = projection.rotate();
        // Spin slower when zoomed in, so the view doesn't race past
        projection.rotate([l + (DEGREES_PER_SECOND / zoom) * dt, p]);
        draw();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || reduceMotion || !onScreen) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const setZoom = (z: number) => {
      zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
      projection.scale(baseScale * zoom);
      resumeAt = performance.now() + RESUME_AFTER_MS;
      draw();
    };

    // The +/- buttons ease to the new zoom
    let zoomAnim = 0;
    zoomByRef.current = (factor) => {
      cancelAnimationFrame(zoomAnim);
      const from = zoom;
      const to = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / 250);
        setZoom(from + (to - from) * (1 - (1 - t) ** 3));
        if (t < 1) zoomAnim = requestAnimationFrame(step);
      };
      zoomAnim = requestAnimationFrame(step);
    };

    // Trackpad pinch (sent as ctrl + wheel) or cmd/ctrl + scroll zooms; a plain
    // scroll is left alone so the page still scrolls past the globe
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(zoom * Math.exp(-e.deltaY * 0.01));
    };

    // Drag to turn the globe (vertical swipes still scroll the page);
    // two fingers pinch to zoom
    let dragging = false;
    let from: [number, number] = [0, 0];
    const touches = new Map<number, [number, number]>();
    let pinch: { distance: number; zoom: number } | null = null;
    const spread = () => {
      const [a, b] = Array.from(touches.values());
      return Math.hypot(a[0] - b[0], a[1] - b[1]);
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest(".place-marker, button")) return;
      touches.set(e.pointerId, [e.clientX, e.clientY]);
      wrap.setPointerCapture(e.pointerId);
      if (touches.size === 2) {
        dragging = false;
        pinch = { distance: spread(), zoom };
        return;
      }
      dragging = true;
      from = [e.clientX, e.clientY];
    };
    const onMove = (e: PointerEvent) => {
      if (touches.has(e.pointerId))
        touches.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && touches.size === 2) {
        setZoom(pinch.zoom * (spread() / pinch.distance));
        return;
      }
      if (!dragging) return;
      const [l, p] = projection.rotate();
      const k = 75 / projection.scale();
      projection.rotate([
        l + (e.clientX - from[0]) * k,
        Math.max(-60, Math.min(60, p - (e.clientY - from[1]) * k)),
      ]);
      from = [e.clientX, e.clientY];
      draw();
    };
    const onUp = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      if (touches.size < 2) pinch = null;
      dragging = false;
      resumeAt = performance.now() + RESUME_AFTER_MS;
    };
    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    wrap.addEventListener("wheel", onWheel, { passive: false });

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    io.observe(wrap);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    setReady(true);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
      wrap.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(zoomAnim);
    };
  }, [places]);

  // Redraw in the new colours when the theme changes, and once the pins mount
  useEffect(() => drawRef.current(), [colors, ready]);

  return (
    <>
      <div
        ref={wrapRef}
        className="group relative w-full cursor-grab touch-pan-y select-none overflow-hidden rounded-2xl border border-neutral-200 active:cursor-grabbing dark:border-neutral-800"
        style={{ aspectRatio: "1 / 1", maxHeight: MAX_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          aria-hidden="true"
        />
        {ready &&
          places.map((place, i) => (
            <button
              key={place.location}
              ref={(el) => {
                pinRefs.current[i] = el;
              }}
              type="button"
              className="place-marker absolute left-0 top-0"
              aria-label={`Photos from ${place.location}`}
              style={{ backgroundImage: `url(${optimized(place.image, 96)})` }}
              onPointerEnter={(e) => {
                const box = e.currentTarget.getBoundingClientRect();
                const wrapBox = wrapRef.current!.getBoundingClientRect();
                const top = box.top - wrapBox.top;
                const below = top < POPUP_HEIGHT + 16;
                setPopup({
                  x: box.left + box.width / 2 - wrapBox.left,
                  y: below ? box.bottom - wrapBox.top + 10 : top - 10,
                  below,
                });
                setHovered(i);
              }}
              onPointerLeave={() => setHovered(null)}
              onClick={() => setActivePlace(place)}
            >
              {place.count > 1 && (
                <span className="place-marker__badge">{place.count}</span>
              )}
            </button>
          ))}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col overflow-hidden rounded-lg opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 border border-neutral-200 bg-background-light/80 backdrop-blur dark:border-neutral-800 dark:bg-background-dark/80">
          {[
            { label: "Zoom in", factor: 1.6, Icon: Plus },
            { label: "Zoom out", factor: 1 / 1.6, Icon: Minus },
          ].map(({ label, factor, Icon }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={() => zoomByRef.current(factor)}
              className="flex h-8 w-8 items-center justify-center text-text-light-body transition-colors first:border-b first:border-neutral-200 hover:text-text-light-header dark:text-text-dark-headerDark dark:first:border-neutral-800 dark:hover:text-white"
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ))}
        </div>
        {hovered !== null && popup && (
          <div
            className="pointer-events-none absolute z-10"
            style={{
              left: popup.x,
              top: popup.y,
              transform: popup.below
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
          >
            <div className="place-popup__inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimized(places[hovered].image, 384)}
                alt={places[hovered].location}
              />
              <div className="place-popup__meta">
                <span className="place-popup__loc">
                  {places[hovered].location}
                </span>
                <span className="place-popup__count">
                  {places[hovered].count} photo
                  {places[hovered].count > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <PhotoLightbox
        photos={
          activePlace
            ? activePlace.photos.map((p) => ({
                ...p,
                location: activePlace.location,
              }))
            : null
        }
        onClose={() => setActivePlace(null)}
      />
    </>
  );
}
