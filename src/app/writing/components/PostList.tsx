import Link from "next/link";
import moment from "moment";
import { CursorTag } from "@/components/ui/CursorTag";
import type { PostItem } from "@/types";

const PostList = ({ posts }: { posts: PostItem[] }) => {
  if (posts.length === 0) {
    return (
      <div className="italic text-text-light-body dark:text-text-dark-body">
        Stay tuned!
      </div>
    );
  }

  return (
    <ul className="animated-list">
      {posts.map((post) => (
        <li
          key={post.id}
          className="flex items-start justify-start gap-4 md:gap-10"
        >
          <div className="w-24 flex-shrink-0 text-sm text-text-light-body dark:text-text-dark-headerDark md:w-32 md:text-base">
            {moment(post.date, "MM-DD-YYYY").format("MMM DD, YYYY")}
          </div>
          <CursorTag
            label={
              post.readingTime
                ? `read post · ${post.readingTime} min`
                : "read post"
            }
          >
            <Link
              href={`/writing/${post.id}`}
              className="block hover:underline"
            >
              {post.title}
            </Link>
          </CursorTag>
        </li>
      ))}
    </ul>
  );
};

export default PostList;
