import fs from "fs";
import path from "path";
import type { Element, Root, RootContent } from "hast";
import { imageSize } from "image-size";

/**
 * Gives local images (served from /public) their real width and height, so the
 * browser reserves the right space before they download and the text below
 * doesn't jump. Lazy-loads all but the first.
 *
 * Server-only (reads from disk), so it lives apart from blog-markdown-html,
 * which the editor's live preview also runs in the browser.
 */
export function rehypeImageSizes() {
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
