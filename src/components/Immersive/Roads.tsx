"use client";

import { Text } from "@react-three/drei";

import { DISTRICTS, LOOP_X, LOOP_Z, ROAD_WIDTH } from "./world.config";
import type { WorldPalette } from "./worldTheme";

const FONT_BOLD = "/fonts/AkkuratPro-Bold.otf";

/**
 * The city road network: one big rectangular LOOP you cruise, short connector
 * roads out to each district, and "WELCOME" gantry signs you drive under where
 * a district meets the loop.
 */
export function Roads({ palette }: { palette: WorldPalette }) {
  return (
    <group>
      {/* --- The loop: four straight edges of the rectangle --- */}
      {/* South & North edges run along X */}
      <RoadStrip from={[-LOOP_X, LOOP_Z]} to={[LOOP_X, LOOP_Z]} palette={palette} />
      <RoadStrip from={[-LOOP_X, -LOOP_Z]} to={[LOOP_X, -LOOP_Z]} palette={palette} />
      {/* West & East edges run along Z */}
      <RoadStrip from={[-LOOP_X, -LOOP_Z]} to={[-LOOP_X, LOOP_Z]} palette={palette} />
      <RoadStrip from={[LOOP_X, -LOOP_Z]} to={[LOOP_X, LOOP_Z]} palette={palette} />

      {/* Rounded corner pads so turns don't look severed */}
      {(
        [
          [-LOOP_X, -LOOP_Z],
          [LOOP_X, -LOOP_Z],
          [-LOOP_X, LOOP_Z],
          [LOOP_X, LOOP_Z],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.02, z]}
          receiveShadow
        >
          <circleGeometry args={[ROAD_WIDTH / 2, 24]} />
          <meshStandardMaterial color={palette.road} roughness={0.95} />
        </mesh>
      ))}

      {/* --- Connector spurs from the loop out to each district --- */}
      <RoadStrip from={[0, LOOP_Z]} to={[0, LOOP_Z + 9]} palette={palette} width={5} />
      <RoadStrip from={[-30, -LOOP_Z]} to={[-30, -LOOP_Z - 7]} palette={palette} width={5} />
      <RoadStrip from={[0, -LOOP_Z]} to={[0, -LOOP_Z - 7]} palette={palette} width={5} />
      <RoadStrip from={[-LOOP_X, 0]} to={[-LOOP_X - 8, 0]} palette={palette} width={5} />
      <RoadStrip from={[LOOP_X, 0]} to={[LOOP_X + 8, 0]} palette={palette} width={5} />
      {/* Spur into the central park / globe */}
      <RoadStrip from={[0, LOOP_Z]} to={[0, 6]} palette={palette} width={5} />

      {/* --- Welcome gantries at each district gate --- */}
      {DISTRICTS.filter((d) => d.id !== "photos").map((d) => (
        <WelcomeSign
          key={d.id}
          label={d.label}
          position={d.gate}
          rotationY={d.gateRotationY}
          color={d.color}
          palette={palette}
        />
      ))}
    </group>
  );
}

function RoadStrip({
  from,
  to,
  palette,
  width = ROAD_WIDTH,
}: {
  from: [number, number];
  to: [number, number];
  palette: WorldPalette;
  width?: number;
}) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  const cx = (from[0] + to[0]) / 2;
  const cz = (from[1] + to[1]) / 2;
  const dashCount = Math.max(1, Math.floor(length / 3));

  return (
    <group position={[cx, 0, cz]} rotation={[0, angle, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={palette.road} roughness={0.95} metalness={0.02} />
      </mesh>
      {[-width / 2 + 0.2, width / 2 - 0.2].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, 0]}>
          <planeGeometry args={[0.12, length]} />
          <meshBasicMaterial color={palette.roadLine} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: dashCount }).map((_, i) => {
        const z = -length / 2 + (i + 0.5) * (length / dashCount);
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, z]}>
            <planeGeometry args={[0.14, 1.1]} />
            <meshBasicMaterial color={palette.roadLine} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/** A gantry you drive under: two posts, a beam, and a glowing "WELCOME" sign. */
function WelcomeSign({
  label,
  position,
  rotationY,
  color,
  palette,
}: {
  label: string;
  position: [number, number, number];
  rotationY: number;
  color: string;
  palette: WorldPalette;
}) {
  const span = ROAD_WIDTH + 2.4;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-span / 2, span / 2].map((x) => (
        <mesh key={x} position={[x, 2.6, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 5.2, 12]} />
          <meshStandardMaterial color={palette.surface} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      {/* Cross beam */}
      <mesh position={[0, 5.1, 0]} castShadow>
        <boxGeometry args={[span + 0.6, 0.9, 0.4]} />
        <meshStandardMaterial
          color={palette.surface}
          emissive={color}
          emissiveIntensity={0.18}
          roughness={0.45}
        />
      </mesh>
      {/* Sign text on both faces so it reads coming and going */}
      {[0.22, -0.22].map((zOff, i) => (
        <group key={i} position={[0, 5.1, zOff]} rotation={[0, i === 0 ? 0 : Math.PI, 0]}>
          <Text
            font={FONT_BOLD}
            position={[0, 0.12, 0.01]}
            fontSize={0.5}
            color={palette.text}
            anchorX="center"
            anchorY="middle"
          >
            {label}
          </Text>
          <Text
            font={FONT_BOLD}
            position={[0, -0.28, 0.01]}
            fontSize={0.16}
            color={color}
            anchorX="center"
            anchorY="middle"
          >
            WELCOME
          </Text>
        </group>
      ))}
      {/* Under-beam glow */}
      <pointLight position={[0, 4.3, 0]} intensity={4} distance={span + 4} color={color} />
    </group>
  );
}
