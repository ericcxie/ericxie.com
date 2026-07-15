/**
 * Maps each experience (by company name) to a building "kit" — the style the
 * ExperienceRoom renders. A few companies get bespoke buildings; everyone else
 * gets a branded office tower tinted by their brand color. To give a new
 * company a signature building, add a kit + a case in ExperienceRoom.
 */

export type RoomKit = "shopify" | "bmo" | "amazon" | "uwaterloo" | "office";

export type RoomStyle = {
  kit: RoomKit;
  /** primary facade / brand color */
  brand: string;
  /** secondary trim / accent */
  trim: string;
  /** emissive sign glow */
  glow: string;
};

const KIT_STYLES: Record<RoomKit, Omit<RoomStyle, "kit">> = {
  shopify: { brand: "#2f5a34", trim: "#95bf47", glow: "#7ab55c" },
  bmo: { brand: "#e6e8ec", trim: "#0a75bb", glow: "#0a75bb" },
  amazon: { brand: "#232f3e", trim: "#ff9900", glow: "#ff9900" },
  uwaterloo: { brand: "#3a4a63", trim: "#ffd54a", glow: "#ffd54a" },
  office: { brand: "#2a2c33", trim: "#8a8f9c", glow: "#6ea8ff" },
};

/** Pick the kit for a company from its name. */
export function resolveRoomKit(company: string): RoomKit {
  const c = company.toLowerCase();
  if (c.includes("shopify")) return "shopify";
  if (c.includes("bmo")) return "bmo";
  if (c.includes("amazon")) return "amazon";
  if (c.includes("waterloo")) return "uwaterloo";
  return "office";
}

/**
 * Full style for a company. `brandColor` (from experiences.ts) tints the
 * generic office kit so every company still feels distinct.
 */
export function resolveRoomStyle(
  company: string,
  brandColor?: string,
): RoomStyle {
  const kit = resolveRoomKit(company);
  const base = KIT_STYLES[kit];
  if (kit === "office" && brandColor) {
    return { kit, brand: brandColor, trim: base.trim, glow: brandColor };
  }
  return { kit, ...base };
}
