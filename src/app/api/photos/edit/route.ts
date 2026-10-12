import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { isAuthorized, unauthorized } from "@/lib/server/auth";
import { commitToMain, createBlob, type TreeEntry } from "@/lib/server/github";
import type { PhotoEntry } from "@/types";

const PHOTOS_JSON_PATH = "src/content/photos/photos.json";

interface EditPayload {
  updates: PhotoEntry[];
  deletedFilenames: string[];
}

// GET: Return current photos.json from local filesystem
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), PHOTOS_JSON_PATH);
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read photos.json" },
      { status: 500 },
    );
  }
}

// POST: Commit edits (updated metadata + deleted photos) in a single commit
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
    const { updates, deletedFilenames }: EditPayload = await request.json();

    const newJson = JSON.stringify(updates, null, 2) + "\n";
    const tree: TreeEntry[] = [
      {
        path: PHOTOS_JSON_PATH,
        mode: "100644",
        type: "blob",
        sha: await createBlob(token, newJson),
      },
      ...deletedFilenames.map<TreeEntry>((filename) => ({
        path: `public/img/photos/${filename}`,
        mode: "100644",
        type: "blob",
        sha: null,
      })),
    ];

    const deleted = deletedFilenames.length;
    const message = deleted
      ? `delete ${deleted} photo${deleted > 1 ? "s" : ""}`
      : "update photo metadata";

    const sha = await commitToMain(token, tree, message);
    return NextResponse.json({ success: true, sha });
  } catch (error) {
    console.error("Edit commit error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save changes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
