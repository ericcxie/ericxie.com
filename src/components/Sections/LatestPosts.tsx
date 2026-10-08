import PostList from "@/app/writing/components/PostList";
import { getCategorizedPosts } from "@/lib/blogs";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

export default function LatestPosts() {
  const posts = getCategorizedPosts();

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Writing</h1>
        <Link
          href="/writing"
          className="group flex items-center gap-1 text-sm text-text-light-body transition-colors hover:text-text-light-headerLight dark:text-text-dark-headerDark dark:hover:text-text-dark-header"
        >
          View all
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <PostList posts={posts} />
    </div>
  );
}
