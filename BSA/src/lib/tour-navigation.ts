// Nine stops, eight chapters: the precheck remains chapter 5's substop.
export const TOUR_STOPS = [
  { chapter: 1, label: "The scene", to: "/#scene" },
  { chapter: 2, label: "A month in numbers", to: "/#month" },
  { chapter: 3, label: "What exists today and what changes", to: "/#pipeline" },
  { chapter: 4, label: "Four cases", to: "/#cases" },
  { chapter: 5, label: "One agent, two places", to: "/#two-places" },
  { chapter: 5, label: "Pharmacy example", to: "/pharmacy" },
  { chapter: 6, label: "The queue", to: "/queue" },
  { chapter: 7, label: "What the pharmacy sees", to: "/pharmacy/claims" },
  { chapter: 8, label: "Where it ends", to: "/#close" },
] as const;

export const TOUR_CHAPTER_COUNT = new Set(TOUR_STOPS.map((stop) => stop.chapter)).size;

export function tourStopIndex(pathname: string, hash: string): number {
  if (pathname === "/") {
    const index = TOUR_STOPS.findIndex((stop) => stop.to === `/${hash}`);
    // A skip-link or unknown fragment must not fabricate another chapter.
    return index >= 0 ? index : 0;
  }
  return TOUR_STOPS.findIndex((stop) => stop.to === pathname);
}

export function isTourShortcut(event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey" | "repeat" | "defaultPrevented" | "isComposing">): boolean {
  return event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey &&
    !event.repeat && !event.defaultPrevented && !event.isComposing &&
    (event.key === "ArrowLeft" || event.key === "ArrowRight");
}