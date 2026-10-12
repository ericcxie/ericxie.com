import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isAuthorized, unauthorized } from "@/lib/server/auth";
import {
  commitToMain,
  createBlob,
  deleteFile,
  type TreeEntry,
} from "@/lib/server/github";

const BLOG_DIR = "src/content/blog";

// GET: Return list of posts or a single post's raw markdown
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const postsDirectory = path.join(process.cwd(), BLOG_DIR);

  try {
    if (slug) {
      const filePath = path.join(postsDirectory, `${slug}.md`);
      const content = fs.readFileSync(filePath, "utf-8");
      const { data, content: markdown } = matter(content);
      return NextResponse.json({
        slug,
        title: data.title,
        category: data.category,
        date: data.date,
        content: markdown.trim(),
      });
    }

    // Return all posts
    const fileNames = fs.readdirSync(postsDirectory);
    const posts = fileNames
      .filter((f) => f.endsWith(".md"))
      .map((fileName) => {
        const id = fileName.replace(/\.md$/, "");
        const filePath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(filePath, "utf-8");
        const { data } = matter(fileContents);
        return {
          slug: id,
          title: data.title,
          category: data.category,
          date: data.date,
        };
      });

    return NextResponse.json(posts);
  } catch {
    return NextResponse.json(
      { error: "Failed to read blog posts" },
      { status: 500 },
    );
  }
}

// POST: Create or update a blog post via GitHub API
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 },
    );
  }

  try {
    const { slug, title, category, date, content, images } =
      await request.json();

    if (!slug || !title || !category || !date || content === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const frontmatter = `---\ntitle: "${title}"\n\ncategory: "${category}"\n\ndate: "${date}"\n---\n\n${content}\n`;

    const filePath = `${BLOG_DIR}/${slug}.md`;

    const tree: TreeEntry[] = [
      {
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: await createBlob(token, frontmatter),
      },
    ];

    if (images && Array.isArray(images)) {
      for (const img of images as { filename: string; base64: string }[]) {
        tree.push({
          path: `public/img/blog/${slug}/${img.filename}`,
          mode: "100644",
          type: "blob",
          sha: await createBlob(token, img.base64, "base64"),
        });
      }
    }

    const isNew = !fs.existsSync(path.join(process.cwd(), filePath));
    const sha = await commitToMain(
      token,
      tree,
      `${isNew ? "add" : "update"} blog post: ${title}`,
    );

    return NextResponse.json({ success: true, sha });
  } catch (error) {
    console.error("Blog edit commit error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save blog post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Delete a blog post via GitHub API
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GitHub token not configured" },
      { status: 500 },
    );
  }

  try {
    const { slug } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const found = await deleteFile(
      token,
      `${BLOG_DIR}/${slug}.md`,
      `delete blog post: ${slug}`,
    );
    if (!found) {
      return NextResponse.json(
        { error: "File not found on GitHub" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete blog post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
