import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import ProjectCarousel from "@/components/ui/ProjectCarousel";
import { getFeaturedProjects } from "@/lib/projects";

export default function Projects() {
  const projects = getFeaturedProjects();

  return (
    <>
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Projects</h1>
        <Link
          href="/projects"
          className="group flex items-center gap-1 text-sm text-text-light-body transition-colors hover:text-text-light-headerLight dark:text-text-dark-headerDark dark:hover:text-text-dark-header"
        >
          View all
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <ProjectCarousel projects={projects} />
    </>
  );
}
