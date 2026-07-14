// Coordinates for the places that appear in photos.json.
// Keyed by the exact `location` string used in that file.
export const locationCoordinates: Record<string, [number, number]> = {
  "Kamakura, Japan": [139.5467, 35.3192],
  "Kyoto, Japan": [135.7681, 35.0116],
  "Miami, Florida": [-80.1918, 25.7617],
  "Nassau, Bahamas": [-77.3504, 25.0443],
  "New York City, New York": [-74.006, 40.7128],
  "Point Reyes, US": [-122.8067, 38.07],
  "Tokyo, Japan": [139.6503, 35.6762],
  "Venice, Italy": [12.3155, 45.4408],
  "Walensee, Switzerland": [9.2, 47.12],
};

export type PlacePhoto = {
  image: string;
  date: string;
};

export type Place = {
  location: string;
  lng: number;
  lat: number;
  image: string; // representative (most recent) photo, used for the pin
  count: number; // how many photos taken here
  date: string; // date of the representative photo
  photos: PlacePhoto[]; // all photos from this place, newest first
};
