import { PhotoGallery } from "@/components/ui/PhotoGallery";
import { photoSrc, photos } from "@/lib/photos";

export default function Photos() {
  const allPhotos = photos.map((photo) => ({
    image: photoSrc(photo.filename),
    location: photo.location,
    date: photo.date,
  }));

  return (
    <main className="flex flex-col gap-4">
      <h1
        className="animate-in font-system text-3xl font-bold"
        style={{ "--index": 1 } as React.CSSProperties}
      >
        Photos
      </h1>
      <p
        className="animate-in text-text-light-headerLight dark:text-text-dark-body"
        style={{ "--index": 2 } as React.CSSProperties}
      >
        I like to capture the little moments in my life
      </p>
      <div
        className="animate-in"
        style={{ "--index": 3 } as React.CSSProperties}
      >
        {allPhotos.length > 0 ? (
          <PhotoGallery photosWithLocations={allPhotos} />
        ) : (
          <p className="italic text-text-light-body dark:text-text-dark-body">
            Stay tuned!
          </p>
        )}
      </div>
    </main>
  );
}
