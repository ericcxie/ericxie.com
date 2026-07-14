import PlacesMap from "@/components/ui/PlacesMap";
import photosData from "@/content/photos/photos.json";
import { locationCoordinates, type Place } from "@/content/photos/locations";

type RawPhoto = {
  filename: string;
  date: string;
  location: string;
  lng?: number;
  lat?: number;
};

// Prefer coordinates stored on the photo (geocoded at sync time), then fall
// back to the hardcoded lookup for older entries. Returns null if unknown.
function coordsFor(photo: RawPhoto): [number, number] | null {
  if (photo.lng != null && photo.lat != null) return [photo.lng, photo.lat];
  return locationCoordinates[photo.location] ?? null;
}

function getPlaces(): Place[] {
  const byLocation = new Map<string, Place>();

  (photosData as RawPhoto[])
    .filter((p) => p.location && coordsFor(p))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach((photo) => {
      const image = `/img/photos/${photo.filename}`;
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
      <p className="mb-3 text-sm text-text-light-body dark:text-text-dark-body md:text-base">
        A map of places I&apos;ve been. Hover a pin to peek, click to see more.
      </p>
      <PlacesMap places={places} />
    </>
  );
}
