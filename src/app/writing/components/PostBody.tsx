"use client";

import { useEffect, useRef } from "react";

// Post images show a pulsing placeholder (see `.post img` in globals.css)
// until they finish loading; this marks each one done so the placeholder
// stops and transparent images don't sit on a grey box.
const PostBody = ({ html }: { html: string }) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const article = ref.current;
    if (!article) return;
    const mark = (img: HTMLImageElement) => (img.dataset.loaded = "");
    // Images that finished before hydration won't fire `load` again
    article.querySelectorAll("img").forEach((img) => {
      if (img.complete) mark(img);
    });
    // `load` and `error` don't bubble, so listen in the capture phase
    const onDone = (e: Event) => {
      if (e.target instanceof HTMLImageElement) mark(e.target);
    };
    article.addEventListener("load", onDone, true);
    article.addEventListener("error", onDone, true);
    return () => {
      article.removeEventListener("load", onDone, true);
      article.removeEventListener("error", onDone, true);
    };
  }, [html]);

  return (
    <article
      ref={ref}
      className="post"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default PostBody;
