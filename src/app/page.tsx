import Current from "@/components/Sections/Current";
import Experiences from "@/components/Sections/Experiences";
import LatestPosts from "@/components/Sections/LatestPosts";
import Projects from "@/components/Sections/Projects";
import { LinkPreview } from "@/components/ui/LinkPreview";

import { Spotlight } from "@/components/ui/Spotlight";

export default function Home() {
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
            I&apos;m a Computer Engineering student at the{" "}
            <span className="border-b-[2px] border-neutral-600 transition duration-500 hover:border-neutral-800 dark:hover:border-neutral-500">
              <LinkPreview url="https://uwaterloo.ca/engineering/">
                University of Waterloo
              </LinkPreview>
            </span>
            . Currently, I&apos;m a Software Engineer Intern at{" "}
            <span className="border-b-[2px] border-neutral-600 transition duration-500 hover:border-neutral-800 dark:hover:border-neutral-500">
              <LinkPreview url="https://www.aboutamazon.com/">
                Amazon
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
            I believe in creating software that is not only functional but also
            clean, beautiful, and enjoyable to use. Let&apos;s build something
            together that inspires.
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
                href="https://www.linkedin.com/in/ericcxie/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </span>{" "}
            or at{" "}
            <span className="border-b-[2px] border-neutral-600">
              <a
                href="mailto:pexie@uwaterloo.ca"
                className="border-b-[2px] border-neutral-600 transition duration-500 hover:border-neutral-800 dark:hover:border-neutral-500"
              >
                pexie@uwaterloo.ca
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
