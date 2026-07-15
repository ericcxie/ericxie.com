import {
  communityItems,
  experienceItems,
  schoolItems,
} from "@/content/experience/experiences";
import { cardItems } from "@/content/project/projects";
import type { PostItem } from "@/types";

export type ExhibitKind =
  | "directory"
  | "about"
  | "project"
  | "blog"
  | "photos"
  | "experience"
  | "globe";

export type ExhibitInteraction = "panel" | "navigate" | "both";
export type PanelField = { label?: string; value: string };

export type Exhibit = {
  id: string;
  kind: ExhibitKind;
  title: string;
  eyebrow?: string;
  position: [number, number, number];
  rotationY?: number;
  interaction: ExhibitInteraction;
  href?: string;
  image?: string;
  images?: string[];
  logo?: string;
  brandColor?: string;
  panel?: {
    heading: string;
    body?: string;
    fields?: PanelField[];
    href?: string;
    hrefLabel?: string;
  };
};

/* ------------------------------------------------------------------ *
 * CITY LAYOUT
 *
 * A big rectangular LOOP ROAD you cruise. The globe is a giant centerpiece
 * on the island inside the loop. Each district sits just OUTSIDE one edge of
 * the loop, its buildings facing the street, announced by a "WELCOME" gantry
 * you drive under. Everything is spaced for a car, not a walker.
 *
 *            NORTH  (Career Blvd / Experience)
 *                 ┌──────────────────┐
 *   WEST          │      ATLAS        │        EAST
 * (Workshop/      │   PARK  ◍ globe   │      (The Press/
 *  Projects)      │                  │       Writing)
 *                 └──────────────────┘
 *            SOUTH  (Downtown / About — spawn)
 * ------------------------------------------------------------------ */

// Loop road centerline: a rectangle spanning ±LOOP_X by ±LOOP_Z.
export const LOOP_X = 42;
export const LOOP_Z = 30;
export const ROAD_WIDTH = 7;

export const WORLD_BOUNDS = {
  minX: -LOOP_X - 24,
  maxX: LOOP_X + 24,
  minZ: -LOOP_Z - 24,
  maxZ: LOOP_Z + 24,
};

// A district: a labelled zone just outside the loop with a welcome gantry.
export type District = {
  id: WorldDestination["id"];
  label: string; // shown on the WELCOME sign
  color: string; // accent used for the district
  // where the welcome gantry crosses the loop
  gate: [number, number, number];
  gateRotationY: number;
  // ground pad center + size for the district
  pad: [number, number];
  padSize: [number, number];
};

export const DISTRICTS: District[] = [
  {
    id: "about",
    label: "DOWNTOWN",
    color: "#6ea8ff",
    gate: [0, 0, LOOP_Z],
    gateRotationY: 0,
    pad: [0, LOOP_Z + 11],
    padSize: [40, 20],
  },
  {
    id: "experience",
    label: "CAREER BLVD",
    color: "#34d399",
    gate: [0, 0, -LOOP_Z],
    gateRotationY: 0,
    pad: [0, -LOOP_Z - 13],
    padSize: [80, 24],
  },
  {
    id: "projects",
    label: "THE WORKSHOP",
    color: "#f59e0b",
    gate: [-LOOP_X, 0, 0],
    gateRotationY: Math.PI / 2,
    pad: [-LOOP_X - 12, 0],
    padSize: [22, 44],
  },
  {
    id: "writing",
    label: "THE PRESS",
    color: "#f472b6",
    gate: [LOOP_X, 0, 0],
    gateRotationY: Math.PI / 2,
    pad: [LOOP_X + 12, 0],
    padSize: [22, 40],
  },
  {
    id: "photos",
    label: "ATLAS PARK",
    color: "#fb7185",
    gate: [0, 0, LOOP_Z], // shares the south gate area; park is central
    gateRotationY: 0,
    pad: [0, 0],
    padSize: [30, 30],
  },
];

export type WorldDestination = {
  id: "plaza" | "about" | "projects" | "experience" | "writing" | "photos";
  title: string;
  subtitle: string;
  direction: string;
  position: [number, number, number];
  yaw: number;
};

// Globe centerpiece position (center island).
export const GLOBE_POS: [number, number, number] = [0, 0, 0];

export const WORLD_DESTINATIONS: WorldDestination[] = [
  {
    id: "plaza",
    title: "Downtown",
    subtitle: "Start line, just inside the south gate",
    direction: "South",
    position: [0, 0, LOOP_Z - 6],
    yaw: 0,
  },
  {
    id: "about",
    title: "About Eric",
    subtitle: "Downtown welcome",
    direction: "South",
    position: [0, 0, LOOP_Z + 4],
    yaw: Math.PI,
  },
  {
    id: "experience",
    title: "Career Boulevard",
    subtitle: "Where I've worked and studied",
    direction: "North",
    position: [-30, 0, -LOOP_Z + 5],
    yaw: 0,
  },
  {
    id: "projects",
    title: "The Workshop",
    subtitle: "Things I've built",
    direction: "West",
    position: [-LOOP_X + 5, 0, 0],
    yaw: -Math.PI / 2,
  },
  {
    id: "writing",
    title: "The Press",
    subtitle: "Recent writing",
    direction: "East",
    position: [LOOP_X - 5, 0, 0],
    yaw: Math.PI / 2,
  },
  {
    id: "photos",
    title: "Atlas Park",
    subtitle: "The globe and photo journal",
    direction: "Center",
    position: [0, 0, 10],
    yaw: Math.PI,
  },
];

