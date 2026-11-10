import { useCallback, useSyncExternalStore } from "react";

// sessionStorage, like the snow: the pond survives a reload but not the tab
const KEY = "zen";
const EVENT = "zen:change";

let zen: boolean | null = null;

const read = () => {
  if (zen === null) {
    try {
      zen = sessionStorage.getItem(KEY) === "on";
    } catch {
      zen = false;
    }
  }
  return zen;
};

const subscribe = (onChange: () => void) => {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
};

// Shared on/off switch for the zen pond easter egg
export const useZen = () => {
  const isZen = useSyncExternalStore(subscribe, read, () => false);

  const toggle = useCallback(() => {
    zen = !read();
    try {
      sessionStorage.setItem(KEY, zen ? "on" : "off");
    } catch {
      // Storage can be blocked; the pond still works for this page load
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { isZen, toggle };
};
