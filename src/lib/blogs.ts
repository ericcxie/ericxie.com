import fs from "fs";
import matter from "gray-matter";
import moment from "moment";
import path from "path";
import { renderBlogMarkdown } from "@/lib/blog-markdown-html";
import { rehypeImageSizes } from "@/lib/rehype-image-sizes";
import { PostItem } from "@/types";

const postsDirectory = path.join(process.cwd(), "src", "content", "blog");

const DATE_FORMAT = "MM-DD-YYYY";

// Newest first
export const getAllPosts = (): PostItem[] =>
  fs
    .readdirSync(postsDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const fileContents = fs.readFileSync(
        path.join(postsDirectory, fileName),
        "utf8",
      );
      const matterResult = matter(fileContents);

      return {
        id: fileName.replace(/\.md$/, ""),
        title: matterResult.data.title,
        date: matterResult.data.date,
        category: matterResult.data.category,
        readingTime: calculateReadingTime(matterResult.content),
      };
    })
    .sort(
      (a, b) =>
        moment(b.date, DATE_FORMAT).valueOf() -
        moment(a.date, DATE_FORMAT).valueOf(),
    );

// Calculate reading time based on word count
const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 225;
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime > 0 ? readingTime : 1;
};

export const getPostData = async (id: string) => {
  const fullPath = path.join(postsDirectory, `${id}.md`);

  const fileContents = fs.readFileSync(fullPath, "utf8");

  const matterResult = matter(fileContents);

  const contentHtml = await renderBlogMarkdown(matterResult.content, [
    rehypeImageSizes,
  ]);
  const readingTime = calculateReadingTime(matterResult.content);

  return {
    id,
    contentHtml,
    title: matterResult.data.title,
    category: matterResult.data.category,
    date: moment(matterResult.data.date, DATE_FORMAT).format("MMMM Do, YYYY"),
    readingTime,
  };
};