const photoSelection = [
  "/img/photos/soho.webp",
  "/img/photos/kamakura.webp",
  "/img/photos/temple.webp",
];

export function buildExhibits(posts: PostItem[]): Exhibit[] {
  const exhibits: Exhibit[] = [
    {
      id: "directory",
      kind: "directory",
      title: "Directory",
      eyebrow: "Downtown",
      // Just inside the south gate, near the spawn.
      position: [6, 0, LOOP_Z - 6],
      interaction: "panel",
    },
    {
      id: "about",
      kind: "about",
      title: "Eric Xie",
      eyebrow: "Computer Engineering / Waterloo",
      // Downtown, outside the south edge of the loop.
      position: [0, 0, LOOP_Z + 9],
      rotationY: Math.PI,
      interaction: "panel",
      panel: {
        heading: "Hey, I'm Eric.",
        body: "I'm a Computer Engineering student at the University of Waterloo and a Software Engineer Intern at Amazon. I care about building software that is functional, clean, and enjoyable to use.",
        fields: [
          { label: "Now", value: "Software Engineer Intern at Amazon" },
          { label: "Based", value: "Vancouver, BC" },
        ],
      },
    },
  ];

  // THE WORKSHOP / Projects — buildings along the West edge, facing the street.
  cardItems.forEach((project, index) => {
    const z = -((cardItems.length - 1) * 5) / 2 + index * 10;
    exhibits.push({
      id: `project-${index}`,
      kind: "project",
      title: project.title,
      eyebrow: project.tag,
      position: [-LOOP_X - 9, 0, z],
      rotationY: Math.PI / 2, // face +X toward the loop
      interaction: "both",
      href: project.link,
      image: project.image,
      panel: {
        heading: project.title,
        body: project.description,
        fields: [
          { label: "Type", value: project.tag },
          { label: "Stack", value: project.tools.join(" / ") },
        ],
        href: project.link,
        hrefLabel: "Visit project",
      },
    });
  });

  // CAREER BLVD / Experience — buildings on BOTH sides of the north boulevard.
  const timeline = [
    ...experienceItems.map((item) => ({ ...item, group: "Work" })),
    ...communityItems.map((item) => ({ ...item, group: "Community" })),
    ...schoolItems.map((item) => ({ ...item, group: "Education" })),
  ];

  const blvdZFront = -LOOP_Z - 7; // near the loop
  const blvdZBack = -LOOP_Z - 20; // far side
  timeline.forEach((item, index) => {
    const slot = Math.floor(index / 2);
    const frontRow = index % 2 === 0;
    const x = -((Math.ceil(timeline.length / 2) - 1) * 11) / 2 + slot * 11;
    const z = frontRow ? blvdZFront : blvdZBack;
    // Front row faces +Z (toward loop); back row faces -Z.
    const rotationY = frontRow ? 0 : Math.PI;

    exhibits.push({
      id: `experience-${index}`,
      kind: "experience",
      title: item.company,
      eyebrow: item.group,
      position: [x, 0, z],
      rotationY,
      interaction: "both",
      href: item.link,
      logo: item.logo,
      brandColor: item.color,
      panel: {
        heading: item.company,
        body: item.position,
        fields: [
          { label: "When", value: item.date },
          { label: "Where", value: item.location },
          { label: "Area", value: item.group },
        ],
        href: item.link,
        hrefLabel: "Visit website",
      },
    });
  });

  // THE PRESS / Writing — signposts along the East edge.
  posts
    .filter((post) => post.id !== ".gitkeep")
    .slice(-3)
    .reverse()
    .forEach((post, index) => {
      const z = -10 + index * 10;
      exhibits.push({
        id: `blog-${post.id}`,
        kind: "blog",
        title: post.title,
        eyebrow: post.category,
        position: [LOOP_X + 9, 0, z],
        rotationY: -Math.PI / 2, // face -X toward the loop
        interaction: "both",
        href: `/blog/${post.id}`,
        panel: {
          heading: post.title,
          body: `${post.category}${post.readingTime ? ` / ${post.readingTime} min read` : ""}`,
          href: `/blog/${post.id}`,
          hrefLabel: "Read post",
        },
      });
    });

  // ATLAS PARK — the giant globe centerpiece. Visual drawn in Scene; this
  // marker drives proximity + the "Press E" journal interaction.
  exhibits.push({
    id: "globe",
    kind: "globe",
    title: "Places",
    eyebrow: "Around the world",
    position: GLOBE_POS,
    interaction: "navigate",
    href: "/photos",
    panel: {
      heading: "Places I've been",
      body: "Every pin is somewhere I've pointed a camera.",
      href: "/photos",
      hrefLabel: "Open the journal",
    },
  });

  // Photo wall, also in Atlas Park, beside the globe.
  exhibits.push({
    id: "photos",
    kind: "photos",
    title: "Photos",
    eyebrow: "Shot on Fujifilm",
    position: [12, 0, 11],
    rotationY: Math.PI,
    interaction: "navigate",
    href: "/photos",
    images: photoSelection,
    panel: {
      heading: "Photos",
      body: "A visual record of the places I have been.",
      href: "/photos",
      hrefLabel: "Open gallery",
    },
  });

  return exhibits;
}
