"use client";

import { Suspense, useMemo } from "react";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Fog } from "three";

import { Exhibit } from "./Exhibit";
import { ExperienceRoom } from "./ExperienceRoom";
import { Globe } from "./Globe";
import { Player, type TravelRequest } from "./Player";
import { Roads } from "./Roads";
import type { KeyState, OrbitState } from "./useControls";
import {
  DISTRICTS,
  GLOBE_POS,
  LOOP_X,
  LOOP_Z,
  type District,
  type Exhibit as ExhibitType,
} from "./world.config";
import type { WorldPalette } from "./worldTheme";

export function Scene({
  palette,
  exhibits,
  keys,
  orbit,
  activeId,
  travelRequest,
  onNearChange,
}: {
  palette: WorldPalette;
  exhibits: ExhibitType[];
  keys: React.MutableRefObject<KeyState>;
  orbit: React.MutableRefObject<OrbitState>;
  activeId: string | null;
  travelRequest: TravelRequest | null;
  onNearChange: (id: string | null) => void;
}) {
  const fog = useMemo(
    () => new Fog(palette.background, palette.fog[0], palette.fog[1]),
    [palette],
  );

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <primitive attach="fog" object={fog} />

      <ambientLight intensity={palette.ambient} />
      <hemisphereLight
        intensity={palette.ambient * 0.85}
        color="#ffffff"
        groundColor={palette.floor}
      />
      <directionalLight
        position={[-40, 70, 50]}
        intensity={palette.key}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-far={220}
      />

      <CityGround palette={palette} />
      <Roads palette={palette} />

      {/* Giant holographic globe centerpiece in Atlas Park (center island) */}
      <group position={GLOBE_POS} scale={3.2}>
        <Globe palette={palette} active={activeId === "globe"} />
      </group>

      <Suspense fallback={null}>
        {exhibits.map((exhibit) =>
          exhibit.kind === "experience" ? (
            <ExperienceRoom
              key={exhibit.id}
              exhibit={exhibit}
              palette={palette}
              active={exhibit.id === activeId}
            />
          ) : (
            <Exhibit
              key={exhibit.id}
              exhibit={exhibit}
              palette={palette}
              active={exhibit.id === activeId}
            />
          ),
        )}
      </Suspense>

      <Player
        keys={keys}
        orbit={orbit}
        exhibits={exhibits}
        avatarColor={palette.avatar}
        accentColor={palette.accent}
        travelRequest={travelRequest}
        onNearChange={onNearChange}
      />

      <EffectComposer>
        <Bloom
          intensity={palette.bloom}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.35} darkness={0.42} />
      </EffectComposer>
    </>
  );
}

/**
 * The city ground: a large base plane, plus a tinted pad under each district
 * (data-driven from DISTRICTS) and a green park pad under the central globe.
 */
function CityGround({ palette }: { palette: WorldPalette }) {
  return (
    <group>
      {/* Base ground plane — large enough to reach the fog everywhere */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial color={palette.floor} roughness={0.97} metalness={0.01} />
      </mesh>

      {/* Central island inside the loop (Atlas Park) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[LOOP_X * 2 - 8, LOOP_Z * 2 - 8]} />
        <meshStandardMaterial color={palette.surface} roughness={0.85} metalness={0.02} />
      </mesh>

      {DISTRICTS.map((d) => (
        <DistrictPad key={d.id} district={d} palette={palette} />
      ))}
    </group>
  );
}

function DistrictPad({
  district,
  palette,
}: {
  district: District;
  palette: WorldPalette;
}) {
  const [px, pz] = district.pad;
  const [sx, sz] = district.padSize;
  return (
    <group position={[px, 0, pz]}>
      {/* Pad slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[sx, sz]} />
        <meshStandardMaterial color={palette.surface} roughness={0.8} metalness={0.03} />
      </mesh>
      {/* Glowing perimeter accent along the pad edge nearest the loop */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[sx, 0.05, 0.16]} />
        <meshBasicMaterial color={district.color} toneMapped={false} />
      </mesh>
    </group>
  );
}

