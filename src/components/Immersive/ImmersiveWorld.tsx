"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { ContentPanel, InteractPrompt } from "./ContentPanel";
import { Directory } from "./Directory";
import { HUD } from "./HUD";
import type { TravelRequest } from "./Player";
import { Scene } from "./Scene";
import { useKeyboard, useOrbit } from "./useControls";
import {
  buildExhibits,
  WORLD_DESTINATIONS,
  type WorldDestination,
} from "./world.config";
import { getWorldPalette } from "./worldTheme";
import type { PostItem } from "@/types";

/**
 * Root of the immersive world. Dynamically imported (ssr:false) so three.js
 * never touches the normal bundle. Owns interaction state and bridges DOM
 * overlays (HUD, panels) with the r3f canvas.
 */
export default function ImmersiveWorld({
  posts,
  onExit,
}: {
  posts?: PostItem[];
  onExit: () => void;
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const palette = useMemo(() => getWorldPalette(resolvedTheme), [resolvedTheme]);

  const containerRef = useRef<HTMLDivElement>(null);
  const keys = useKeyboard();
  const orbit = useOrbit(useCallback(() => containerRef.current, []));

  const exhibits = useMemo(() => buildExhibits(posts ?? []), [posts]);

  const [nearId, setNearId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [travelRequest, setTravelRequest] = useState<TravelRequest | null>({
    destination: WORLD_DESTINATIONS[0],
    token: 0,
  });
  const [traveling, setTraveling] = useState(false);

  const nearIdRef = useRef<string | null>(null);
  const openIdRef = useRef<string | null>(null);
  const directoryOpenRef = useRef(false);
  const travelTimersRef = useRef<number[]>([]);
  nearIdRef.current = nearId;
  openIdRef.current = openId;
  directoryOpenRef.current = directoryOpen;

  const openExhibit = useCallback(
    (id: string) => {
      const ex = exhibits.find((e) => e.id === id);
      if (!ex) return;
      if (ex.kind === "directory") {
        setDirectoryOpen(true);
        return;
      }
      // navigate-only exhibits warp straight out; others open a panel.
      if (ex.interaction === "navigate" && ex.href) {
        navigateTo(ex.href);
        return;
      }
      setOpenId(id);
    },
    // navigateTo is stable for the lifetime of the mounted world.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exhibits],
  );

  const navigateTo = useCallback(
    (href: string) => {
      if (/^https?:\/\//.test(href)) {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }
      onExit();
      router.push(href);
    },
    [onExit, router],
  );

  // E to open the nearest exhibit; Esc to close panel or exit the world.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (openIdRef.current) setOpenId(null);
        else if (directoryOpenRef.current) setDirectoryOpen(false);
        else onExit();
        return;
      }
      if (e.code === "KeyE" && !openIdRef.current && nearIdRef.current) {
        e.preventDefault();
        openExhibit(nearIdRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit, openExhibit]);

  useEffect(
    () => () => {
      travelTimersRef.current.forEach(window.clearTimeout);
    },
    [],
  );

  const travelTo = useCallback((destination: WorldDestination) => {
    travelTimersRef.current.forEach(window.clearTimeout);
    setDirectoryOpen(false);
    setOpenId(null);
    setTraveling(true);

    const moveTimer = window.setTimeout(() => {
      setTravelRequest({ destination, token: Date.now() });
    }, 180);
    const revealTimer = window.setTimeout(() => setTraveling(false), 520);
    travelTimersRef.current = [moveTimer, revealTimer];
  }, []);

  const openExhibitData = openId
    ? exhibits.find((e) => e.id === openId) ?? null
    : null;
  const nearExhibitData =
    !openId && nearId
      ? exhibits.find((exhibit) => exhibit.id === nearId) ?? null
      : null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none select-none"
      style={{ cursor: "grab" }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 3.4, 11], fov: 58, near: 0.1, far: 400 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Scene
          palette={palette}
          exhibits={exhibits}
          keys={keys}
          orbit={orbit}
          activeId={nearId}
          travelRequest={travelRequest}
          onNearChange={setNearId}
        />
      </Canvas>

      <InteractPrompt exhibit={nearExhibitData} />
      <ContentPanel
        exhibit={openExhibitData}
        onClose={() => setOpenId(null)}
        onNavigate={navigateTo}
      />
      <Directory
        open={directoryOpen}
        onClose={() => setDirectoryOpen(false)}
        onTravel={travelTo}
      />
      <HUD
        onOpenDirectory={() => setDirectoryOpen(true)}
        onExit={onExit}
      />

      <AnimatePresence>
        {traveling && (
          <motion.div
            key="travel"
            className="pointer-events-none absolute inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.52, times: [0, 0.35, 0.65, 1] }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
