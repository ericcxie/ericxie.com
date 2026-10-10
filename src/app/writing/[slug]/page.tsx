import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import type { Metadata } from "next";
import { getAllPosts, getPostData } from "@/lib/blogs";
import PostBody from "../components/PostBody";

type Params = { params: { slug: string } };

// Posts are pre-built at deploy; an unknown slug is a 404 rather than a crash
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts()
    .filter((post) => post.id !== ".gitkeep")
    .map((post) => ({ slug: post.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getPostData(params.slug);
  return { title: `${post.title} · Eric Xie` };
}

const Post = async ({ params }: Params) => {
  const postData = await getPostData(params.slug);

  return (
    <section className="flex flex-col gap-8">
      <Link
        href="/writing"
        className="group flex w-fit items-center gap-1 text-sm text-text-light-body transition-colors hover:text-text-light-headerLight dark:text-text-dark-headerDark dark:hover:text-text-dark-header"
      >
        <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Writing
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{postData.title}</h1>
        <p className="mt-1 text-sm text-text-light-body dark:text-text-dark-headerDark">
          {postData.date} · {postData.readingTime} min read
        </p>
      </div>
      <PostBody html={postData.contentHtml} />
    </section>
  );
};

export default Post;
