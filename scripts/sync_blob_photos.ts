/**
 * Sync script: downloads new photos from Vercel Blob to public/img/photos/
 * and updates photos.json. After syncing, removes the photos from blob.
 *
 * Used by the GitHub Action to automatically pull uploaded photos into the repo.
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=xxx npx tsx scripts/sync_blob_photos.ts
 */

import { list, del, put } from "@vercel/blob";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { locationCoordinates } from "../src/content/photos/locations";

interface PhotoEntry {
  filename: string;
  date: string;
  location: string;
  lng?: number;
  lat?: number;
}

const MAPBOX_TOKEN =
  process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

/**
 * Resolve a location string to [lng, lat] via the Mapbox Geocoding API.
 * Returns null on failure so a single bad lookup never breaks the sync.
 */
async function geocode(location: string): Promise<[number, number] | null> {
  if (!MAPBOX_TOKEN) {
    console.warn("No Mapbox token set — skipping geocoding.");
    return null;
  }
  try {
    const url =
      `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(location)}` +
      `&limit=1&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Geocode failed for "${location}": ${res.status}`);
      return null;
    }
    const data = await res.json();
    const coords = data?.features?.[0]?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      return [coords[0], coords[1]]; // [lng, lat]
    }
    console.warn(`No geocode result for "${location}"`);
    return null;
  } catch (err) {
    console.error(`Geocode error for "${location}":`, err);
    return null;
  }
}

interface BlobMetadataEntry {
  url: string;
  filename: string;
  location: string;
  date: string;
}

const PHOTOS_DIR = join(process.cwd(), "public", "img", "photos");
const PHOTOS_JSON = join(
  process.cwd(),
  "src",
  "content",
  "photos",
  "photos.json",
);
const METADATA_KEY = "photos-metadata.json";

async function getBlobMetadata(): Promise<BlobMetadataEntry[]> {
  const { blobs } = await list({ prefix: METADATA_KEY });
  if (blobs.length === 0) return [];
  const res = await fetch(blobs[0].url);
  return res.json();
}

async function sync() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Missing BLOB_READ_WRITE_TOKEN");
    process.exit(1);
  }

  // Read current local photos
  let localPhotos: PhotoEntry[] = [];
  if (existsSync(PHOTOS_JSON)) {
    localPhotos = JSON.parse(readFileSync(PHOTOS_JSON, "utf-8"));
  }
  const localFilenames = new Set(localPhotos.map((p) => p.filename));

  // Get blob metadata
  const blobMetadata = await getBlobMetadata();
  if (blobMetadata.length === 0) {
    console.log("No photos in blob to sync.");
    return;
  }

  // Find new photos (in blob but not in local)
  const newPhotos = blobMetadata.filter((b) => !localFilenames.has(b.filename));

  if (newPhotos.length === 0) {
    console.log("All blob photos already synced locally.");
    return;
  }

  // Ensure photos directory exists
  if (!existsSync(PHOTOS_DIR)) {
    mkdirSync(PHOTOS_DIR, { recursive: true });
  }

  // Download new photos
  console.log(`Syncing ${newPhotos.length} new photo(s)...`);
  const syncedEntries: PhotoEntry[] = [];

  for (const photo of newPhotos) {
    try {
      const res = await fetch(photo.url);
      if (!res.ok) {
        console.error(`Failed to download ${photo.filename}: ${res.status}`);
        continue;
      }
      const buffer = new Uint8Array(await res.arrayBuffer());
      const destPath = join(PHOTOS_DIR, photo.filename);
      writeFileSync(destPath, buffer);
      console.log(`Downloaded: ${photo.filename}`);

      syncedEntries.push({
        filename: photo.filename,
        date: photo.date,
        location: photo.location,
      });
    } catch (err) {
      console.error(`Error downloading ${photo.filename}:`, err);
    }
  }

  // Resolve coordinates for each distinct location, reusing any we already
  // know (from existing photos.json entries or the hardcoded lookup) so we
  // only ever hit the geocoding API for genuinely new places.
  const coordCache = new Map<string, [number, number]>();
  for (const p of localPhotos) {
    if (p.location && p.lng != null && p.lat != null) {
      coordCache.set(p.location, [p.lng, p.lat]);
    }
  }
  for (const [loc, coords] of Object.entries(locationCoordinates)) {
    if (!coordCache.has(loc)) coordCache.set(loc, coords);
  }

  for (const entry of syncedEntries) {
    if (!entry.location) continue;
    let coords = coordCache.get(entry.location);
    if (!coords) {
      const geocoded = await geocode(entry.location);
      if (geocoded) {
        coords = geocoded;
        coordCache.set(entry.location, geocoded);
        console.log(
          `Geocoded "${entry.location}" -> [${geocoded[0]}, ${geocoded[1]}]`,
        );
      }
    }
    if (coords) {
      entry.lng = coords[0];
      entry.lat = coords[1];
    }
  }

  if (syncedEntries.length === 0) {
    console.log("No new photos were downloaded.");
    return;
  }

  // Update photos.json — prepend new photos, sort by date
  const allPhotos = [...syncedEntries, ...localPhotos].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  writeFileSync(PHOTOS_JSON, JSON.stringify(allPhotos, null, 2) + "\n");
  console.log(`Updated photos.json (${allPhotos.length} total photos)`);

  // Clean up: remove synced photos from blob and clear blob metadata
  for (const photo of newPhotos) {
    try {
      await del(photo.url);
    } catch {}
  }

  // Update blob metadata to only keep un-synced entries
  const remainingBlob = blobMetadata.filter(
    (b) => !syncedEntries.some((s) => s.filename === b.filename),
  );

  const { blobs: metaBlobs } = await list({ prefix: METADATA_KEY });
  for (const blob of metaBlobs) {
    await del(blob.url);
  }

  if (remainingBlob.length > 0) {
    await put(METADATA_KEY, JSON.stringify(remainingBlob), {
      access: "public",
      contentType: "application/json",
    });
  }

  console.log(
    `Cleaned up blob storage. ${remainingBlob.length} entries remaining.`,
  );
  console.log(`\nSync complete! ${syncedEntries.length} new photo(s) added.`);
}

sync();
