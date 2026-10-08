import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { renderBlogMarkdown } from "@/lib/blog-markdown-html";
import { ProjectItem } from "@/types";

const projectsDirectory = path.join(
  process.cwd(),
  "src",
  "content",
  "projects",
);

const readProject = (slug: string) => {
  const fullPath = path.join(projectsDirectory, `${slug}.md`);
  const matterResult = matter(fs.readFileSync(fullPath, "utf8"));
  const data = matterResult.data;

  const project: ProjectItem = {
    slug,
    title: data.title,
    company: data.company,
    role: data.role,
    timeline: data.timeline,
    description: data.description,
    tools: data.tools ?? [],
    figure: data.figure,
    link: data.link,
    post: data.post,
    order: data.order ?? Infinity,
    featured: data.featured ?? false,
  };

  return { project, content: matterResult.content };
};

export const getAllProjects = (): ProjectItem[] =>
  fs
    .readdirSync(projectsDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => readProject(fileName.replace(/\.md$/, "")).project)
    .sort((a, b) => a.order - b.order);

export const getFeaturedProjects = (): ProjectItem[] =>
  getAllProjects().filter((project) => project.featured);

// Each "## Heading" in a project file becomes a labelled section
const renderSections = (content: string) =>
  Promise.all(
    content
      .split(/^## /m)
      .slice(1)
      .map(async (section) => {
        const [heading, ...body] = section.split("\n");
        return {
          heading: heading.trim(),
          html: await renderBlogMarkdown(body.join("\n")),
        };
      }),
  );

export const getProjectData = async (slug: string) => {
  const { project, content } = readProject(slug);
  const sections = await renderSections(content);

  const projects = getAllProjects();
  const index = projects.findIndex((p) => p.slug === slug);

  return {
    ...project,
    sections,
    prev: index > 0 ? projects[index - 1] : undefined,
    next: index < projects.length - 1 ? projects[index + 1] : undefined,
  };
};
