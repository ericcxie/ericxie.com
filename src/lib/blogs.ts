import fs from "fs";
import matter from "gray-matter";
import moment from "moment";
import path from "path";
import { renderBlogMarkdown } from "@/lib/blog-markdown-html";
import { PostItem } from "@/types";

const postsDirectory = path.join(process.cwd(), "src", "content", "blog");

const getSortedPosts = (): PostItem[] => {
  const fileNames = fs.readdirSync(postsDirectory);

  const allPostsData = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, "");

    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    const matterResult = matter(fileContents);

    return {
      id,
      title: matterResult.data.title,
      date: matterResult.data.date,
      category: matterResult.data.category,
      readingTime: calculateReadingTime(matterResult.content),
    };
  });

  return allPostsData.sort((a, b) => {
    const format = "DD-MM-YYYY";
    const dateA = moment(a.date, format);
    const dateB = moment(b.date, format);
    if (dateA.isBefore(dateB)) {
      return -1;
    } else if (dateA.isAfter(dateB)) {
      return 1;
    } else {
      return 0;
    }
  });
};

export const getAllPosts = (): PostItem[] => getSortedPosts();

export const getCategorizedPosts = (): Record<string, PostItem[]> => {
  const sortedPosts = getSortedPosts();
  const categorizedPosts: Record<string, PostItem[]> = {};

  sortedPosts.forEach((post) => {
    if (!categorizedPosts[post.category]) {
      categorizedPosts[post.category] = [];
    }
    categorizedPosts[post.category].push(post);
  });
  return categorizedPosts;
};

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

  const contentHtml = await renderBlogMarkdown(matterResult.content);
  const readingTime = calculateReadingTime(matterResult.content);

  return {
    id,
    contentHtml,
    title: matterResult.data.title,
    category: matterResult.data.category,
    date: moment(matterResult.data.date, "MM-DD-YYYY").format("MMMM Do, YYYY"),
    readingTime,
  };
};
