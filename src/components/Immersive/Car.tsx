"use client";

import { forwardRef, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import type { Group } from "three";

/**
 * A stylized low-poly car. No rigging — the controller writes live values into
 * `speedRef` (forward speed, for wheel spin) and `steerRef` (front-wheel angle)
 * and this component animates the wheels each frame. Body/accent colors come
 * from the world palette so it stays theme-aware.
 */
export function Car({
  bodyColor,
  accent,
  speedRef,
  steerRef,
}: {
  bodyColor: string;
  accent: string;
  speedRef: React.MutableRefObject<number>;
  steerRef: React.MutableRefObject<number>;
}) {
  const flWheel = useRef<Group>(null); // front-left  (steers)
  const frWheel = useRef<Group>(null); // front-right (steers)
  const rlWheel = useRef<Group>(null); // rear-left
  const rrWheel = useRef<Group>(null); // rear-right
  const spin = useRef(0);

  useFrame((_, delta) => {
    // Wheel roll: angular velocity ∝ linear speed (wheel radius ≈ 0.34).
    spin.current += (speedRef.current / 0.34) * delta;
    const steer = steerRef.current;

    [rlWheel, rrWheel].forEach((w) => {
      if (w.current) w.current.rotation.x = spin.current;
    });
    // Front wheels: steer (Y) is set on the parent group, roll (X) on child.
    [flWheel, frWheel].forEach((w) => {
      if (w.current) {
        w.current.rotation.y = MathUtils.lerp(
          w.current.rotation.y,
          steer,
          0.3,
        );
        const roll = w.current.children[0] as
          | { rotation: { x: number } }
          | undefined;
        if (roll) roll.rotation.x = spin.current;
      }
    });
  });

  const bodyMat = (
    <meshStandardMaterial color={bodyColor} roughness={0.35} metalness={0.5} />
  );

  return (
    <group>
      {/* Lower chassis */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.35, 0.4, 2.55]} />
        {bodyMat}
      </mesh>
      {/* Rounded lower edge (slightly wider, darker) */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.42, 0.22, 2.5]} />
        <meshStandardMaterial color="#1b1b20" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.82, -0.12]} castShadow>
        <boxGeometry args={[1.15, 0.5, 1.35]} />
        {bodyMat}
      </mesh>
      {/* Windshield / glass wrap */}
      <mesh position={[0, 0.83, -0.12]}>
        <boxGeometry args={[1.02, 0.36, 1.24]} />
        <meshStandardMaterial
          color="#0b0b0f"
          roughness={0.1}
          metalness={0.6}
          emissive={accent}
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* Headlights (front = -Z) */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={`h${x}`} position={[x, 0.5, -1.28]}>
          <boxGeometry args={[0.22, 0.12, 0.06]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
      {/* Forward headlight beams */}
      <spotLight
        position={[0, 0.55, -1.3]}
        target-position={[0, 0, -6]}
        angle={0.5}
        penumbra={0.7}
        intensity={6}
        distance={12}
        color="#fffcf0"
      />
      {/* Tail lights (rear = +Z) */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={`t${x}`} position={[x, 0.5, 1.28]}>
          <boxGeometry args={[0.2, 0.1, 0.05]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
      ))}

      {/* Under-glow accent strip */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[1.2, 0.02, 2.3]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>

      {/* Wheels — front pair steers, all roll */}
      <SteerWheel ref={flWheel} position={[-0.75, 0.34, -0.85]} />
      <SteerWheel ref={frWheel} position={[0.75, 0.34, -0.85]} />
      <RollWheel ref={rlWheel} position={[-0.75, 0.34, 0.9]} />
      <RollWheel ref={rrWheel} position={[0.75, 0.34, 0.9]} />
    </group>
  );
}

// The tire + hub, with the cylinder axle rotated to run left-right (X). Rolling
// is then a rotation about X applied by the parent group.
function WheelBody() {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.26, 20]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.8} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.16, 0.16, 0.28, 12]} />
        <meshStandardMaterial color="#3a3a42" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Front wheel: outer group yaws for steering, inner group rolls.
const SteerWheel = forwardRef<Group, { position: [number, number, number] }>(
  function SteerWheel({ position }, ref) {
    return (
      <group ref={ref} position={position}>
        <group>
          <WheelBody />
        </group>
      </group>
    );
  },
);

// Rear wheel: rolls only (parent group's rotation.x).
const RollWheel = forwardRef<Group, { position: [number, number, number] }>(
  function RollWheel({ position }, ref) {
    return (
      <group ref={ref} position={position}>
        <WheelBody />
      </group>
    );
  },
);
