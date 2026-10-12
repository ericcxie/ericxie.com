import { put, list, del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, unauthorized } from "@/lib/server/auth";
import { dispatchPhotoSync } from "@/lib/server/github";
import type { PhotoMetadata } from "@/types";

const METADATA_KEY = "photos-metadata.json";

async function getMetadata(): Promise<PhotoMetadata[]> {
  try {
    const { blobs } = await list({ prefix: METADATA_KEY });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url);
    return await res.json();
  } catch {
    return [];
  }
}

async function saveMetadata(metadata: PhotoMetadata[]) {
  const { blobs } = await list({ prefix: METADATA_KEY });
  for (const blob of blobs) {
    await del(blob.url);
  }
  await put(METADATA_KEY, JSON.stringify(metadata), {
    access: "public",
    contentType: "application/json",
  });
}

async function triggerSync() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("triggerSync: GITHUB_TOKEN is not set");
    return;
  }
  const res = await dispatchPhotoSync(token);
  if (!res.ok) {
    const body = await res.text();
    console.error(`triggerSync failed: ${res.status} ${res.statusText}`, body);
  }
}

// POST: Save metadata for newly uploaded photos (called once after all uploads finish)
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const newPhotos: PhotoMetadata[] = await request.json();

    if (!Array.isArray(newPhotos) || newPhotos.length === 0) {
      return NextResponse.json(
        { error: "No photo metadata provided" },
        { status: 400 },
      );
    }

    const metadata = await getMetadata();
    metadata.unshift(...newPhotos);
    await saveMetadata(metadata);

    // Trigger GitHub Action to sync photos to repo
    try {
      await triggerSync();
    } catch (err) {
      console.error("Failed to trigger sync:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Metadata save error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save metadata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
