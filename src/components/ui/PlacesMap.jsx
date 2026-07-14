"use client";

import React, { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import PhotoLightbox from "@/components/ui/PhotoLightbox";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function PlacesMap({ places, zoom = 1.4, pitch = 20 }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  const [activePlace, setActivePlace] = useState(null);
  // Keep the latest setter reachable from marker click handlers created once.
  const openPlace = useRef(setActivePlace);
  openPlace.current = setActivePlace;

  const { resolvedTheme } = useTheme();
  const mapTheme = resolvedTheme === "dark" ? "night" : "light";

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      center: [10, 30],
      zoom,
      pitch,
      projection: "globe",
      attributionControl: false,
    });

    // Slowly spin the globe; pause on user interaction, resume after idle.
    const secondsPerRevolution = 120;
    let userInteracting = false;

    const spinGlobe = () => {
      if (!map.current || userInteracting || map.current.getZoom() > 4) return;
      const center = map.current.getCenter();
      center.lng -= 360 / secondsPerRevolution;
      map.current.easeTo({ center, duration: 1000, easing: (n) => n });
    };

    map.current.on("mousedown", () => {
      userInteracting = true;
    });
    map.current.on("dragstart", () => {
      userInteracting = true;
    });
    map.current.on("moveend", () => {
      // `moveend` fires after each eased spin step, chaining the animation.
      spinGlobe();
    });
    ["mouseup", "touchend", "dragend"].forEach((evt) =>
      map.current.on(evt, () => {
        userInteracting = false;
        spinGlobe();
      }),
    );

    // Route images through Next's optimizer so we load small, resized
    // versions instead of the multi-MB originals.
    const optimized = (src, width, quality = 70) =>
      `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;

    map.current.on("style.load", () => {
      map.current.setConfigProperty("basemap", "lightPreset", mapTheme);
      spinGlobe();

      places.forEach((place) => {
        // Circular photo thumbnail as the marker (44px, so 96px covers 2x).
        const el = document.createElement("button");
        el.className = "place-marker";
        el.setAttribute("aria-label", `Photos from ${place.location}`);
        el.style.backgroundImage = `url(${optimized(place.image, 96)})`;

        if (place.count > 1) {
          const badge = document.createElement("span");
          badge.className = "place-marker__badge";
          badge.textContent = place.count;
          el.appendChild(badge);
        }

        const popup = new mapboxgl.Popup({
          offset: 22,
          closeButton: false,
          className: "place-popup",
        }).setHTML(
          `<div class="place-popup__inner">
             <img src="${optimized(place.image, 384)}" alt="${
               place.location
             }" loading="lazy" />
             <div class="place-popup__meta">
               <span class="place-popup__loc">${place.location}</span>
               <span class="place-popup__count">${place.count} photo${
                 place.count > 1 ? "s" : ""
               }</span>
             </div>
           </div>`,
        );

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([place.lng, place.lat])
          .setPopup(popup)
          .addTo(map.current);

        // Hover to preview, click to open the place in a lightbox.
        el.addEventListener("mouseenter", () => marker.togglePopup());
        el.addEventListener("mouseleave", () => marker.togglePopup());
        el.addEventListener("click", () => openPlace.current(place));

        markers.current.push(marker);
      });
    });
  });

  // Keep the basemap in sync with the site theme.
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    map.current.setConfigProperty("basemap", "lightPreset", mapTheme);
  }, [mapTheme]);

  return (
    <>
      <div className="overflow-clip" style={{ height: "400px" }}>
        <div
          ref={mapContainer}
          className="map-container h-full w-full rounded-2xl"
        />
      </div>
      <PhotoLightbox
        photos={
          activePlace
            ? activePlace.photos.map((p) => ({
                ...p,
                location: activePlace.location,
              }))
            : null
        }
        onClose={() => setActivePlace(null)}
      />
    </>
  );
}
