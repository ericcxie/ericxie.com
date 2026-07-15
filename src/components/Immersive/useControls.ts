"use client";

import { useEffect, useRef } from "react";

export type KeyState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  interact: boolean;
};

/**
 * Keyboard state for WASD movement + E to interact. Returns a mutable ref read
 * inside the r3f frame loop (no re-renders on key changes).
 */
export function useKeyboard() {
  const keys = useRef<KeyState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    sprint: false,
    interact: false,
  });

  useEffect(() => {
    const map = (code: string, down: boolean) => {
      switch (code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = down;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.back = down;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = down;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = down;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = down;
          break;
        case "KeyE":
          keys.current.interact = down;
          break;
      }
    };
    const onDown = (e: KeyboardEvent) => map(e.code, true);
    const onUp = (e: KeyboardEvent) => map(e.code, false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return keys;
}

export type OrbitState = {
  /** horizontal angle around the avatar (radians) */
  azimuth: number;
  /** vertical angle (radians), clamped */
  polar: number;
  /** camera distance from avatar */
  distance: number;
  /** wheel/touchpad impulse used to move in the camera's forward direction */
  walkImpulse: number;
  /** true while the user is actively dragging (suppresses auto snap-behind) */
  dragging: boolean;
};

/**
 * Mouse-drag orbit + scroll zoom. Attaches to the given element. Returns a
 * mutable ref consumed by the camera rig.
 */
export function useOrbit(getTarget: () => HTMLElement | null) {
  const orbit = useRef<OrbitState>({
    azimuth: 0,
    polar: 1.12,
    distance: 9,
    walkImpulse: 0,
    dragging: false,
  });

  useEffect(() => {
    const el = getTarget();
    if (!el) return;

    let lastX = 0;
    let lastY = 0;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest("button, a, iframe, aside, [data-immersive-ui]")
      ) {
        return;
      }
      orbit.current.dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!orbit.current.dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      orbit.current.azimuth -= dx * 0.005;
      orbit.current.polar = Math.min(
        1.45,
        Math.max(0.25, orbit.current.polar - dy * 0.005),
      );
    };
    const endDrag = (e: PointerEvent) => {
      if (!orbit.current.dragging) return;
      orbit.current.dragging = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer may already be released */
      }
      // Allow snap-behind to resume shortly after the drag ends.
      if (idleTimer) clearTimeout(idleTimer);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbit.current.walkImpulse = Math.max(
        -1.2,
        Math.min(1.2, orbit.current.walkImpulse + e.deltaY * 0.004),
      );
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("wheel", onWheel);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [getTarget]);

  return orbit;
}
