import { demoStepDestination, getDemoStep } from "@/lib/domain/demo-steps";
import { useAppStore } from "@/lib/store";
import { matchPath } from "react-router-dom";
import { isPlayableCase } from "@/lib/domain/cases";

export function demoRouteCaseId(pathname: string, search: string): string | null {
  return matchPath("/case/:caseId/*", pathname)?.params.caseId ?? new URLSearchParams(search).get("case");
}

export function navigateDemoStep(number: number, navigate: (path: string) => void) {
  const definition = getDemoStep(number);
  const state = useAppStore.getState();
  const followed = state.followedCaseId ? state.lifecycles[state.followedCaseId] : undefined;
  const process = followed ? state.itemProcesses[followed.caseId] : undefined;
  const handoff = state.demoStep === 8 && number === 9 && followed && process
    && isPlayableCase(followed.caseId)
    && (followed.state === "referred_back" || followed.state === "information_requested");
  const step = handoff ? { ...definition, caseId: followed.caseId, channel: process.channel } : definition;
  // Validate before touching presentation state. Unknown cases are not substitutes.
  if (step.caseId && !state.lifecycles[step.caseId]) throw new Error(`Demo case unavailable: ${step.caseId}`);
  state.setDemoStep(step.number);
  if (step.caseId) state.followCase(step.caseId);
  navigate(demoStepDestination(step));
}
