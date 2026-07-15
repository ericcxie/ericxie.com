/**
 * Palette for the immersive 3D world. Two moods that follow next-themes:
 *  - dark  → "the void"    (near-black keynote stage, pooled spotlights, bloom)
 *  - light → "the gallery" (soft off-white Apple-store, bright even light)
 *
 * Single source of truth so every mesh/light reads from one place. Colors are
 * kept close to the site's Tailwind tokens (#0C0C0C / #FCFCFC) for continuity.
 */

export type WorldPalette = {
  /** scene background + fog color */
  background: string;
  /** fog near/far distances (world units) */
  fog: [number, number];
  /** reflective ground base color */
  floor: string;
  /** how mirror-like the floor is (0 = matte, 1 = perfect mirror) */
  floorMirror: number;
  /** matte body of exhibits / pedestals */
  surface: string;
  /** raised or selected surface */
  activeSurface: string;
  /** accent used for glow, emissive edges, the avatar's core */
  accent: string;
  /** ambient light intensity */
  ambient: number;
  /** key/spot light intensity */
  key: number;
  /** post-processing bloom strength */
  bloom: number;
  /** avatar silhouette color */
  avatar: string;
  /** in-world text/label color */
  text: string;
  /** secondary in-world copy */
  mutedText: string;
  /** road asphalt color */
  road: string;
  /** road lane markings */
  roadLine: string;
};

export const WORLD_THEMES: Record<"dark" | "light", WorldPalette> = {
  dark: {
    background: "#08080a",
    fog: [60, 220],
    floor: "#0c0c0f",
    floorMirror: 0.2,
    surface: "#17171c",
    activeSurface: "#202127",
    accent: "#6ea8ff",
    ambient: 0.32,
    key: 1.35,
    bloom: 0.55,
    avatar: "#e7ecff",
    text: "#e5e5ef",
    mutedText: "#9a9aa4",
    road: "#141419",
    roadLine: "#3a3a44",
  },
  light: {
    background: "#f4f4f6",
    fog: [70, 240],
    floor: "#e9e9ee",
    floorMirror: 0.08,
    surface: "#ffffff",
    activeSurface: "#f4f7ff",
    accent: "#2f6bff",
    ambient: 0.85,
    key: 1.1,
    bloom: 0.2,
    avatar: "#1b1b22",
    text: "#0d0d0b",
    mutedText: "#6d6d6d",
    road: "#c9c9d2",
    roadLine: "#ffffff",
  },
};

export function getWorldPalette(resolvedTheme: string | undefined): WorldPalette {
  return resolvedTheme === "light" ? WORLD_THEMES.light : WORLD_THEMES.dark;
}
