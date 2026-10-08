import Post from "./Post";
import type { PostItem } from "@/types";

interface Props {
  posts: Record<string, PostItem[]>;
}

const PostList = ({ posts }: Props) => {
  const allPosts = Object.entries(posts).flatMap(([category, postItems]) =>
    postItems.map((postItem) => ({ ...postItem, category })),
  );

  allPosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (allPosts[0].id === ".gitkeep") {
    return (
      <div className="italic text-text-light-body dark:text-text-dark-body">
        Stay tuned!
      </div>
    );
  }

  return (
    <ul className="animated-list">
      {allPosts.map((post, index) => (
        <li key={index}>
          <Post category={post.category} posts={[post]} key={index} />
        </li>
      ))}
    </ul>
  );
};

export default PostList;
