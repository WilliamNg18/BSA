/** Frozen cross-stream contracts. Synthetic session data, not payment authority. */
import type { DecisionRecord, DeclaredItemFields, EndorsementFacts, FieldProvenance, HumanDecision, ItemChannel, PharmacyDeclaration, Recommendation, RoutingResult } from "./types";

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
  revision?: number;
  recordId?: string;
  decision?: HumanDecision;
  recommendation?: Recommendation;
  reason?: string;
  approvedDraft?: ApprovedDraft;
  channel?: ItemChannel;
  rbCode?: string;
  processStep?: "submission" | "automatic_pricing" | "type1_capture" | "type2_judgement" | "referral" | "resubmission";
  /** Append-only human capture evidence; never edit the originating pharmacy attempt. */
  readonly capture?: Type1Capture;
}

/** Created only by an explicit human approval argument, never by the flag. */
export interface ApprovedDraft {
  readonly text: string;
  readonly approvedAt: string;
  readonly approvedBy: string;
  readonly decision: HumanDecision;
  readonly tariffVersion: string;
  readonly clauseId: string;
}

/** Original historical records remain valid; new records carry revision linkage. */
export interface LifecycleDecisionRecord extends DecisionRecord {
  readonly revision?: number;
  readonly reason?: string;
  readonly clauseId?: string;
  readonly approvedDraft?: ApprovedDraft;
  readonly rbCode?: string;
}

/** Each pharmacy action retains its own text and advisory snapshot forever. */
export interface CaseRevision {
  readonly number: number;
  readonly at: string;
  readonly kind: "seed" | "submission" | "resubmission" | "confirmation";
  readonly templateCaseId: string;
  readonly endorsementText: string;
  readonly precheck: PharmacyPrecheckSnapshot | null;
  readonly confirmation: string | null;
  /** Present on process-model submissions; legacy revisions remain immutable. */
  readonly channel?: ItemChannel;
  readonly declaration?: PharmacyDeclaration;
}

export interface Type1Capture {
  readonly revision: number;
  readonly confirmedAt: string;
  readonly operator: string;
  readonly fields: DeclaredItemFields;
  readonly provenance: FieldProvenance;
  readonly declarationReconciled: boolean;
}

/** Routing metadata only. Lifecycle/history and attempts remain authoritative. */
export interface ItemProcess {
  readonly revision: number;
  readonly channel: ItemChannel;
  readonly routing: RoutingResult;
  readonly capture: Type1Capture | null;
  readonly rbCode: string | null;
}

export interface ProcessSubmission {
  caseId: string;
  channel: ItemChannel;
  endorsementText: string;
  declaration?: PharmacyDeclaration;
  precheck?: PharmacyPrecheckSnapshot;
}

export interface ConfirmType1Input {
  caseId: string;
  revision: number;
  fields: DeclaredItemFields;
  provenance: "human_capture" | "pharmacy_declaration";
  declarationReconciled: boolean;
}

export interface Type2DecisionInput {
  caseId: string;
  decision: HumanDecision;
  reason: string;
  rbCode?: string;
  approvedDraft?: string;
}

/** Implemented by the single operational store in Task 19, not by view copies. */
export interface ProcessSlice {
  itemProcesses: Record<string, ItemProcess>;
  submitItem: (input: ProcessSubmission) => void;
  confirmType1: (input: ConfirmType1Input) => void;
  recordType2Decision: (input: Type2DecisionInput) => void;
  resubmitItem: (input: ProcessSubmission) => void;
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
  caseRevisions: Record<string, readonly CaseRevision[]>;
  followedCaseId: string | null;
  /** Explicit demo replay: append a submission revision, even for a seeded ID. */
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
  paid: { pharmacy: "Paid on the normal schedule (synthetic)", nhsbsa: { on: "Sufficient, released to existing pricing", off: "Sufficient, released to existing pricing" } },
  escalated: { pharmacy: "In review at NHSBSA (senior review)", nhsbsa: { on: "Escalated", off: "Escalated" } },
} as const satisfies Record<LifecycleState, { pharmacy: string; nhsbsa: { on: string; off: string } }>;