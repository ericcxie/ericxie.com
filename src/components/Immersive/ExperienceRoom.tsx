"use client";

import { useRef } from "react";
import { Text, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { SRGBColorSpace, type Group, type Texture } from "three";

import { resolveRoomStyle } from "./rooms.config";
import type { Exhibit } from "./world.config";
import type { WorldPalette } from "./worldTheme";

const FONT_REGULAR = "/fonts/AkkuratPro.ttf";
const FONT_BOLD = "/fonts/AkkuratPro-Bold.otf";

/**
 * A themed building for one experience. Bespoke facades for Shopify / BMO /
 * Amazon; everyone else gets a branded office tower. Buildings sit along the
 * East boulevard and face the road (their front is -X in local space). The
 * exhibit's rotationY orients that front toward the street.
 */
export function ExperienceRoom({
  exhibit,
  palette,
  active,
}: {
  exhibit: Exhibit;
  palette: WorldPalette;
  active: boolean;
}) {
  const style = resolveRoomStyle(exhibit.title, exhibit.brandColor);
  const logo = useTexture(exhibit.logo!) as Texture;
  logo.colorSpace = SRGBColorSpace;

  return (
    <group position={exhibit.position} rotation={[0, exhibit.rotationY ?? 0, 0]}>
      {style.kit === "shopify" && <ShopifyShop style={style} palette={palette} />}
      {style.kit === "bmo" && <BmoBank style={style} palette={palette} />}
      {style.kit === "amazon" && <AmazonWarehouse style={style} palette={palette} />}
      {style.kit === "uwaterloo" && <UWaterlooBuilding style={style} palette={palette} />}
      {style.kit === "office" && <OfficeTower style={style} palette={palette} />}

      {/* Shared: lit sign board with the logo + company name, facing the road */}
      <group position={[-2.15, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.6, 0.95, 0.12]} />
          <meshStandardMaterial
            color={palette.surface}
            emissive={style.glow}
            emissiveIntensity={active ? 0.55 : 0.22}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[-0.86, 0, 0.08]}>
          <planeGeometry args={[0.62, 0.62]} />
          <meshBasicMaterial map={logo} transparent toneMapped={false} />
        </mesh>
        <Text
          font={FONT_BOLD}
          position={[0.2, 0.12, 0.08]}
          fontSize={0.22}
          color={palette.text}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.5}
        >
          {exhibit.title}
        </Text>
        <Text
          font={FONT_REGULAR}
          position={[0.2, -0.22, 0.08]}
          fontSize={0.1}
          color={active ? style.glow : palette.mutedText}
          anchorX="center"
          anchorY="middle"
        >
          {active ? "PRESS E TO ENTER" : (exhibit.eyebrow ?? "").toUpperCase()}
        </Text>
      </group>

      {/* Focused sign light + brand glow when near */}
      <pointLight
        position={[-2.6, 3, 0]}
        intensity={active ? 6 : 3}
        distance={7}
        color={style.glow}
      />
    </group>
  );
}

type KitProps = { style: ReturnType<typeof resolveRoomStyle>; palette: WorldPalette };

/** Shopify: warm green shop with an awning, big shopping-bag icon, a plant. */
function ShopifyShop({ style, palette }: KitProps) {
  const bag = useRef<Group>(null);
  useFrame((state) => {
    if (bag.current) {
      bag.current.rotation.y = state.clock.elapsedTime * 0.5;
      bag.current.position.y = 3.4 + Math.sin(state.clock.elapsedTime) * 0.08;
    }
  });
  return (
    <group>
      <Facade brand={style.brand} palette={palette} />
      {/* Storefront awning stripes */}
      {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
        <mesh key={x} position={[-1.55, 1.7, x]} rotation={[0, 0, -0.35]} castShadow>
          <boxGeometry args={[0.7, 0.06, 0.7]} />
          <meshStandardMaterial color={i % 2 ? "#ffffff" : style.trim} roughness={0.6} />
        </mesh>
      ))}
      {/* Floating Shopify shopping bag */}
      <group ref={bag} position={[0, 3.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.95, 0.55]} />
          <meshStandardMaterial color={style.trim} roughness={0.35} metalness={0.1} />
        </mesh>
        {/* handle */}
        <mesh position={[0, 0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.045, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      </group>
      {/* Potted plant by the door */}
      <group position={[-1.7, 0, -1.4]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 0.5, 12]} />
          <meshStandardMaterial color="#c8874f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <icosahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial color="#3f7d3a" roughness={0.9} flatShading />
        </mesh>
      </group>
    </group>
  );
}

/** BMO: marble bank — columns, pediment, a round vault door. */
function BmoBank({ style, palette }: KitProps) {
  return (
    <group>
      <Facade brand={style.brand} palette={palette} height={5} />
      {/* Columns across the front (front face = -X) */}
      {[-1.6, -0.55, 0.55, 1.6].map((z) => (
        <mesh key={z} position={[-1.7, 1.8, z]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 3.4, 16]} />
          <meshStandardMaterial color="#f2f2f4" roughness={0.5} />
        </mesh>
      ))}
      {/* Pediment / entablature */}
      <mesh position={[-1.7, 3.7, 0]} castShadow>
        <boxGeometry args={[0.9, 0.5, 4.2]} />
        <meshStandardMaterial color="#e2e3e8" roughness={0.5} />
      </mesh>
      {/* Vault door set into the facade */}
      <mesh position={[-1.55, 1.4, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.18, 40]} />
        <meshStandardMaterial color={style.trim} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-1.45, 1.4, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.14, 24]} />
        <meshStandardMaterial color="#8fb8d6" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* spokes on the vault handle */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[-1.4, 1.4, 0]}
          rotation={[(i * Math.PI) / 2, Math.PI / 2, 0]}
        >
          <boxGeometry args={[0.9, 0.06, 0.06]} />
          <meshStandardMaterial color="#cfe0ee" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/** Amazon: dark warehouse box with an orange smile arrow + roller door. */
