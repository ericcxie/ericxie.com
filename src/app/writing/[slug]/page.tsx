import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { getPostData } from "@/lib/blogs";

const Post = async ({ params }: { params: { slug: string } }) => {
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
      <article
        className="post"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
      />
    </section>
  );
};

export default Post;
