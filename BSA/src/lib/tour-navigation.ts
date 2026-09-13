// Nine stops, six chapters: the operational pages share one continuous cycle.
export const TOUR_STOPS = [
  { chapter: 1, label: "Real process", to: "/#scene" },
  { chapter: 2, label: "A month in numbers", to: "/#month" },
  { chapter: 3, label: "Evidence to a decision", to: "/#pipeline" },
  { chapter: 4, label: "Cases and boundaries", to: "/#cases" },
  { chapter: 5, label: "One continuous cycle", to: "/#two-places" },
  { chapter: 5, label: "Pharmacy check", to: "/pharmacy" },
  { chapter: 5, label: "NHSBSA queue", to: "/queue" },
  { chapter: 5, label: "Pharmacy claims", to: "/pharmacy/claims" },
  { chapter: 6, label: "The central bet", to: "/#close" },
] as const;

export const TOUR_CHAPTERS = TOUR_STOPS.filter((stop, index) =>
  index === 0 || stop.chapter !== TOUR_STOPS[index - 1].chapter);
export const TOUR_CHAPTER_COUNT = TOUR_CHAPTERS.length;

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