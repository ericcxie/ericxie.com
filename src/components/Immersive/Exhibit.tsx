"use client";

import { Text, useTexture } from "@react-three/drei";
import { SRGBColorSpace, type Texture } from "three";

import type { Exhibit as ExhibitType } from "./world.config";
import type { WorldPalette } from "./worldTheme";

const FONT_REGULAR = "/fonts/AkkuratPro.ttf";
const FONT_BOLD = "/fonts/AkkuratPro-Bold.otf";

export function Exhibit({
  exhibit,
  palette,
  active,
}: {
  exhibit: ExhibitType;
  palette: WorldPalette;
  active: boolean;
}) {
  return (
    <group
      position={exhibit.position}
      rotation={[0, exhibit.rotationY ?? 0, 0]}
    >
      {exhibit.kind === "directory" && (
        <DirectoryExhibit palette={palette} active={active} />
      )}
      {exhibit.kind === "about" && (
        <AboutExhibit exhibit={exhibit} palette={palette} active={active} />
      )}
      {exhibit.kind === "project" && (
        <ProjectExhibit exhibit={exhibit} palette={palette} active={active} />
      )}
      {exhibit.kind === "experience" && (
        <ExperienceExhibit exhibit={exhibit} palette={palette} active={active} />
      )}
      {exhibit.kind === "blog" && (
        <BlogExhibit exhibit={exhibit} palette={palette} active={active} />
      )}
      {exhibit.kind === "photos" && (
        <PhotoExhibit exhibit={exhibit} palette={palette} active={active} />
      )}
    </group>
  );
}

function DirectoryExhibit({
  palette,
  active,
}: {
  palette: WorldPalette;
  active: boolean;
}) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.2, 1.35, 0.16, 40]} />
        <meshStandardMaterial
          color={palette.surface}
          roughness={0.48}
          metalness={0.14}
        />
      </mesh>
      <mesh position={[0, 1.55, -0.08]} castShadow>
        <boxGeometry args={[2.65, 2.75, 0.18]} />
        <meshStandardMaterial
          color={active ? palette.activeSurface : palette.surface}
          roughness={0.5}
          metalness={0.08}
          emissive={active ? palette.accent : "#000000"}
          emissiveIntensity={active ? 0.12 : 0}
        />
      </mesh>
      <Text
        font={FONT_REGULAR}
        position={[0, 2.48, 0.03]}
        fontSize={0.11}
        color={active ? palette.accent : palette.mutedText}
        anchorX="center"
      >
        CENTRAL PLAZA
      </Text>
      <Text
        font={FONT_BOLD}
        position={[0, 2.1, 0.03]}
        fontSize={0.32}
        color={palette.text}
        anchorX="center"
      >
        DIRECTORY
      </Text>
      <Text
        font={FONT_REGULAR}
        position={[0, 1.42, 0.03]}
        fontSize={0.14}
        color={palette.mutedText}
        anchorX="center"
        textAlign="left"
        lineHeight={1.7}
      >
        {"N   ABOUT\nW   PROJECTS\nE   EXPERIENCE\nS   WRITING\nSE  PHOTOS"}
      </Text>
      <Text
        font={FONT_BOLD}
        position={[0, 0.48, 0.03]}
        fontSize={0.12}
        color={active ? palette.accent : palette.mutedText}
        anchorX="center"
      >
        {active ? "PRESS E TO OPEN" : "FIND YOUR WAY"}
      </Text>
      <ActiveLine active={active} palette={palette} width={2.65} />
    </group>
  );
}

