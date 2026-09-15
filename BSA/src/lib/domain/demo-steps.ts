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
  { number: 6, id: "paper-declaration", title: "Paper: declaration before posting", path: "/pharmacy", caseId: "EX-24123", channel: "paper" },
  { number: 7, id: "paper-confirmation", title: "Paper: unreadable, pharmacy to NHSBSA", path: "/pharmacy", caseId: "EX-24123", channel: "paper" },
  { number: 8, id: "operator-actions", title: "What NHSBSA sees", path: "/queue", caseId: "EX-24123", channel: "paper" },
  { number: 9, id: "pharmacy-actions", title: "What the pharmacy sees", path: "/pharmacy/claims", caseId: "EX-24123", channel: "paper" },
  { number: 10, id: "follow-one-case", title: "Follow one case", path: "/case/EX-24123", caseId: "EX-24123", channel: "paper" },
  { number: 11, id: "where-it-ends", title: "Where it ends", path: "/#close", caseId: null, channel: null },
] satisfies DemoStepDefinition[]).map((step) => Object.freeze(step)));

export const DEMO_CASE_IDS: readonly string[] = Object.freeze(
  [...new Set(DEMO_STEPS.flatMap((step) => step.caseId ? [step.caseId] : []))],
);

export interface DemoModeSlice {
  demoStep: number | null;
  setDemoStep: (step: number | null) => void;
}

/** Selectors cover task controls inside the step, not the persistent header. */
export const DEMO_CONTROL_SELECTORS = Object.freeze({
  "month-detail": '[data-demo-control="month-detail"]',
  submission: '[data-pharmacy-action="submit"]',
  correction: '[data-pharmacy-action="apply-correction"]',
  resubmission: '[data-pharmacy-action="resubmit"]',
  confirmation: '[data-pharmacy-action="confirmation"]',
  operator: '[data-demo-control="operator"]',
  "type1-capture": '[data-demo-control="type1-capture"]',
  "queue-filter": '[data-demo-control="queue-filter"]',
  "queue-row": '[data-demo-control="queue-row"]',
  history: '[data-demo-control="history"]',
});

export type DemoControl = keyof typeof DEMO_CONTROL_SELECTORS;

export const DEMO_ALLOWED_CONTROLS: Readonly<Record<number, readonly DemoControl[]>> = Object.freeze({
  1: Object.freeze([]),
  2: Object.freeze(["month-detail"] as const),
  3: Object.freeze(["submission", "correction"] as const),
  4: Object.freeze(["submission", "correction"] as const),
  5: Object.freeze(["submission", "correction"] as const),
  6: Object.freeze(["submission", "correction"] as const),
  7: Object.freeze(["submission", "correction", "operator", "type1-capture"] as const),
  8: Object.freeze(["queue-filter", "queue-row", "operator", "type1-capture"] as const),
  9: Object.freeze(["correction", "resubmission", "confirmation"] as const),
  10: Object.freeze(["submission", "correction", "resubmission", "confirmation", "operator", "type1-capture", "history"] as const),
  11: Object.freeze([]),
});

// Explicit Follow links may open the same operational item on the other side.
export const DEMO_FOLLOW_CONTROLS = Object.freeze({
  pharmacy: Object.freeze(["correction", "resubmission", "confirmation"] as const),
  nhsbsa: Object.freeze(["operator", "type1-capture"] as const),
});

export function getDemoStep(number: number): DemoStepDefinition {
  const step = DEMO_STEPS.find((candidate) => candidate.number === number);
  if (!step) throw new Error(`Unknown demo step: ${number}`);
  return step;
}

export function demoStepDestination(step: DemoStepDefinition): string {
  const [pathname, hash] = step.path.split("#");
  const params = new URLSearchParams();
  if (step.caseId) params.set("case", step.caseId);
  if (step.channel) params.set("channel", step.channel);
  return `${pathname}${params.size ? `?${params}` : ""}${hash ? `#${hash}` : ""}`;
}
