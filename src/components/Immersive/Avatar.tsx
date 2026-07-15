"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group } from "three";

export function Avatar({
  color,
  accent,
  speedRef,
}: {
  color: string;
  accent: string;
  speedRef: React.MutableRefObject<number>;
}) {
  const body = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftKnee = useRef<Group>(null);
  const rightKnee = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftElbow = useRef<Group>(null);
  const rightElbow = useRef<Group>(null);
  const phase = useRef(0);

  useFrame((_, delta) => {
    const speed = speedRef.current;
    const movement = MathUtils.clamp(speed / 4.2, 0, 1);
    const sprint = MathUtils.clamp((speed - 4.2) / 3.2, 0, 1);
    phase.current += delta * (7.2 + sprint * 2.2) * movement;

    const cycle = Math.sin(phase.current);
    const stride = cycle * (0.48 + sprint * 0.16) * movement;
    const leftKneeBend =
      Math.max(0, -cycle) * (0.42 + sprint * 0.18) * movement;
    const rightKneeBend =
      Math.max(0, cycle) * (0.42 + sprint * 0.18) * movement;
    const armSwing = stride * 0.72;

    dampRotation(leftLeg.current, "x", stride, delta);
    dampRotation(rightLeg.current, "x", -stride, delta);
    dampRotation(leftKnee.current, "x", leftKneeBend, delta);
    dampRotation(rightKnee.current, "x", rightKneeBend, delta);
    dampRotation(leftArm.current, "x", -armSwing, delta);
    dampRotation(rightArm.current, "x", armSwing, delta);
    dampRotation(
      leftElbow.current,
      "x",
      -0.12 - Math.max(0, cycle) * 0.18 * movement,
      delta,
    );
    dampRotation(
      rightElbow.current,
      "x",
      -0.12 - Math.max(0, -cycle) * 0.18 * movement,
      delta,
    );
    dampRotation(body.current, "x", sprint * 0.1, delta, 7);
    dampRotation(body.current, "z", -cycle * movement * 0.018, delta, 8);
  });

  return (
    <group ref={body}>
      {/* Shoes and articulated legs */}
      <group ref={leftLeg} position={[-0.13, 0.83, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.32, 6, 12]} />
          <meshStandardMaterial color={color} roughness={0.62} />
        </mesh>
        <group ref={leftKnee} position={[0, -0.48, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.085, 0.3, 6, 12]} />
            <meshStandardMaterial color={color} roughness={0.62} />
          </mesh>
          <mesh position={[0, -0.48, 0.055]} castShadow>
            <boxGeometry args={[0.19, 0.12, 0.32]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      </group>
      <group ref={rightLeg} position={[0.13, 0.83, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.32, 6, 12]} />
          <meshStandardMaterial color={color} roughness={0.62} />
        </mesh>
        <group ref={rightKnee} position={[0, -0.48, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.085, 0.3, 6, 12]} />
            <meshStandardMaterial color={color} roughness={0.62} />
          </mesh>
          <mesh position={[0, -0.48, 0.055]} castShadow>
            <boxGeometry args={[0.19, 0.12, 0.32]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      </group>

      {/* Tapered jacket and waist */}
      <mesh position={[0, 1.24, 0]} castShadow>
        <cylinderGeometry args={[0.29, 0.23, 0.68, 20]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.48}
          metalness={0.06}
        />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.12, 6, 14]} />
        <meshStandardMaterial color={color} roughness={0.58} />
      </mesh>
      <mesh position={[0, 1.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.09, 0.48, 6, 12]} />
        <meshStandardMaterial color={accent} roughness={0.48} />
      </mesh>

      {/* Articulated arms and hands */}
      <group ref={leftArm} position={[-0.34, 1.43, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.28, 6, 12]} />
          <meshStandardMaterial color={accent} roughness={0.52} />
        </mesh>
        <group ref={leftElbow} position={[0, -0.43, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.068, 0.25, 6, 12]} />
            <meshStandardMaterial color={color} roughness={0.62} />
          </mesh>
          <mesh position={[0, -0.39, 0]} castShadow>
            <sphereGeometry args={[0.085, 14, 14]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>
        </group>
      </group>
      <group ref={rightArm} position={[0.34, 1.43, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.28, 6, 12]} />
          <meshStandardMaterial color={accent} roughness={0.52} />
        </mesh>
        <group ref={rightElbow} position={[0, -0.43, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.068, 0.25, 6, 12]} />
            <meshStandardMaterial color={color} roughness={0.62} />
          </mesh>
          <mesh position={[0, -0.39, 0]} castShadow>
            <sphereGeometry args={[0.085, 14, 14]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>
        </group>
      </group>

      {/* Neck and faceless head */}
      <mesh position={[0, 1.66, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.085, 0.14, 14]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.88, 0]} scale={[0.95, 1.08, 0.92]} castShadow>
        <sphereGeometry args={[0.205, 24, 24]} />
        <meshStandardMaterial color={color} roughness={0.58} />
      </mesh>

      {/* Small jacket detail establishes a clear front. */}
      <mesh position={[0, 1.27, 0.285]}>
        <boxGeometry args={[0.055, 0.26, 0.018]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

function dampRotation(
  group: Group | null,
  axis: "x" | "z",
  target: number,
  delta: number,
  smoothing = 11,
) {
  if (!group) return;
  group.rotation[axis] = MathUtils.damp(
    group.rotation[axis],
    target,
    smoothing,
    delta,
  );
}
