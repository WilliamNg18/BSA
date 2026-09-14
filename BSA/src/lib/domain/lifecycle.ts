/** Frozen cross-stream contracts. Synthetic session data, not payment authority. */
import type { DecisionRecord, DeclaredItemFields, EndorsementFacts, EpsPrescription, FieldProvenance, HumanDecision, ItemChannel, PaperDeclaration, PharmacyDeclaration, Recommendation, RoutingResult } from "./types";

export type LifecycleState = "submitted" | "in_review" | "information_requested" | "referred_back" | "resubmitted" | "paid" | "escalated" | "released_to_pricing";
export type Actor = "pharmacy" | "agent" | "code" | "operator";

export type VerificationGateResult = "pass" | "fail" | "none";
export type ReleaseOrigin = "automatic_verification" | "human_decision";
export interface ItemVerification {
  readonly gate1: VerificationGateResult;
  readonly gate2: VerificationGateResult;
  readonly reconciled: boolean;
  readonly released: boolean;
}

export const NO_VERIFICATION: Readonly<ItemVerification> = Object.freeze({
  gate1: "none", gate2: "none", reconciled: false, released: false,
});

export interface OperatorDecisionDraft {
  readonly revision: number;
  readonly outcome: HumanDecision | null;
  readonly rbCode: string;
  readonly note: string;
  readonly appliedSuggestion: boolean;
}

export interface PharmacyCorrectionDraft {
  readonly revision: number;
  readonly channel?: ItemChannel;
  readonly endorsementText: string;
  readonly declaration?: PharmacyDeclaration;
  readonly paperDeclaration?: PaperDeclaration;
  readonly epsPrescription?: EpsPrescription;
  readonly appliedSuggestion: boolean;
  readonly confirmation?: string;
}

/** Human-invoked controls. The agent must never invoke these actions. */
export interface HumanActionSlice {
  itemVerification: Record<string, ItemVerification>;
  operatorDrafts: Record<string, OperatorDecisionDraft>;
  pharmacyDrafts: Record<string, PharmacyCorrectionDraft>;
  setOperatorDraft: (caseId: string, draft: Pick<OperatorDecisionDraft, "revision" | "outcome" | "rbCode" | "note">) => void;
  setPharmacyDraft: (caseId: string, draft: Omit<PharmacyCorrectionDraft, "appliedSuggestion">) => void;
  applySuggestionToDecision: (caseId: string) => void;
  releaseToPricing: (caseId: string, reason?: string) => void;
  referBack: (caseId: string, rbCode: string, note: string) => void;
  requestInformation: (caseId: string, question: string) => void;
  applySuggestedCorrection: (caseId: string) => void;
  resubmit: (caseId: string) => void;
}

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
  processStep?: "submission" | "automatic_pricing" | "existing_pricing" | "type1_capture" | "type2_judgement" | "referral" | "resubmission" | "suggestion_applied" | "correction_applied" | "verification" | "release_to_pricing";
  readonly verification?: ItemVerification;
  readonly releaseOrigin?: ReleaseOrigin;
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
  readonly epsPrescription?: EpsPrescription;
  readonly paperDeclaration?: PaperDeclaration;
  /** Captured at explicit Send/Post, never inferred from a later header toggle. */
  readonly verificationEnabled?: boolean;
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
  readonly releaseOrigin?: ReleaseOrigin;
}

export interface ProcessSubmission {
  /** Current revision observed by the submitting form; rejects stale drafts when supplied. */
  revision?: number;
  caseId: string;
  channel: ItemChannel;
  endorsementText: string;
  declaration?: PharmacyDeclaration;
  epsPrescription?: EpsPrescription;
  paperDeclaration?: PaperDeclaration;
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

const sharedLabel = (label: string) => ({ pharmacy: label, nhsbsa: { on: label, off: label } });
export const LIFECYCLE_LABELS = {
  submitted: sharedLabel("Submitted, awaiting processing"),
  in_review: sharedLabel("Awaiting operator"),
  information_requested: sharedLabel("Information requested"),
  referred_back: sharedLabel("Action needed: correction required"),
  resubmitted: sharedLabel("Resubmitted, awaiting re-check"),
  paid: sharedLabel("Paid on the normal schedule (synthetic)"),
  escalated: sharedLabel("Awaiting senior review"),
  released_to_pricing: {
    pharmacy: "Verified and released to pricing (synthetic)",
    nhsbsa: {
      on: "Verified, released to existing pricing, no operator action",
      off: "Verified, released to existing pricing, no operator action",
    },
  },
} as const satisfies Record<LifecycleState, { pharmacy: string; nhsbsa: { on: string; off: string } }>;

/** The no-operator label must never erase an actual operator release. */
export function itemStateLabel(row: CaseLifecycle, perspective: "pharmacy" | "nhsbsa" | "both", enabled = false): string {
  const release = row.state === "released_to_pricing"
    ? row.history.filter((event) => event.to === "released_to_pricing").at(-1) : undefined;
  if (release?.releaseOrigin === "human_decision" || release?.actor === "operator") {
    if (release.verification?.gate1 === "none" && release.verification.gate2 === "none") return perspective === "pharmacy"
      ? "Released to pricing after operator review (synthetic)"
      : "Released to existing pricing after operator review";
    return perspective === "pharmacy"
      ? "Verified and released to pricing after operator review (synthetic)"
      : "Verified and released to existing pricing after operator review";
  }
  const labels = LIFECYCLE_LABELS[row.state];
  return perspective === "pharmacy" ? labels.pharmacy : labels.nhsbsa[enabled ? "on" : "off"];
}