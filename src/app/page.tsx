import Current from "@/components/Sections/Current";
import Experiences from "@/components/Sections/Experiences";
import LatestPosts from "@/components/Sections/LatestPosts";
import Projects from "@/components/Sections/Projects";
import { LinkPreview } from "@/components/ui/LinkPreview";

import { Spotlight } from "@/components/ui/Spotlight";
import { readFile } from "fs/promises";
import path from "path";

interface AboutData {
  intro: {
    role: string;
    school: { name: string; url: string };
    company: { name: string; url: string; role: string };
    bio: string;
    linkedin: string;
    email: string;
  };
}

async function getAboutData(): Promise<AboutData> {
  const filePath = path.join(process.cwd(), "src/content/about.json");
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content);
}

export default async function Home() {
  const { intro } = await getAboutData();

  return (
    <main className="flex flex-col gap-10">
      <div>
        <Spotlight
          className="-left-10 -top-16 md:-top-20 md:left-60 2xl:hidden"
          fill="white"
        />
        <h1
          className="animate-in font-system text-3xl font-bold"
          style={{ "--index": 1 } as React.CSSProperties}
        >
          Eric Xie
        </h1>
        <div className="mt-4 space-y-1">
          <p
            className="max-w-2xl animate-in text-sm text-text-light-body dark:text-text-dark-body md:text-base"
            style={{ "--index": 2 } as React.CSSProperties}
          >
            I&apos;m a {intro.role} at the{" "}
            <span className="border-b-[2px] border-neutral-600 transition duration-500 hover:border-neutral-800 dark:hover:border-neutral-500">
              <LinkPreview url={intro.school.url}>
                {intro.school.name}
              </LinkPreview>
            </span>
            . Currently, I&apos;m a {intro.company.role} at{" "}
            <span className="border-b-[2px] border-neutral-600 transition duration-500 hover:border-neutral-800 dark:hover:border-neutral-500">
              <LinkPreview url={intro.company.url}>
                {intro.company.name}
              </LinkPreview>
            </span>
            .
          </p>
        </div>
        <div className="mt-4 space-y-1">
          <p
            className="max-w-xl animate-in text-sm text-text-light-body dark:text-text-dark-body md:text-base"
            style={{ "--index": 3 } as React.CSSProperties}
          >
            {intro.bio}
          </p>
        </div>
        <div className="mt-4 space-y-1">
          <p
            className="max-w-lg animate-in text-sm text-text-light-body dark:text-text-dark-body md:text-base"
            style={{ "--index": 4 } as React.CSSProperties}
          >
            You can reach me on{" "}
            <span className="border-b-[2px] border-neutral-600 transition duration-500 hover:border-neutral-800 dark:hover:border-neutral-500">
              <a
                href={intro.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </span>{" "}
            or at{" "}
            <span className="border-b-[2px] border-neutral-600">
              <a
                href={`mailto:${intro.email}`}
                className="border-b-[2px] border-neutral-600 transition duration-500 hover:border-neutral-800 dark:hover:border-neutral-500"
              >
                {intro.email}
              </a>
            </span>
            .
          </p>
        </div>
      </div>
      <div
        className="animate-in"
        style={{ "--index": 5 } as React.CSSProperties}
      >
        <Projects />
      </div>
      <div
        className="animate-in"
        style={{ "--index": 6 } as React.CSSProperties}
      >
        <Experiences />
      </div>
      <div
        className="animate-in"
        style={{ "--index": 7 } as React.CSSProperties}
      >
        <LatestPosts />
      </div>
      <div
        className="animate-in"
        style={{ "--index": 8 } as React.CSSProperties}
      >
        <Current />
      </div>
    </main>
  );
}