function AboutExhibit({
  exhibit,
  palette,
  active,
}: ExhibitProps) {
  return (
    <group>
      <mesh position={[0, 1.65, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 3.35, 0.16]} />
        <meshStandardMaterial
          color={palette.surface}
          roughness={0.7}
          metalness={0.05}
          emissive={active ? palette.accent : "#000000"}
          emissiveIntensity={active ? 0.08 : 0}
        />
      </mesh>
      {[-3.35, 3.35].map((x) => (
        <mesh key={x} position={[x, 1.7, 0]} castShadow>
          <boxGeometry args={[0.16, 3.5, 0.35]} />
          <meshStandardMaterial
            color={palette.surface}
            roughness={0.55}
          />
        </mesh>
      ))}
      <mesh position={[0, 3.45, 0]} castShadow>
        <boxGeometry args={[7, 0.2, 0.75]} />
        <meshStandardMaterial color={palette.surface} roughness={0.5} />
      </mesh>
      <Text
        font={FONT_BOLD}
        position={[0, 2.2, 0.02]}
        fontSize={0.58}
        color={palette.text}
        anchorX="center"
        anchorY="middle"
      >
        {exhibit.title}
      </Text>
      <Text
        font={FONT_REGULAR}
        position={[0, 1.42, 0.02]}
        fontSize={0.18}
        color={palette.mutedText}
        anchorX="center"
        anchorY="middle"
        maxWidth={5.4}
        textAlign="center"
        lineHeight={1.45}
      >
        {"Computer Engineering at Waterloo\nSoftware Engineer Intern at Amazon"}
      </Text>
      <Text
        font={FONT_BOLD}
        position={[0, 0.58, 0.02]}
        fontSize={0.13}
        color={active ? palette.accent : palette.mutedText}
        anchorX="center"
      >
        {active ? "PRESS E TO OPEN PROFILE" : "ABOUT ERIC"}
      </Text>
      <ActiveLine active={active} palette={palette} width={6.4} />
    </group>
  );
}

