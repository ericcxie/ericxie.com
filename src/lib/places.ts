// Client-side place search for the photo upload/edit pages, backed by the
// Mapbox Search Box API (suggest -> retrieve) and Geocoding v6 (reverse).

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const SEARCH_BASE = "https://api.mapbox.com/search/searchbox/v1";

// Outdoor POIs worth photographing; other POIs (shops, restaurants) are noise.
const NATURE_CATEGORIES = [
  "park",
  "national_park",
  "nature_reserve",
  "lake",
  "beach",
  "mountain",
  "island",
  "waterfall",
  "viewpoint",
  "campground",
].join(",");
const EXCLUDED_CATEGORIES = new Set(["playground", "field"]);

export type PlaceSuggestion = {
  id: string;
  name: string;
  detail: string; // secondary line shown in the dropdown
  label: string; // what gets saved as the photo's location
};

export type PickedPlace = {
  location: string;
  lng?: number;
  lat?: number;
};

type MapboxContext = {
  region?: { name: string };
  country?: { name: string; country_code: string };
};

// "Kyoto, Japan" everywhere, except US places use the state ("Miami, Florida").
function formatLabel(name: string, context: MapboxContext = {}): string {
  const suffix =
    context.country?.country_code === "US"
      ? context.region?.name
      : context.country?.name;
  return suffix && suffix !== name ? `${name}, ${suffix}` : name;
}

async function suggestOnce(
  query: string,
  sessionToken: string,
  filter: string,
  signal: AbortSignal,
): Promise<any[]> {
  const res = await fetch(
    `${SEARCH_BASE}/suggest?q=${encodeURIComponent(query)}&language=en&limit=5` +
      `&session_token=${sessionToken}&access_token=${TOKEN}${filter}`,
    { signal },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions ?? [];
}

export async function suggestPlaces(
  query: string,
  sessionToken: string,
  signal: AbortSignal,
): Promise<PlaceSuggestion[]> {
  if (!TOKEN) return [];
  const [places, nature] = await Promise.all([
    suggestOnce(
      query,
      sessionToken,
      "&types=country,region,place,locality,neighborhood",
      signal,
    ),
    suggestOnce(
      query,
      sessionToken,
      `&types=poi&poi_category=${NATURE_CATEGORIES}`,
      signal,
    ),
  ]);

  const natureFiltered = nature.filter(
    (s) =>
      !(s.poi_category_ids ?? []).some((c: string) =>
        EXCLUDED_CATEGORIES.has(c),
      ),
  );

  const seen = new Set<string>();
  const results: PlaceSuggestion[] = [];
  for (const s of [...places.slice(0, 4), ...natureFiltered.slice(0, 3)]) {
    const label = formatLabel(s.name, s.context);
    if (seen.has(label)) continue; // e.g. Kyoto the city vs. the prefecture
    seen.add(label);
    results.push({
      id: s.mapbox_id,
      name: s.name,
      detail: s.place_formatted ?? "",
      label,
    });
  }

  // Fuzzy place matches ("Lakeside" for "joffre lakes") shouldn't outrank a
  // park or lake whose name actually starts with what was typed.
  const q = query.toLowerCase();
  const startsWithQuery = (s: PlaceSuggestion) =>
    s.name.toLowerCase().startsWith(q) ? 0 : 1;
  return results.sort((a, b) => startsWithQuery(a) - startsWithQuery(b));
}

export async function retrievePlace(
  id: string,
  sessionToken: string,
): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `${SEARCH_BASE}/retrieve/${encodeURIComponent(id)}` +
        `?session_token=${sessionToken}&access_token=${TOKEN}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.features?.[0]?.geometry?.coordinates;
    return Array.isArray(coords) && coords.length === 2
      ? [coords[0], coords[1]]
      : null;
  } catch {
    return null;
  }
}

// Name the city a GPS-tagged photo was taken in, using the same label format
// as the autocomplete so both paths produce matching location strings.
export async function reverseGeocode(lng: number, lat: number): Promise<string> {
  if (!TOKEN) return "";
  try {
    const res = await fetch(
      `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}` +
        `&types=place&language=en&access_token=${TOKEN}`,
    );
    if (!res.ok) return "";
    const data = await res.json();
    const props = data?.features?.[0]?.properties;
    return props ? formatLabel(props.name, props.context) : "";
  } catch {
    return "";
  }
}
