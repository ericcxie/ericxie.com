"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { renderBlogMarkdown } from "@/lib/blog-markdown-html";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  SquareCode,
  Minus,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BlogPost {
  slug: string;
  title: string;
  category: string;
  date: string;
  content?: string;
}

interface PendingImage {
  filename: string;
  base64: string; // base64 data (no prefix)
}

type View = "list" | "editor";

export default function BlogEditPage() {
  const { password, setPassword, authenticated, loginError, handleLogin, checking, lockedOut } = useAuth();

  const [view, setView] = useState<View>("list");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [original, setOriginal] = useState("");
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog/edit");
      if (res.ok) setPosts(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authenticated) fetchPosts();
  }, [authenticated, fetchPosts]);

  useEffect(() => {
    if (editorTab === "preview") {
      renderBlogMarkdown(content).then((html) => {
          let rendered = html;
          // Replace pending image paths with inline base64 data URIs
          for (const img of pendingImages) {
            const imgPath = `/img/blog/${slug}/${img.filename}`;
            // Detect content type from filename extension
            const ext = img.filename.split(".").pop()?.toLowerCase();
            const mime =
              ext === "png"
                ? "image/png"
                : ext === "gif"
                  ? "image/gif"
                  : ext === "svg"
                    ? "image/svg+xml"
                    : ext === "webp"
                      ? "image/webp"
                      : "image/jpeg";
            const dataUri = `data:${mime};base64,${img.base64}`;
            rendered = rendered.replaceAll(
              `src="${imgPath}"`,
              `src="${dataUri}"`,
            );
          }
          setPreviewHtml(rendered);
        });
    }
  }, [editorTab, content, pendingImages, slug]);

  const openEditor = async (post?: BlogPost) => {
    setPendingImages([]);
    setEditorTab("write");
    if (post) {
      // Edit existing post
      setLoading(true);
      try {
        const res = await fetch(`/api/blog/edit?slug=${post.slug}`);
        if (res.ok) {
          const data = await res.json();
          setSlug(data.slug);
          setTitle(data.title);
          setCategory(data.category);
          setDate(data.date);
          setContent(data.content);
          setIsNew(false);
          setOriginal(
            JSON.stringify({
              slug: data.slug,
              title: data.title,
              category: data.category,
              date: data.date,
              content: data.content,
            }),
          );
        }
      } catch {}
      setLoading(false);
    } else {
      // New post
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const yyyy = today.getFullYear();
      setSlug("");
      setTitle("");
      setCategory("");
      setDate(`${mm}-${dd}-${yyyy}`);
      setContent("");
      setIsNew(true);
      setOriginal("");
    }
    setView("editor");
  };

  const hasChanges = () => {
    const current = JSON.stringify({ slug, title, category, date, content });
    return current !== original || pendingImages.length > 0;
  };

  const savePost = async () => {
    if (!slug.trim() || !title.trim() || !category.trim() || !date.trim()) {
      alert("Please fill in all metadata fields (slug, title, category, date)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/blog/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-upload-password": password,
        },
        body: JSON.stringify({
          slug,
          title,
          category,
          date,
          content,
          images: pendingImages,
        }),
      });
      if (res.ok) {
        setOriginal(
          JSON.stringify({ slug, title, category, date, content }),
        );
        setPendingImages([]);
        setIsNew(false);
        alert("Blog post saved and deployed!");
        await fetchPosts();
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.error}`);
      }
    } catch {
      alert("Failed to save blog post");
    }
    setSaving(false);
  };

  const deletePost = async (postSlug: string, postTitle: string) => {
    if (!confirm(`Delete "${postTitle}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/blog/edit", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-upload-password": password,
        },
        body: JSON.stringify({ slug: postSlug }),
      });
      if (res.ok) {
        alert("Post deleted!");
        await fetchPosts();
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.error}`);
      }
    } catch {
      alert("Failed to delete post");
    }
  };

  // Toolbar actions that wrap selected text or insert at cursor
  const wrapSelection = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${before}${selected}${after}`;
    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = end + before.length;
    });
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const newContent =
      content.substring(0, start) + text + content.substring(start);
    setContent(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    });
  };

  const insertLinePrefix = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    // Find the start of the current line
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const newContent =
      content.substring(0, lineStart) +
      prefix +
      content.substring(lineStart);
    setContent(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + prefix.length;
    });
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === "b") {
      e.preventDefault();
      wrapSelection("**", "**");
    } else if (mod && e.key === "i") {
      e.preventDefault();
      wrapSelection("_", "_");
    } else if (mod && e.key === "k") {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const selected = content.substring(ta.selectionStart, ta.selectionEnd);
      const replacement = `[${selected}](url)`;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent =
        content.substring(0, start) + replacement + content.substring(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        ta.focus();
        // Select "url" for easy replacement
        ta.selectionStart = start + selected.length + 3;
        ta.selectionEnd = start + selected.length + 6;
      });
    }
  };

  // Process dropped/pasted image files
  const handleImageFiles = (files: FileList | File[]) => {
    if (!slug.trim()) {
      alert("Please set a slug before adding images");
      return;
    }
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data:image/...;base64, prefix
        const base64 = result.split(",")[1];
        const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
        const filename = file.name.replace(/\s+/g, "-").toLowerCase();
        const safeName = filename.includes(".")
          ? filename
          : `${filename}.${ext}`;

        setPendingImages((prev) => {
          // Avoid duplicates
          if (prev.some((img) => img.filename === safeName)) return prev;
          return [...prev, { filename: safeName, base64 }];
        });

        // Insert markdown image reference at cursor
        const imgPath = `/img/blog/${slug}/${safeName}`;
        insertAtCursor(`![${safeName}](${imgPath})`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleImageFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleImageFiles(imageFiles);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:focus:border-neutral-500";
  const labelClass =
    "text-xs font-medium text-neutral-500 dark:text-neutral-400";
  const btnClass =
    "rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200";
  const toolbarBtnClass =
    "rounded px-2 py-1 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700";

  // Loading saved auth
  if (checking) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="animate-in font-system text-3xl font-bold" style={{ "--index": 1 } as React.CSSProperties}>
          Edit Blog
        </h1>
        <p className="animate-in text-sm text-neutral-500" style={{ "--index": 2 } as React.CSSProperties}>Loading...</p>
      </main>
    );
  }

  // Login screen
  if (!authenticated) {
    return (
      <main className="flex flex-col gap-4">
        <h1
          className="animate-in font-system text-3xl font-bold"
          style={{ "--index": 1 } as React.CSSProperties}
        >
          Edit Blog
        </h1>
        <form
          onSubmit={handleLogin}
          className="animate-in flex flex-col gap-4"
          style={{ "--index": 2 } as React.CSSProperties}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            disabled={lockedOut}
            className="rounded-lg border border-neutral-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:focus:border-neutral-500"
            autoFocus
          />
          {(loginError || lockedOut) && (
            <p className="text-sm text-red-500">
              {lockedOut ? "Too many failed attempts. Try again in 8760 hours." : loginError}
            </p>
          )}
          <button type="submit" disabled={lockedOut} className={btnClass}>
            Continue
          </button>
        </form>
      </main>
    );
  }

  // Loading
  if (loading && view === "list") {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="animate-in font-system text-3xl font-bold">
          Edit Blog
        </h1>
        <p className="text-sm text-neutral-500">Loading...</p>
      </main>
    );
  }

  // Editor view
  if (view === "editor") {
    return (
      <main className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              if (hasChanges()) {
                if (!confirm("Discard unsaved changes?")) return;
              }
              setView("list");
            }}
            className="w-fit text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            &larr; Back to posts
          </button>
          <div className="flex items-center justify-between">
            <h1 className="font-system text-3xl font-bold">
              {isNew ? "New Post" : "Edit Post"}
            </h1>
            <button
              onClick={savePost}
              disabled={saving || !hasChanges()}
              className={btnClass}
            >
              {saving ? "Saving..." : "Save & Deploy"}
            </button>
          </div>
        </div>

        {/* Metadata fields */}
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Slug (filename)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                      .replace(/-+/g, "-"),
                  )
                }
                className={inputClass}
                placeholder="my-blog-post"
                disabled={!isNew}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="My Blog Post Title"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
                placeholder="e.g. Work, Personal"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={
                      inputClass +
                      " text-left" +
                      (!date
                        ? " text-neutral-400 dark:text-neutral-500"
                        : "")
                    }
                  >
                    {date
                      ? new Date(
                          `${date.slice(6)}-${date.slice(0, 2)}-${date.slice(3, 5)}`,
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Pick a date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      date
                        ? new Date(
                            `${date.slice(6)}-${date.slice(0, 2)}-${date.slice(3, 5)}`,
                          )
                        : undefined
                    }
                    onSelect={(day) => {
                      if (day) {
                        const mm = String(day.getMonth() + 1).padStart(
                          2,
                          "0",
                        );
                        const dd = String(day.getDate()).padStart(2, "0");
                        const yyyy = day.getFullYear();
                        setDate(`${mm}-${dd}-${yyyy}`);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Write / Preview tabs */}
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-0 border-b border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setEditorTab("write")}
              className={
                "px-4 py-2 text-sm font-medium transition-colors " +
                (editorTab === "write"
                  ? "border-b-2 border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300")
              }
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setEditorTab("preview")}
              className={
                "px-4 py-2 text-sm font-medium transition-colors " +
                (editorTab === "preview"
                  ? "border-b-2 border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300")
              }
            >
              Preview
            </button>
          </div>

          {editorTab === "write" ? (
            <>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-0.5 border-x border-neutral-200 px-2 py-1.5 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => wrapSelection("**", "**")}
                  className={toolbarBtnClass}
                  title="Bold (Cmd+B)"
                >
                  <Bold className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => wrapSelection("_", "_")}
                  className={toolbarBtnClass}
                  title="Italic (Cmd+I)"
                >
                  <Italic className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => wrapSelection("~~", "~~")}
                  className={toolbarBtnClass}
                  title="Strikethrough"
                >
                  <Strikethrough className="size-4" />
                </button>
                <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
                <button
                  type="button"
                  onClick={() => insertLinePrefix("# ")}
                  className={toolbarBtnClass}
                  title="Heading 1"
                >
                  <Heading1 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix("## ")}
                  className={toolbarBtnClass}
                  title="Heading 2"
                >
                  <Heading2 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix("### ")}
                  className={toolbarBtnClass}
                  title="Heading 3"
                >
                  <Heading3 className="size-4" />
                </button>
                <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
                <button
                  type="button"
                  onClick={() => insertLinePrefix("- ")}
                  className={toolbarBtnClass}
                  title="Bullet list"
                >
                  <List className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix("1. ")}
                  className={toolbarBtnClass}
                  title="Numbered list"
                >
                  <ListOrdered className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertLinePrefix("> ")}
                  className={toolbarBtnClass}
                  title="Blockquote"
                >
                  <Quote className="size-4" />
                </button>
                <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
                <button
                  type="button"
                  onClick={() => {
                    const ta = textareaRef.current;
                    if (!ta) return;
                    const selected = content.substring(
                      ta.selectionStart,
                      ta.selectionEnd,
                    );
                    const replacement = `[${selected}](url)`;
                    const start = ta.selectionStart;
                    const end = ta.selectionEnd;
                    setContent(
                      content.substring(0, start) +
                        replacement +
                        content.substring(end),
                    );
                    requestAnimationFrame(() => {
                      ta.focus();
                      ta.selectionStart = start + selected.length + 3;
                      ta.selectionEnd = start + selected.length + 6;
                    });
                  }}
                  className={toolbarBtnClass}
                  title="Link (Cmd+K)"
                >
                  <Link className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertAtCursor("![alt text](image-url)")}
                  className={toolbarBtnClass}
                  title="Image"
                >
                  <Image className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => wrapSelection("`", "`")}
                  className={toolbarBtnClass}
                  title="Inline code"
                >
                  <Code className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertAtCursor("\n```\n\n```\n")}
                  className={toolbarBtnClass}
                  title="Code block"
                >
                  <SquareCode className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertAtCursor("\n---\n")}
                  className={toolbarBtnClass}
                  title="Horizontal rule"
                >
                  <Minus className="size-4" />
                </button>
              </div>

              {/* Markdown textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onPaste={handlePaste}
                className="min-h-[500px] w-full resize-y rounded-b-lg border border-t-0 border-neutral-200 bg-transparent px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-neutral-500 dark:border-neutral-800 dark:focus:border-neutral-500"
                placeholder="Write your blog post in markdown..."
              />
              {pendingImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {pendingImages.map((img) => (
                    <div
                      key={img.filename}
                      className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2 py-1 text-xs dark:border-neutral-800"
                    >
                      <Image className="size-3 text-neutral-500" />
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {img.filename}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingImages((prev) =>
                            prev.filter((p) => p.filename !== img.filename),
                          )
                        }
                        className="ml-1 text-neutral-400 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="min-h-[500px] rounded-b-lg border border-t-0 border-neutral-200 p-4 dark:border-neutral-800">
              {previewHtml ? (
                <article
                  className="post"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <p className="text-sm italic text-neutral-400">
                  Nothing to preview
                </p>
              )}
            </div>
          )}
        </div>

        {hasChanges() && (
          <button onClick={savePost} disabled={saving} className={btnClass}>
            {saving ? "Saving..." : "Save & Deploy"}
          </button>
        )}
      </main>
    );
  }

  // Post list view
  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1
          className="animate-in font-system text-3xl font-bold"
          style={{ "--index": 1 } as React.CSSProperties}
        >
          Edit Blog
        </h1>
        <button
          onClick={() => openEditor()}
          className={
            "animate-in " + btnClass
          }
          style={{ "--index": 1 } as React.CSSProperties}
        >
          + New Post
        </button>
      </div>

      <div
        className="animate-in flex flex-col gap-2"
        style={{ "--index": 2 } as React.CSSProperties}
      >
        {posts.length === 0 ? (
          <p className="text-sm italic text-neutral-500">No posts yet.</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.slug}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{post.title}</span>
                <span className="text-xs text-neutral-500">
                  {post.category} &middot; {post.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditor(post)}
                  className="rounded px-3 py-1 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePost(post.slug, post.title)}
                  className="rounded px-3 py-1 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
