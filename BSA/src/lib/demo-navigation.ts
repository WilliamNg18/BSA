import { demoStepDestination, getDemoStep } from "@/lib/domain/demo-steps";
import { useAppStore } from "@/lib/store";

export function navigateDemoStep(number: number, navigate: (path: string) => void) {
  const step = getDemoStep(number);
  const state = useAppStore.getState();
  // Validate before touching presentation state. Unknown cases are not substitutes.
  if (step.caseId && !state.lifecycles[step.caseId]) throw new Error(`Demo case unavailable: ${step.caseId}`);
  state.setDemoStep(step.number);
  if (step.caseId) state.followCase(step.caseId);
  navigate(demoStepDestination(step));
}
