import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/20/solid";
import { ProjectFigure } from "@/components/ui/ProjectFigure";
import { getAllPosts } from "@/lib/blogs";
import { getAllProjects, getProjectData } from "@/lib/projects";

type Params = { params: { slug: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProjectData(params.slug);
  return {
    title: `${project.title} · Eric Xie`,
    description: project.description,
  };
}

const muted = "text-text-light-body dark:text-text-dark-headerDark";
const linkStyle =
  "group underline decoration-neutral-400 underline-offset-4 transition-colors hover:decoration-current dark:decoration-neutral-600";

// Keeps the icon on the same line as the label's last word
const LinkLabel = ({ text, icon }: { text: string; icon: React.ReactNode }) => {
  const split = text.lastIndexOf(" ") + 1;
  return (
    <>
      {text.slice(0, split)}
      <span className="whitespace-nowrap">
        {text.slice(split)}
        {icon}
      </span>
    </>
  );
};

// A small label on the left, its content on the right
const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="grid gap-1.5 md:grid-cols-[120px_1fr] md:gap-8">
    <h2 className={`text-sm ${muted}`}>{label}</h2>
    <div className="text-sm leading-relaxed text-text-light-headerLight dark:text-text-dark-body">
      {children}
    </div>
  </div>
);

const Project = async ({ params }: Params) => {
  const project = await getProjectData(params.slug);
  const post = getAllPosts().find((p) => p.id === project.post);

  return (
    <section className="flex flex-col gap-8">
      <Link
        href="/projects"
        className={`group flex w-fit items-center gap-1 text-sm transition-colors hover:text-text-light-headerLight dark:hover:text-text-dark-header ${muted}`}
      >
        <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Projects
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <p className={`mt-1 text-sm ${muted}`}>
          {project.company} · {project.role} · {project.timeline}
        </p>
      </div>

      <ProjectFigure
        figure={project.figure}
        label={project.title}
        figureClassName="mx-auto max-w-[400px]"
      />

      <div className="flex flex-col gap-8">
        {project.sections.map((section) => (
          <Row key={section.heading} label={section.heading}>
            <div
              className="project-prose"
              dangerouslySetInnerHTML={{ __html: section.html }}
            />
          </Row>
        ))}

        {project.tools.length > 0 && (
          <Row label="Stack">{project.tools.join(" · ")}</Row>
        )}

        {(project.link || post) && (
          <Row label="Links">
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkStyle}
                >
                  <LinkLabel
                    text={new URL(project.link).hostname.replace(/^www\./, "")}
                    icon={
                      <ArrowUpRightIcon className="ml-0.5 inline h-3.5 w-3.5 align-[-2px] transition duration-200 group-hover:-translate-y-[1px] group-hover:translate-x-[1px]" />
                    }
                  />
                </a>
              )}
              {post && (
                <Link href={`/writing/${post.id}`} className={linkStyle}>
                  <LinkLabel
                    text={post.title}
                    icon={
                      <ArrowRightIcon className="ml-0.5 inline h-3.5 w-3.5 align-[-2px] transition-transform duration-200 group-hover:translate-x-0.5" />
                    }
                  />
                </Link>
              )}
            </div>
          </Row>
        )}
      </div>

      <nav
        className={`mt-4 flex justify-between gap-4 border-t border-neutral-200 pt-6 text-sm dark:border-neutral-800 ${muted}`}
      >
        {project.prev ? (
          <Link
            href={`/projects/${project.prev.slug}`}
            className="group flex items-center gap-1 transition-colors hover:text-text-light-headerLight dark:hover:text-text-dark-header"
          >
            <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            {project.prev.title}
          </Link>
        ) : (
          <span />
        )}
        {project.next && (
          <Link
            href={`/projects/${project.next.slug}`}
            className="group flex items-center gap-1 transition-colors hover:text-text-light-headerLight dark:hover:text-text-dark-header"
          >
            {project.next.title}
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </nav>
    </section>
  );
};

export default Project;
