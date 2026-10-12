import PostList from "@/app/writing/components/PostList";
import SectionHeader from "@/components/Sections/SectionHeader";
import { getAllPosts } from "@/lib/blogs";

export default function LatestPosts() {
  return (
    <div>
      <SectionHeader title="Writing" href="/writing" className="mb-4" />
      <PostList posts={getAllPosts()} />
    </div>
  );
}
