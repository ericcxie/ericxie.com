"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { ProjectFigure } from "@/components/ui/ProjectFigure";
import type { ProjectItem } from "@/types";

export default function ProjectCarousel({
  projects,
}: {
  projects: ProjectItem[];
}) {
  const [emblaRef] = useEmblaCarousel({ loop: true, dragFree: true }, [
    AutoScroll({
      playOnInit: true,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      startDelay: 500,
      speed: 0.4,
    }),
  ]);

  return (
    <div className="relative overflow-hidden pt-4 [mask-image:linear-gradient(to_right,transparent,white_12%,white_88%,transparent)]">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {projects.map((project) => (
            <div key={project.slug} className="min-w-0 shrink-0 grow-0 px-2">
              {/* Native link dragging would hijack the carousel's drag gesture */}
              <Link
                href={`/projects/${project.slug}`}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="group block w-[220px] md:w-[260px]"
              >
                <ProjectFigure
                  figure={project.figure}
                  label={project.title}
                  showRead={false}
                  className="group-hover:border-neutral-400 dark:group-hover:border-neutral-600"
                />
                <div className="mt-3 text-sm md:text-base">
                  <h2 className="font-bold text-text-light-headerLight dark:text-white">
                    {project.title}
                  </h2>
                  <p className="truncate text-text-light-body dark:text-text-dark-headerDark">
                    {project.company}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
