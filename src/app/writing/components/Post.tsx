import Link from "next/link";
import type { PostItem } from "@/types";
import moment from "moment";
interface Props {
  category: string;
  posts: PostItem[];
}

const Post = ({ category, posts }: Props) => {
  return (
    <div>
      {posts.map((post, id) => (
        <div
          key={id}
          className="flex items-start justify-start gap-4 md:gap-10"
        >
          <div className="w-24 flex-shrink-0 text-sm text-text-light-body dark:text-text-dark-headerDark md:w-32 md:text-base">
            {moment(post.date, "MM-DD-YYYY").format("MMM DD, YYYY")}
          </div>
          <Link href={`/writing/${post.id}`} className="block hover:underline">
            {post.title}
          </Link>
        </div>
      ))}
    </div>
  );
};

export default Post;
