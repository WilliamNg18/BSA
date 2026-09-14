import type { ItemChannel } from "./types";

export interface DemoStepDefinition {
  readonly number: number;
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly caseId: string | null;
  readonly channel: ItemChannel | null;
}

/** Navigation is presentation only; entering a step never submits or decides. */
export const DEMO_STEPS: readonly DemoStepDefinition[] = Object.freeze(([
  { number: 1, id: "real-process", title: "The real process", path: "/#pipeline", caseId: null, channel: null },
  { number: 2, id: "monthly-numbers", title: "A month in numbers", path: "/#month", caseId: null, channel: null },
  { number: 3, id: "eps-complete", title: "EPS: complete item", path: "/pharmacy", caseId: "EX-24107", channel: "eps" },
  { number: 4, id: "eps-missing-date", title: "EPS: missing date", path: "/pharmacy", caseId: "EX-24112", channel: "eps" },
  { number: 5, id: "eps-mismatch", title: "EPS: plausible but wrong", path: "/pharmacy", caseId: "SYN-FQ123-MISMATCH", channel: "eps" },
  { number: 6, id: "paper-readable", title: "Paper: readable", path: "/pharmacy", caseId: "SYN-FQ123-READABLE", channel: "paper" },
  { number: 7, id: "paper-unreadable", title: "Paper: unreadable", path: "/pharmacy", caseId: "EX-24123", channel: "paper" },
  { number: 8, id: "operator-actions", title: "What NHSBSA sees", path: "/queue", caseId: "EX-24112", channel: "eps" },
  { number: 9, id: "pharmacy-actions", title: "What the pharmacy sees", path: "/pharmacy/claims", caseId: "EX-24112", channel: "eps" },
  { number: 10, id: "follow-one-case", title: "Follow one case", path: "/pharmacy", caseId: "EX-24123", channel: "paper" },
  { number: 11, id: "where-it-ends", title: "Where it ends", path: "/#close", caseId: null, channel: null },
] satisfies DemoStepDefinition[]).map((step) => Object.freeze(step)));

export interface DemoModeSlice {
  demoStep: number | null;
  setDemoStep: (step: number | null) => void;
}
