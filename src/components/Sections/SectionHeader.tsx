import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { cn } from "@/utils/cn";

// A home page section title with a "View all" link to its page
export default function SectionHeader({
  title,
  href,
  className,
}: {
  title: string;
  href: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between", className)}>
      <h1 className="text-xl font-bold">{title}</h1>
      <Link
        href={href}
        className="group flex items-center gap-1 text-sm text-text-light-body transition-colors hover:text-text-light-headerLight dark:text-text-dark-headerDark dark:hover:text-text-dark-header"
      >
        View all
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
