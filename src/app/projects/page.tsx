import Link from "next/link";
import type { Metadata } from "next";
import { ProjectFigure } from "@/components/ui/ProjectFigure";
import { getAllProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects · Eric Xie",
};

export default function Projects() {
  const projects = getAllProjects();

  return (
    <main className="flex flex-col gap-4">
      <h1
        className="animate-in font-system text-3xl font-bold"
        style={{ "--index": 1 } as React.CSSProperties}
      >
        Projects
      </h1>
      <p
        className="max-w-xl animate-in text-sm text-text-light-body dark:text-text-dark-body md:text-base"
        style={{ "--index": 2 } as React.CSSProperties}
      >
        Things I&apos;ve built at work and in the community.
      </p>
      <div
        className="mt-4 grid animate-in grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2"
        style={{ "--index": 3 } as React.CSSProperties}
      >
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="group block"
          >
            <ProjectFigure
              figure={project.figure}
              label={project.title}
              className="group-hover:border-neutral-400 dark:group-hover:border-neutral-600"
            />
            <div className="mt-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-bold text-text-light-headerLight dark:text-white">
                  {project.title}
                  <span className="ml-2 font-normal text-text-light-body dark:text-text-dark-headerDark">
                    {project.company}
                  </span>
                </h2>
                <span className="shrink-0 text-sm text-text-light-body dark:text-text-dark-headerDark">
                  {project.timeline.split(" ").pop()}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-light-body dark:text-text-dark-body">
                {project.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
