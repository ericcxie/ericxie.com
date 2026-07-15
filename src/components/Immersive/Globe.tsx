"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  Group,
  Quaternion,
  Vector3,
} from "three";

import { locationCoordinates } from "@/content/photos/locations";
import type { WorldPalette } from "./worldTheme";

const FONT_REGULAR = "/fonts/AkkuratPro.ttf";

/**
 * A holographic rotating globe: a glowing wireframe earth with an inner glow
 * shell, floating over a pedestal, with emissive pins + light beams at every
 * place Eric has photographed (from locationCoordinates). Pure cool-factor
 * centerpiece for the Photos district.
 */
export function Globe({
  palette,
  active,
  radius = 1.8,
}: {
  palette: WorldPalette;
  active: boolean;
  radius?: number;
}) {
  const spin = useRef<Group>(null);
  const float = useRef<Group>(null);

  // Convert lng/lat → unit sphere positions (once).
  const pins = useMemo(() => {
    return Object.entries(locationCoordinates).map(([name, [lng, lat]]) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const v = new Vector3(
        -Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      );
      return { name, dir: v };
    });
  }, []);

  useFrame((state, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.18;
    if (float.current) {
      float.current.position.y =
        3.2 + Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
    }
  });

  const pinColor = palette.accent;

  return (
    <group>
      {/* Pedestal */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.15, 0.7, 48]} />
        <meshStandardMaterial
          color={palette.surface}
          roughness={0.35}
          metalness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.78, 0.9, 0.08, 48]} />
        <meshBasicMaterial color={pinColor} toneMapped={false} />
      </mesh>

      {/* Upward key light + a focused spot from below for the hologram look */}
      <pointLight
        position={[0, 3.2, 0]}
        intensity={active ? 14 : 8}
        distance={9}
        color={pinColor}
      />

      <group ref={float} position={[0, 3.2, 0]}>
        <group ref={spin}>
          {/* Solid inner sphere so the wireframe reads as a surface */}
          <mesh>
            <sphereGeometry args={[radius * 0.985, 48, 48]} />
            <meshStandardMaterial
              color={palette.background}
              roughness={1}
              metalness={0}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* Glowing wireframe latitude/longitude grid */}
          <mesh>
            <sphereGeometry args={[radius, 36, 24]} />
            <meshBasicMaterial
              color={pinColor}
              wireframe
              transparent
              opacity={active ? 0.55 : 0.35}
              toneMapped={false}
            />
          </mesh>

          {/* Pins + beams at each visited place */}
          {pins.map((pin) => {
            const p = pin.dir.clone().multiplyScalar(radius);
            return (
              <group key={pin.name}>
                <mesh position={p}>
                  <sphereGeometry args={[0.05, 12, 12]} />
                  <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </mesh>
                {/* short beam pointing outward from the surface */}
                <mesh
                  position={pin.dir.clone().multiplyScalar(radius + 0.18)}
                  quaternion={beamQuaternion(pin.dir)}
                >
                  <cylinderGeometry args={[0.012, 0.012, 0.36, 6]} />
                  <meshBasicMaterial
                    color={pinColor}
                    transparent
                    opacity={0.8}
                    toneMapped={false}
                  />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* Outer atmosphere glow shell */}
        <mesh>
          <sphereGeometry args={[radius * 1.18, 32, 32]} />
          <meshBasicMaterial
            color={pinColor}
            transparent
            opacity={active ? 0.14 : 0.08}
            side={BackSide}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <Text
        font={FONT_REGULAR}
        position={[0, 0.95, 1.2]}
        fontSize={0.14}
        color={active ? palette.accent : palette.mutedText}
        anchorX="center"
      >
        {active ? "PRESS E FOR THE JOURNAL" : `${pins.length} PLACES`}
      </Text>
    </group>
  );
}

// Orient a +Y cylinder to point along an arbitrary direction.
const UP = new Vector3(0, 1, 0);
function beamQuaternion(dir: Vector3): Quaternion {
  return new Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
}
