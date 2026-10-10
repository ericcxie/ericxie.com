import Current from "@/components/Sections/Current";
import Experiences from "@/components/Sections/Experiences";
import LatestPosts from "@/components/Sections/LatestPosts";
import Projects from "@/components/Sections/Projects";
import EmailCopyLink from "@/components/EmailCopyLink";

import { Spotlight } from "@/components/ui/Spotlight";

const contactLink =
  "cursor-pointer bg-transparent p-0 text-text-light-body transition-colors hover:text-text-light-header dark:text-text-dark-headerDark dark:hover:text-white";

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
        <p
          className="mt-4 max-w-2xl animate-in text-sm leading-relaxed text-text-light-body dark:text-text-dark-body md:text-base"
          style={{ "--index": 2 } as React.CSSProperties}
        >
          I currently study Computer Engineering at the University of
          Waterloo. I&apos;ve previously worked at Amazon, Gem and Shopify.
        </p>
        <p
          className="mt-4 max-w-2xl animate-in text-sm leading-relaxed text-text-light-body dark:text-text-dark-body md:text-base"
          style={{ "--index": 3 } as React.CSSProperties}
        >
          If you&apos;re building something interesting or just want to chat,
          feel free to reach out!
        </p>
        <div
          className="mt-4 flex animate-in gap-5 text-sm md:text-base"
          style={{ "--index": 4 } as React.CSSProperties}
        >
          <EmailCopyLink label="Email" className={contactLink} />
          <a
            href="https://www.linkedin.com/in/ericcxie/"
            target="_blank"
            rel="noopener noreferrer"
            className={contactLink}
          >
            LinkedIn
          </a>
          <a
            href="https://x.com/ericxxie"
            target="_blank"
            rel="noopener noreferrer"
            className={contactLink}
          >
            X
          </a>
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
