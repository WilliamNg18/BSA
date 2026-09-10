import type { PharmacyAssumptions } from "./baseline";
import type { PharmacyPrecheckSnapshot } from "./lifecycle";
import type { PharmacyScenario } from "./pharmacy-check";

export interface PharmacyReceipt {
  readonly id: string;
  readonly caseId: string;
  readonly scenario: PharmacyScenario;
  readonly submittedAt: string;
  readonly precheck: PharmacyPrecheckSnapshot;
  readonly assumptions: Readonly<PharmacyAssumptions>;
  readonly completeScenario: boolean;
}

export interface PharmacyTimelineStage { label: string; day: number; outcome: string; needed: boolean }
export function pharmacyTimeline(receipt: PharmacyReceipt): PharmacyTimelineStage[] {
  const a = receipt.assumptions;
  const resolved = receipt.scenario !== "D" && receipt.completeScenario;
  let day = a.monthEndDays;
  const stages: PharmacyTimelineStage[] = [
    { label: "Submitted", day: 0, outcome: "Synthetic receipt", needed: true },
    { label: "Month end", day, outcome: "Existing system illustration", needed: true },
  ];
  for (const [label, duration, outcome] of [
    ["Exception", a.exceptionDays, "Manual review"],
    ["Refer back", a.referBackDays, "Illustrative referral"],
    ["Correction", a.correctionDays, receipt.scenario === "D" ? "Manual review unresolved" : "Illustrative correction"],
  ] as const) {
    if (!resolved) day += duration;
    stages.push({ label, day, outcome: resolved ? "Not needed" : outcome, needed: !resolved });
  }
  stages.push({ label: "Payment cycle", day: day + a.paymentCycleDays, outcome: receipt.scenario === "D" ? "Not guaranteed" : "Illustrative cycle only", needed: true });
  return stages;
}

/** Copy every nested value before freezing, including caller-owned check arrays. */
export function immutableReceipt(input: PharmacyReceipt): PharmacyReceipt {
  const copy = structuredClone(input);
  const freeze = (value: object) => {
    Object.values(value).forEach((child: unknown) => { if (child !== null && typeof child === "object") freeze(child); });
    Object.freeze(value);
  };
  freeze(copy);
  return copy;
}