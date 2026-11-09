import { useCallback, useSyncExternalStore } from "react";

// sessionStorage, so the snow survives a reload but not until July
const KEY = "snowfall";
const EVENT = "snowfall:change";

let snowing: boolean | null = null;

const read = () => {
  if (snowing === null) {
    try {
      snowing = sessionStorage.getItem(KEY) === "on";
    } catch {
      snowing = false;
    }
  }
  return snowing;
};

const subscribe = (onChange: () => void) => {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
};

// Shared on/off switch for the snowfall easter egg
export const useSnowfall = () => {
  const isSnowing = useSyncExternalStore(subscribe, read, () => false);

  const toggle = useCallback(() => {
    snowing = !read();
    try {
      sessionStorage.setItem(KEY, snowing ? "on" : "off");
    } catch {
      // Storage can be blocked; the snow still works for this page load
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { isSnowing, toggle };
};
