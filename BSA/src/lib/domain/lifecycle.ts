/** Frozen cross-stream contracts. Synthetic session data, not payment authority. */
import type { EndorsementFacts, HumanDecision } from "./types";

export type LifecycleState = "submitted" | "in_review" | "information_requested" | "referred_back" | "resubmitted" | "paid" | "escalated";
export type Actor = "pharmacy" | "agent" | "code" | "operator";

export interface HistoryEvent {
  /** ISO 8601 timestamp. */
  at: string;
  actor: Actor;
  from: LifecycleState | null;
  to: LifecycleState;
  message: string;
  clauseId?: string;
  tariffVersion?: string;
  exactFix?: string;
}

export interface CaseLifecycle {
  caseId: string;
  pharmacyCode: string;
  state: LifecycleState;
  history: HistoryEvent[];
}

/** Optional advisory snapshot. No completed check is represented by null facts/version/time. */
export interface PharmacyPrecheckSnapshot {
  readonly typedText: string;
  readonly dispensingDate: string;
  readonly facts: Readonly<EndorsementFacts> | null;
  readonly tariffVersion: string | null;
  readonly clauseId: string | null;
  readonly checkedAt: string | null;
  readonly status: "ready" | "missing" | "unable" | "not_checked";
  readonly checks: readonly Readonly<{ id: string; label: string; met: boolean | null }>[];
  readonly mode: "scripted" | "off" | "unavailable" | "pending";
}

export interface LifecycleSlice {
  lifecycles: Record<string, CaseLifecycle>;
  followedCaseId: string | null;
  submitFromPharmacy: (caseId: string, endorsementText: string, precheck?: PharmacyPrecheckSnapshot) => void;
  arriveInQueue: (caseId: string) => void;
  recordOperatorDecision: (caseId: string, decision: HumanDecision, reason: string, draft?: string) => void;
  resubmitFromPharmacy: (caseId: string, endorsementText: string, precheck?: PharmacyPrecheckSnapshot) => void;
  sendConfirmation: (caseId: string, text: string) => void;
  followCase: (caseId: string | null) => void;
}

export const LIFECYCLE_LABELS = {
  submitted: { pharmacy: "Submitted, awaiting processing", nhsbsa: { on: "In queue", off: "In queue" } },
  in_review: { pharmacy: "In review at NHSBSA", nhsbsa: { on: "Case built, awaiting operator", off: "Awaiting operator" } },
  information_requested: { pharmacy: "Information requested: NHSBSA needs you to confirm something", nhsbsa: { on: "Request information sent", off: "Request information sent" } },
  referred_back: { pharmacy: "Referred back: correction needed before payment", nhsbsa: { on: "Referred back", off: "Referred back" } },
  resubmitted: { pharmacy: "Resubmitted, awaiting re-check", nhsbsa: { on: "Resubmitted: re-check", off: "Resubmitted: re-check" } },
  paid: { pharmacy: "Payment approved (synthetic)", nhsbsa: { on: "Sufficient, released to existing pricing", off: "Sufficient, released to existing pricing" } },
  escalated: { pharmacy: "In review at NHSBSA (senior review)", nhsbsa: { on: "Escalated", off: "Escalated" } },
} as const satisfies Record<LifecycleState, { pharmacy: string; nhsbsa: { on: string; off: string } }>;