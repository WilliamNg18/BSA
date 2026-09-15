import type { Type1Capture } from "@/lib/domain/lifecycle";

export function captureFocusKey(caseId: string, capture: Type1Capture | null): string | null {
  return capture ? JSON.stringify([caseId, capture.revision, capture.sourceRevision ?? capture.revision, capture.confirmedAt]) : null;
}

export function revealOperatorNote(
  element: Pick<HTMLElement, "scrollIntoView" | "getBoundingClientRect">,
  viewport: Pick<Window, "innerHeight" | "scrollBy"> = window,
) {
  element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  const bounds = element.getBoundingClientRect();
  if (bounds.height <= viewport.innerHeight && bounds.bottom > viewport.innerHeight - 8) {
    viewport.scrollBy({ top: Math.ceil(bounds.bottom - viewport.innerHeight + 8), behavior: "instant" });
  }
}
