import { list, del, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export interface PhotoMetadata {
  url: string;
  filename: string;
  location: string;
  lng?: number;
  lat?: number;
  date: string;
}

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
  // Delete old metadata blob if it exists
  const { blobs } = await list({ prefix: METADATA_KEY });
  for (const blob of blobs) {
    await del(blob.url);
  }
  // Save new one
  await put(METADATA_KEY, JSON.stringify(metadata), {
    access: "public",
    contentType: "application/json",
  });
}

function isAuthorized(request: NextRequest): boolean {
  const password = request.headers.get("x-upload-password");
  return password === process.env.UPLOAD_PASSWORD;
}

// GET: List all photos
export async function GET() {
  try {
    const metadata = await getMetadata();
    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 },
    );
  }
}

// DELETE: Remove a photo
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await request.json();
    // Delete the blob (ignore errors if already deleted)
    try { await del(url); } catch {}
    // Update metadata
    const metadata = await getMetadata();
    const updated = metadata.filter((p) => p.url !== url);
    await saveMetadata(updated);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 },
    );
  }
}