function ProjectExhibit({
  exhibit,
  palette,
  active,
}: ExhibitProps) {
  const texture = useTexture(exhibit.image!);
  prepareTexture(texture);

  return (
    <group>
      <mesh position={[0, 1.65, -0.08]} castShadow>
        <boxGeometry args={[3.55, 2.28, 0.12]} />
        <meshStandardMaterial
          color={active ? palette.activeSurface : palette.surface}
          roughness={0.32}
          metalness={0.18}
          emissive={palette.accent}
          emissiveIntensity={active ? 0.18 : 0.02}
        />
      </mesh>
      <mesh position={[0, 1.72, 0]}>
        <planeGeometry args={[3.25, 1.83]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <Text
        font={FONT_BOLD}
        position={[-1.62, 0.34, 0]}
        fontSize={0.24}
        color={palette.text}
        anchorX="left"
        anchorY="middle"
        maxWidth={2.3}
      >
        {exhibit.title}
      </Text>
      <Text
        font={FONT_REGULAR}
        position={[1.62, 0.34, 0]}
        fontSize={0.11}
        color={active ? palette.accent : palette.mutedText}
        anchorX="right"
        anchorY="middle"
        maxWidth={1.4}
      >
        {exhibit.eyebrow?.toUpperCase()}
      </Text>
      <ActiveLine active={active} palette={palette} width={3.55} />
    </group>
  );
}

function ExperienceExhibit({
  exhibit,
  palette,
  active,
}: ExhibitProps) {
  const texture = useTexture(exhibit.logo!);
  prepareTexture(texture);

  return (
    <group>
      <mesh position={[0, 1.35, -0.07]} castShadow>
        <boxGeometry args={[3.2, 2.15, 0.12]} />
        <meshStandardMaterial
          color={active ? palette.activeSurface : palette.surface}
          roughness={0.55}
          metalness={0.08}
          emissive={active ? palette.accent : "#000000"}
          emissiveIntensity={active ? 0.1 : 0}
        />
      </mesh>
      <mesh position={[-0.83, 1.48, 0.015]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial color={exhibit.brandColor ?? "#ffffff"} />
      </mesh>
      <mesh position={[-0.83, 1.48, 0.025]}>
        <planeGeometry args={[0.92, 0.92]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
      <Text
        font={FONT_REGULAR}
        position={[-0.05, 1.92, 0.02]}
        fontSize={0.12}
        color={active ? palette.accent : palette.mutedText}
        anchorX="left"
        anchorY="middle"
      >
        {exhibit.eyebrow?.toUpperCase()}
      </Text>
      <Text
        font={FONT_BOLD}
        position={[-0.05, 1.52, 0.02]}
        fontSize={0.25}
        color={palette.text}
        anchorX="left"
        anchorY="middle"
        maxWidth={1.45}
      >
        {exhibit.title}
      </Text>
      <Text
        font={FONT_REGULAR}
        position={[-0.05, 0.93, 0.02]}
        fontSize={0.12}
        color={palette.mutedText}
        anchorX="left"
        anchorY="middle"
        maxWidth={1.4}
      >
        {exhibit.panel?.body ?? ""}
      </Text>
      <ActiveLine active={active} palette={palette} width={3.2} />
    </group>
  );
}

function BlogExhibit({ exhibit, palette, active }: ExhibitProps) {
  return (
    <group>
      <mesh position={[0, 1.45, -0.06]} castShadow>
        <boxGeometry args={[2.8, 2.45, 0.1]} />
        <meshStandardMaterial
          color={active ? palette.activeSurface : palette.surface}
          roughness={0.82}
          metalness={0}
          emissive={active ? palette.accent : "#000000"}
          emissiveIntensity={active ? 0.08 : 0}
        />
      </mesh>
      <Text
        font={FONT_REGULAR}
        position={[-1.12, 2.2, 0]}
        fontSize={0.12}
        color={active ? palette.accent : palette.mutedText}
        anchorX="left"
        anchorY="middle"
      >
        {exhibit.eyebrow?.toUpperCase()}
      </Text>
      <Text
        font={FONT_BOLD}
        position={[-1.12, 1.62, 0]}
        fontSize={0.3}
        color={palette.text}
        anchorX="left"
        anchorY="middle"
        maxWidth={2.2}
        lineHeight={1.2}
      >
        {exhibit.title}
      </Text>
      <Text
        font={FONT_REGULAR}
        position={[-1.12, 0.7, 0]}
        fontSize={0.12}
        color={palette.mutedText}
        anchorX="left"
        anchorY="middle"
      >
        READ ARTICLE
      </Text>
      <ActiveLine active={active} palette={palette} width={2.8} />
    </group>
  );
}

function PhotoExhibit({ exhibit, palette, active }: ExhibitProps) {
  const textures = useTexture(exhibit.images!) as Texture[];
  textures.forEach(prepareTexture);
  const placements: Array<{
    position: [number, number, number];
    rotation: [number, number, number];
  }> = [
    { position: [-1.45, 1.85, 0], rotation: [0, 0.14, -0.05] },
    { position: [0, 2.05, 0.25], rotation: [0, 0, 0.03] },
    { position: [1.45, 1.8, 0], rotation: [0, -0.14, 0.07] },
  ];

  return (
    <group>
      {textures.map((texture, index) => (
        <group key={exhibit.images![index]} {...placements[index]}>
          <mesh position={[0, 0, -0.04]} castShadow>
            <boxGeometry args={[1.72, 2.42, 0.08]} />
            <meshStandardMaterial color={palette.surface} roughness={0.5} />
          </mesh>
          <mesh>
            <planeGeometry args={[1.58, 2.28]} />
            <meshBasicMaterial map={texture} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <Text
        font={FONT_BOLD}
        position={[0, 0.35, 0]}
        fontSize={0.3}
        color={palette.text}
        anchorX="center"
      >
        VIEW THE PHOTO JOURNAL
      </Text>
      <ActiveLine active={active} palette={palette} width={5.5} />
    </group>
  );
}

function ActiveLine({
  active,
  palette,
  width,
}: {
  active: boolean;
  palette: WorldPalette;
  width: number;
}) {
  return (
    <mesh position={[0, 0.08, 0]}>
      <boxGeometry args={[width, active ? 0.055 : 0.025, 0.04]} />
      <meshBasicMaterial
        color={active ? palette.accent : palette.mutedText}
        transparent
        opacity={active ? 1 : 0.35}
        toneMapped={false}
      />
    </mesh>
  );
}

type ExhibitProps = {
  exhibit: ExhibitType;
  palette: WorldPalette;
  active: boolean;
};

function prepareTexture(texture: Texture) {
  texture.colorSpace = SRGBColorSpace;
}
