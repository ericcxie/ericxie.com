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
  | "exploded";

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
