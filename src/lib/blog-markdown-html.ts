import { defaultSchema } from "hast-util-sanitize";
import type { Schema } from "hast-util-sanitize";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import type { PluggableList } from "unified";

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
 * Markdown → safe HTML. Raw HTML in markdown is parsed (`rehype-raw`) then
 * sanitized; YouTube embeds are kept, other dangerous markup is stripped.
 * `extra` rehype plugins run on the sanitized tree, e.g. server-only ones.
 */
export async function renderBlogMarkdown(
  markdown: string,
  extra: PluggableList = [],
): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, blogMarkdownHtmlSchema)
    .use(extra)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
