// Seven stops, six chapters: the existing pharmacy demo is chapter 4's substop.
export const TOUR_STOPS = [
  { chapter: 1, label: "Set the scene", to: "/#scene" },
  { chapter: 2, label: "A month of work", to: "/#month" },
  { chapter: 3, label: "The pipeline", to: "/#cases" },
  { chapter: 4, label: "One agent, two places", to: "/#two-places" },
  { chapter: 4, label: "Pharmacy example", to: "/pharmacy" },
  { chapter: 5, label: "The queue", to: "/queue" },
  { chapter: 6, label: "The first test", to: "/#close" },
] as const;

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