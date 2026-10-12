import PlacesGlobe from "@/components/ui/PlacesGlobe";
import { locationCoordinates, type Place } from "@/content/photos/locations";
import { photoSrc, photos } from "@/lib/photos";
import type { PhotoEntry } from "@/types";

// Prefer coordinates stored on the photo (geocoded at sync time), then fall
// back to the hardcoded lookup for older entries. Returns null if unknown.
function coordsFor(photo: PhotoEntry): [number, number] | null {
  if (photo.lng != null && photo.lat != null) return [photo.lng, photo.lat];
  return locationCoordinates[photo.location] ?? null;
}

function getPlaces(): Place[] {
  const byLocation = new Map<string, Place>();

  photos
    .filter((p) => p.location && coordsFor(p))
    .forEach((photo) => {
      const image = photoSrc(photo.filename);
      const existing = byLocation.get(photo.location);
      if (existing) {
        existing.count += 1;
        existing.photos.push({ image, date: photo.date });
        return;
      }
      const [lng, lat] = coordsFor(photo)!;
      byLocation.set(photo.location, {
        location: photo.location,
        lng,
        lat,
        image,
        date: photo.date,
        count: 1,
        photos: [{ image, date: photo.date }],
      });
    });

  return Array.from(byLocation.values());
}

export default function Current() {
  const places = getPlaces();

  return (
    <>
      <h1 className="mb-1 text-xl font-bold">Places I&apos;ve Been</h1>
      <p className="mb-3 text-sm text-text-light-headerLight dark:text-text-dark-body md:text-base">
        Here&apos;s a map of some places I&apos;ve taken my camera.
      </p>
      <PlacesGlobe places={places} />
    </>
  );
}
