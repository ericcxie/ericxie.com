"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, MathUtils, Vector3 } from "three";

import { Car } from "./Car";
import type { KeyState, OrbitState } from "./useControls";
import {
  WORLD_BOUNDS,
  type Exhibit,
  type WorldDestination,
} from "./world.config";

const NEAR_RADIUS = 3.4;

// --- Vehicle tuning (scaled up for the larger city) ---
const MAX_SPEED = 26; // forward top speed (units/s)
const MAX_REVERSE = 9;
const ACCEL = 22; // throttle acceleration
const BRAKE = 40; // active braking
const ENGINE_DRAG = 4.5; // coast deceleration
const MAX_STEER = 0.6; // rad of front-wheel angle at low speed
const TURN_RATE = 2.6; // how fast heading changes with steering + speed

export type TravelRequest = {
  token: number;
  destination: WorldDestination;
};

/**
 * Drive a car (Bruno-Simon style): W accelerates, S brakes/reverses, A/D steer.
 * Steering authority scales down with speed so it feels planted. The camera
 * chases behind the car's heading; drag temporarily orbits. Reports the nearest
 * interactable exhibit for the "Press E" prompt.
 */
export function Player({
  keys,
  orbit,
  exhibits,
  avatarColor,
  accentColor,
  travelRequest,
  onNearChange,
}: {
  keys: React.MutableRefObject<KeyState>;
  orbit: React.MutableRefObject<OrbitState>;
  exhibits: Exhibit[];
  avatarColor: string;
  accentColor: string;
  travelRequest: TravelRequest | null;
  onNearChange: (id: string | null) => void;
}) {
  const rig = useRef<Group>(null);
  const heading = useRef(Math.PI); // car yaw, starts facing into the scene (-Z)
  const velocity = useRef(0); // signed forward speed
  const speedRef = useRef(0); // magnitude, for wheel spin
  const steerRef = useRef(0); // current front-wheel angle
  const nearRef = useRef<string | null>(null);
  const lastTravelToken = useRef<number | null>(null);
  const { camera } = useThree();

  const colliders = useMemo(
    () =>
      exhibits.map((exhibit) => ({
        x: exhibit.position[0],
        z: exhibit.position[2],
        r:
          exhibit.kind === "experience"
            ? 3.0 // building footprint
            : exhibit.kind === "globe"
              ? 6 // giant globe footprint (scaled 3.2x centerpiece)
              : exhibit.kind === "photos" || exhibit.kind === "about"
                ? 2.0
                : exhibit.kind === "directory"
                  ? 1.6
                  : 1.4,
      })),
    [exhibits],
  );

  const tmp = useMemo(() => new Vector3(), []);
  const desiredCam = useMemo(() => new Vector3(), []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const g = rig.current;
    if (!g) return;

    const o = orbit.current;
    const k = keys.current;

    // --- Waypoint fast-travel: snap to a destination and settle the camera ---
    if (travelRequest && travelRequest.token !== lastTravelToken.current) {
      const { position, yaw } = travelRequest.destination;
      g.position.set(position[0], position[1], position[2]);
      g.rotation.y = yaw;
      heading.current = yaw;
      velocity.current = 0;
      speedRef.current = 0;
      steerRef.current = 0;
      nearRef.current = null;
      onNearChange(null);

      // Camera sits BEHIND the car: offset (sin,cos)(azimuth) must oppose the
      // car's forward (-sin,-cos)(heading), so azimuth = heading.
      const camAzimuth = yaw;
      o.azimuth = camAzimuth;
      o.polar = 1.12;
      o.walkImpulse = 0;
      const radius = o.distance;
      camera.position.set(
        position[0] + Math.sin(camAzimuth) * Math.sin(o.polar) * radius,
        position[1] + Math.cos(o.polar) * radius,
        position[2] + Math.cos(camAzimuth) * Math.sin(o.polar) * radius,
      );
      camera.lookAt(position[0], position[1] + 1, position[2]);
      lastTravelToken.current = travelRequest.token;
      return;
    }

    // --- Throttle / brake ---
    const throttle = (k.forward ? 1 : 0) - (k.back ? 1 : 0);
    if (throttle > 0) {
      velocity.current += ACCEL * delta;
    } else if (throttle < 0) {
      // brake if moving forward, else accelerate in reverse
      if (velocity.current > 0.1) velocity.current -= BRAKE * delta;
      else velocity.current -= ACCEL * delta;
    } else {
      // coast: engine drag pulls speed toward zero
      const drag = ENGINE_DRAG * delta;
      if (velocity.current > drag) velocity.current -= drag;
      else if (velocity.current < -drag) velocity.current += drag;
      else velocity.current = 0;
    }
    velocity.current = MathUtils.clamp(velocity.current, -MAX_REVERSE, MAX_SPEED);
    speedRef.current = Math.abs(velocity.current);

    // --- Steering (scales down as speed rises so it doesn't twitch) ---
    const steerInput = (k.left ? 1 : 0) - (k.right ? 1 : 0);
    const speedFactor = 1 - Math.min(speedRef.current / MAX_SPEED, 1) * 0.55;
    const targetSteer = steerInput * MAX_STEER * speedFactor;
    steerRef.current = MathUtils.lerp(steerRef.current, targetSteer, 0.2);

    // Heading changes proportionally to steer * forward speed (direction of
    // travel), so reversing turns the correct way.
    if (speedRef.current > 0.05) {
      const dir = Math.sign(velocity.current);
      heading.current +=
        steerRef.current *
        TURN_RATE *
        dir *
        Math.min(speedRef.current / 3, 1) *
        delta;
    }

    // --- Integrate position along heading ---
    const fwdX = -Math.sin(heading.current);
    const fwdZ = -Math.cos(heading.current);
    let nextX = g.position.x + fwdX * velocity.current * delta;
    let nextZ = g.position.z + fwdZ * velocity.current * delta;

    // Resolve circular collisions; bleed off speed on impact.
    for (const c of colliders) {
      const dx = nextX - c.x;
      const dz = nextZ - c.z;
      const d = Math.hypot(dx, dz);
      if (d < c.r && d > 0.0001) {
        nextX = c.x + (dx / d) * c.r;
        nextZ = c.z + (dz / d) * c.r;
        velocity.current *= 0.4;
      }
    }
    g.position.x = MathUtils.clamp(nextX, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    g.position.z = MathUtils.clamp(nextZ, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
    g.rotation.y = heading.current;

    // --- Chase camera: sit behind the heading unless the user is dragging ---
    if (!o.dragging && speedRef.current > 0.4) {
      const desired = heading.current;
      o.azimuth = smoothAngle(o.azimuth, desired, 0.06);
    }
    const r = o.distance;
    desiredCam.set(
      g.position.x + Math.sin(o.azimuth) * Math.sin(o.polar) * r,
      g.position.y + Math.cos(o.polar) * r,
      g.position.z + Math.cos(o.azimuth) * Math.sin(o.polar) * r,
    );
    camera.position.lerp(desiredCam, 1 - Math.exp(-9 * delta));
    tmp.set(g.position.x, g.position.y + 1, g.position.z);
    camera.lookAt(tmp);

    // --- Nearest interactable exhibit (trigger scales with its footprint) ---
    let best: string | null = null;
    let bestMargin = Infinity;
    for (let i = 0; i < exhibits.length; i++) {
      const e = exhibits[i];
      const d = Math.hypot(
        g.position.x - e.position[0],
        g.position.z - e.position[2],
      );
      const trigger = colliders[i].r + NEAR_RADIUS;
      const margin = d - trigger; // <0 means within range
      if (margin < 0 && margin < bestMargin) {
        bestMargin = margin;
        best = e.id;
      }
    }
    if (best !== nearRef.current) {
      nearRef.current = best;
      onNearChange(best);
    }
  });

  return (
    <group ref={rig} position={[0, 0, 4]} rotation={[0, Math.PI, 0]}>
      <Car
        bodyColor={avatarColor}
        accent={accentColor}
        speedRef={speedRef}
        steerRef={steerRef}
      />
    </group>
  );
}

/** Lerp between two angles along the shortest arc, keeping the result wrapped. */
function smoothAngle(current: number, target: number, t: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}
