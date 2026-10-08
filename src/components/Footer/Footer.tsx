import { FaXTwitter } from "react-icons/fa6";
import { IoLogoGithub, IoLogoLinkedin } from "react-icons/io5";

export default function Footer() {
  const lastUpdatedISO = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;
  const lastUpdatedDate = lastUpdatedISO ? new Date(lastUpdatedISO) : new Date();
  const lastUpdatedFormatted = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(lastUpdatedDate);
  return (
    <footer className="inset-x-0 border-t border-neutral-200 dark:border-neutral-800 bg-background-light py-3 text-text-light-body dark:bg-background-dark dark:text-text-dark-body">
      <div className="mx-auto flex max-w-[700px] items-center justify-between px-6 text-center md:flex-row md:px-6">
        <div className="flex flex-col justify-start text-start">
          <p className="text-xs md:text-sm">Last updated: {lastUpdatedFormatted}</p>
          <p className="text-xs md:text-sm">
            © {new Date().getFullYear()} Eric Xie.
          </p>
        </div>
        <div className="flex justify-end gap-1">
          <a
            href="https://x.com/ericxxie"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaXTwitter className="text-2xl hover:text-text-light-headerLight dark:hover:text-text-dark-headerDark" />
          </a>
          <a
            href="https://www.linkedin.com/in/ericcxie"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IoLogoLinkedin className="text-2xl transition duration-500 hover:text-text-light-headerLight dark:hover:text-text-dark-headerDark" />
          </a>
          <a
            href="https://github.com/ericcxie"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IoLogoGithub className="text-2xl transition duration-500 hover:text-text-light-headerLight dark:hover:text-text-dark-headerDark" />
          </a>
        </div>
      </div>
    </footer>
  );
}
