"use client";

import { useEffect, useRef, useState } from "react";
import {
  retrievePlace,
  suggestPlaces,
  type PickedPlace,
  type PlaceSuggestion,
} from "@/lib/places";

// Text input with place autocomplete. Typing clears the coordinates; picking a
// suggestion sets the label and its coordinates together, so the saved
// location always points at a real place.
export default function LocationInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (place: PickedPlace) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const [open, setOpen] = useState(false);
  const sessionToken = useRef(crypto.randomUUID());
  // Bumped on every keystroke so a slow retrieve can't clobber newer input.
  const editVersion = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      suggestPlaces(q, sessionToken.current, controller.signal)
        .then((results) => {
          setSuggestions(results);
          setHighlighted(0);
        })
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const pick = async (s: PlaceSuggestion) => {
    setOpen(false);
    setSuggestions([]);
    onChange({ location: s.label });
    const version = ++editVersion.current;
    const coords = await retrievePlace(s.id, sessionToken.current);
    sessionToken.current = crypto.randomUUID();
    if (coords && version === editVersion.current) {
      onChange({ location: s.label, lng: coords[0], lat: coords[1] });
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          editVersion.current++;
          setQuery(e.target.value);
          setOpen(true);
          onChange({ location: e.target.value });
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((i) => (i + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted(
              (i) => (i - 1 + suggestions.length) % suggestions.length,
            );
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(suggestions[highlighted]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Search for a place"
        autoComplete="off"
        className="w-full rounded border border-neutral-300 bg-transparent px-2 py-1 text-xs outline-none focus:border-neutral-500 dark:border-neutral-700 dark:focus:border-neutral-500"
        autoFocus={autoFocus}
      />
      {showList && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {suggestions.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                // mousedown fires before the input's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex w-full flex-col px-2 py-1.5 text-left text-xs ${
                  i === highlighted ? "bg-neutral-100 dark:bg-neutral-800" : ""
                }`}
              >
                <span className="truncate">{s.name}</span>
                {s.detail && (
                  <span className="truncate text-neutral-400">{s.detail}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
