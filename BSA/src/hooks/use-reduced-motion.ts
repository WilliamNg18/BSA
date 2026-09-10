import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const snapshot = () => window.matchMedia(query).matches;
function subscribe(notify: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

/** React to preference changes as well as the initial browser setting. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}