function AmazonWarehouse({ style, palette }: KitProps) {
  return (
    <group>
      <Facade brand={style.brand} palette={palette} width={4.6} depth={5} />
      {/* Roller/loading door */}
      <mesh position={[-1.66, 1.1, 0]} castShadow>
        <boxGeometry args={[0.12, 2.1, 2.6]} />
        <meshStandardMaterial color="#3b4657" roughness={0.6} metalness={0.2} />
      </mesh>
      {[0.3, 0.75, 1.2, 1.65].map((y) => (
        <mesh key={y} position={[-1.72, y, 0]}>
          <boxGeometry args={[0.02, 0.04, 2.5]} />
          <meshStandardMaterial color="#2a3340" />
        </mesh>
      ))}
      {/* The smile arrow, on the upper facade */}
      <mesh position={[-1.7, 3.2, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.9, 0.09, 12, 32, Math.PI * 0.75]} />
        <meshStandardMaterial
          color={style.trim}
          emissive={style.trim}
          emissiveIntensity={0.5}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

/**
 * UWaterloo E7: a tall, glassy, angular engineering building — a stepped glass
 * curtain wall with a bright yellow entrance canopy and a rooftop beacon.
 */
function UWaterlooBuilding({ style, palette }: KitProps) {
  return (
    <group>
      {/* Main glass tower */}
      <mesh position={[0, 3.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 6.8, 4.2]} />
        <meshStandardMaterial
          color={style.brand}
          roughness={0.15}
          metalness={0.6}
          emissive={style.brand}
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* Stepped-back upper block for an angular profile */}
      <mesh position={[0.5, 7.6, 0]} castShadow>
        <boxGeometry args={[2.4, 2, 3.4]} />
        <meshStandardMaterial
          color={style.brand}
          roughness={0.15}
          metalness={0.6}
        />
      </mesh>
      {/* Curtain-wall mullions: glowing horizontal floor lines on the front */}
      {[1.4, 2.6, 3.8, 5.0, 6.2].map((y) => (
        <mesh key={y} position={[-1.82, y, 0]}>
          <boxGeometry args={[0.04, 0.06, 3.9]} />
          <meshBasicMaterial color={style.trim} toneMapped={false} />
        </mesh>
      ))}
      {/* Bright entrance canopy (front = -X) */}
      <mesh position={[-1.95, 1.9, 0]} castShadow>
        <boxGeometry args={[1.1, 0.16, 3.2]} />
        <meshStandardMaterial
          color={style.trim}
          emissive={style.trim}
          emissiveIntensity={0.5}
          roughness={0.4}
        />
      </mesh>
      {/* Rooftop beacon */}
      <mesh position={[0.5, 8.9, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={style.glow} toneMapped={false} />
      </mesh>
      <pointLight position={[0.5, 9.1, 0]} intensity={5} distance={8} color={style.glow} />
    </group>
  );
}

/** Generic branded office tower for the rest. */
function OfficeTower({ style, palette }: KitProps) {
  return (
    <group>
      <Facade brand={palette.surface} palette={palette} height={5.5} width={4} />
      {/* Window grid glowing in the brand color */}
      {[1.2, 2.2, 3.2, 4.2].map((y) =>
        [-1.2, -0.4, 0.4, 1.2].map((z) => (
          <mesh key={`${y}-${z}`} position={[-1.66, y, z]}>
            <boxGeometry args={[0.04, 0.55, 0.55]} />
            <meshStandardMaterial
              color={style.brand}
              emissive={style.brand}
              emissiveIntensity={0.35}
              roughness={0.3}
            />
          </mesh>
        )),
      )}
      {/* Brand-colored crown stripe */}
      <mesh position={[-1.68, 5.1, 0]}>
        <boxGeometry args={[0.08, 0.25, 3.6]} />
        <meshBasicMaterial color={style.glow} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * The shared building block: a box body + a doorway recess on the front (-X).
 * Origin at ground center; front face at x = -width/2.
 */
function Facade({
  brand,
  palette,
  width = 3.4,
  height = 4,
  depth = 4,
}: {
  brand: string;
  palette: WorldPalette;
  width?: number;
  height?: number;
  depth?: number;
}) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={brand} roughness={0.7} metalness={0.08} />
      </mesh>
      {/* Doorway glow set into the front face */}
      <mesh position={[-width / 2 - 0.01, 0.95, 0]}>
        <planeGeometry args={[1.1, 1.9]} />
        <meshBasicMaterial color={palette.background} />
      </mesh>
      <mesh position={[-width / 2 + 0.02, 0.95, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.1, 1.9]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}
