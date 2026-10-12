export type PostItem = {
  id: string;
  title: string;
  date: string;
  category: string;
  readingTime?: number;
};

export type ProjectFigure =
  | "branches"
  | "slow"
  | "laptop"
  | "exploded"
  | "plot"
  | "riffle";

export type ProjectItem = {
  slug: string;
  title: string;
  company: string;
  role: string;
  timeline: string;
  description: string;
  tools: string[];
  figure: ProjectFigure;
  link?: string;
  post?: string;
  order: number;
  featured: boolean;
};

// One entry in src/content/photos/photos.json
export type PhotoEntry = {
  filename: string;
  date: string;
  location: string;
  lng?: number;
  lat?: number;
};

// A photo uploaded to Vercel Blob, waiting for the sync action to pull it in
export type PhotoMetadata = PhotoEntry & { url: string };
