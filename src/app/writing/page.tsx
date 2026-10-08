import PostList from "./components/PostList";
import { getCategorizedPosts } from "@/lib/blogs";

export default function Blog() {
  const posts = getCategorizedPosts();
  return (
    <main className="flex flex-col gap-4">
      <h1
        className="animate-in font-system text-3xl font-bold"
        style={{ "--index": 1 } as React.CSSProperties}
      >
        Writing
      </h1>
      <p
        className="max-w-xl animate-in text-sm text-text-light-body dark:text-text-dark-body md:text-base"
        style={{ "--index": 2 } as React.CSSProperties}
      >
        I occasionally write about things that I find interesting.
      </p>
      <div
        className="mt-4 animate-in"
        style={{ "--index": 3 } as React.CSSProperties}
      >
        <PostList posts={posts} />
      </div>
    </main>
  );
}
