import { create } from "zustand";
import { nhsbsaCaseLink, pharmacyCaseLink } from "./case-links";
import { useAppStore, type Perspective } from "./store";

export type FollowSide = Exclude<Perspective, "both">;
interface TemporaryVisit { caseId: string; origin: FollowSide }

/** Presentation context only; the item and its actions remain in useAppStore. */
export const useFollowVisit = create<{ temporary: TemporaryVisit | null }>(() => ({ temporary: null }));

export function endFollowVisit() {
  useFollowVisit.setState({ temporary: null });
}

export function followDestination(side: FollowSide, caseId: string) {
  return side === "pharmacy" ? pharmacyCaseLink(caseId) : nhsbsaCaseLink(caseId);
}

export function resolveFollowVisit(perspective: Perspective, side: FollowSide, origin: FollowSide | null) {
  if (perspective !== "both") {
    return perspective === side
      ? { perspective, origin: null }
      : { perspective: "both" as const, origin: perspective };
  }
  return origin === side
    ? { perspective: origin, origin: null }
    : { perspective, origin };
}

/** Called only by the explicit same-item navigation buttons. */
export function visitFollowedCase(side: FollowSide): string {
  const state = useAppStore.getState();
  const caseId = state.followedCaseId;
  if (!caseId || !state.lifecycles[caseId]) throw new Error("Follow an existing item before changing its view.");
  const temporary = useFollowVisit.getState().temporary;
  const next = resolveFollowVisit(state.perspective, side, temporary?.caseId === caseId ? temporary.origin : null);
  useFollowVisit.setState({ temporary: next.origin ? { caseId, origin: next.origin } : null });
  if (next.perspective !== state.perspective) state.setPerspective(next.perspective);
  return followDestination(side, caseId);
}

useAppStore.subscribe((state, previous) => {
  if (state.followedCaseId !== previous.followedCaseId || state.perspective !== "both") endFollowVisit();
});
