import fs from "fs";
import path from "path";
import type { Element, Root, RootContent } from "hast";
import { defaultSchema } from "hast-util-sanitize";
import { imageSize } from "image-size";
import type { Schema } from "hast-util-sanitize";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

/**
 * Only official YouTube embed URLs (including privacy-enhanced nocookie host).
 * Matches paths like /embed/VIDEO_ID and /embed/videoseries with optional query/hash.
 */
const youtubeEmbedSrc =
  /^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\/[a-zA-Z0-9_-]+(\?[^\s#]*)?(#[^\s]*)?$/;

/**
 * GitHub-style sanitizer (via hast-util-sanitize) plus YouTube iframes.
 * Used after `rehype-raw` so markdown HTML blocks become real elements first.
 */
export const blogMarkdownHtmlSchema: Schema = {
  tagNames: [...(defaultSchema.tagNames ?? []), "iframe"],
  attributes: {
    ...defaultSchema.attributes,
    iframe: [
      ["src", youtubeEmbedSrc],
      "allow",
      "allowFullScreen",
      "allowfullscreen",
      "referrerPolicy",
      "referrerpolicy",
      "loading",
      "frameBorder",
      "frameborder",
    ],
  },
};

/**
 * Gives local images (served from /public) their real width and height, so the
 * browser reserves the right space before they download and the text below
 * doesn't jump. Lazy-loads all but the first.
 */
function rehypeImageSizes() {
  return (tree: Root) => {
    let seen = 0;
    const walk = (node: Root | RootContent) => {
      if (node.type === "element" && node.tagName === "img") sizeImage(node);
      if ("children" in node) node.children.forEach(walk);
    };
    const sizeImage = (img: Element) => {
      const src = img.properties.src;
      img.properties.decoding = "async";
      if (seen++ > 0) img.properties.loading = "lazy";
      if (typeof src !== "string" || !src.startsWith("/")) return;
      try {
        const file = fs.readFileSync(path.join(process.cwd(), "public", src));
        const { width, height } = imageSize(file);
        img.properties.width = width;
        img.properties.height = height;
      } catch {
        // Missing or unreadable file: leave it unsized rather than fail the build
      }
    };
    walk(tree);
  };
}

/**
 * Markdown → safe HTML. Raw HTML in markdown is parsed (`rehype-raw`) then
 * sanitized; YouTube embeds are kept, other dangerous markup is stripped.
 */
export async function renderBlogMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, blogMarkdownHtmlSchema)
    .use(rehypeImageSizes)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
