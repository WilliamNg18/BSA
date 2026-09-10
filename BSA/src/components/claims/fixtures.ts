/**
 * SYNTHETIC pharmacy claim fixtures for Task 9 (/pharmacy/claims).
 *
 * Stream C builds against the frozen contract in `@/lib/domain/lifecycle` while
 * Stream B's store implementation is still `not implemented`. Nothing here
 * writes to the shared store or calls its lifecycle methods; the page keeps
 * its own local, in-memory copy so no lifecycle stub is invoked.
 */
import type { Actor, CaseLifecycle, HistoryEvent, LifecycleState } from "@/lib/domain/lifecycle";

/** A history event with optional On/Off wording. Extends the frozen shape. */
export interface ClaimHistoryEvent extends HistoryEvent {
  /** Operator-approved draft wording, shown labelled as such when assistance is on. */
  draftReason?: string;
  /** Manual operator wording, retained when assistance is off. */
  manualReason?: string;
}

export interface ClaimFixture extends Omit<CaseLifecycle, "history"> {
  pharmacyName: string;
  title: string;
  endorsementText: string;
  amountClaimed: number;
  history: ClaimHistoryEvent[];
}

function event(at: string, actor: Actor, from: LifecycleState | null, to: LifecycleState, message: string, extra?: Partial<ClaimHistoryEvent>): ClaimHistoryEvent {
  return { at, actor, from, to, message, ...extra };
}

export const CLAIMS: ClaimFixture[] = [
  {
    caseId: "EX-24107",
    pharmacyCode: "FH774",
    pharmacyName: "Riverside Chemist",
    title: "Valid and complete",
    endorsementText: "NCSO JB 14/08/26",
    amountClaimed: 3.41,
    state: "paid",
    history: [
      event("2026-09-04T08:12:00", "pharmacy", null, "submitted", "Submitted for processing."),
      event("2026-09-04T08:40:00", "code", "submitted", "in_review", "Case built for operator review."),
      event("2026-09-04T09:05:00", "operator", "in_review", "paid", "Payment approved (synthetic); released to existing pricing."),
    ],
  },
  {
    caseId: "EX-24071",
    pharmacyCode: "FH774",
    pharmacyName: "Riverside Chemist",
    title: "Recently submitted",
    endorsementText: "NCSO KP 02/09/26",
    amountClaimed: 2.68,
    state: "submitted",
    history: [event("2026-09-04T11:20:00", "pharmacy", null, "submitted", "Submitted for processing.")],
  },
  {
    caseId: "EX-24112",
    pharmacyCode: "FQ123",
    pharmacyName: "Hillcrest Pharmacy",
    title: "Missing or insufficient information",
    endorsementText: "NCSO  RK",
    amountClaimed: 2.95,
    state: "referred_back",
    history: [
      event("2026-09-04T09:47:00", "pharmacy", null, "submitted", "Submitted for processing."),
      event("2026-09-04T10:02:00", "code", "submitted", "in_review", "Case built for operator review."),
      event("2026-09-04T10:31:00", "operator", "in_review", "referred_back", "Referred back for correction.", {
        draftReason: "Operator-approved draft: add the missing dispensing date to the NCSO endorsement.",
        manualReason: "Referred back by the operator: the endorsement is initialled but not dated.",
      }),
    ],
  },
  {
    caseId: "EX-24140",
    pharmacyCode: "FQ123",
    pharmacyName: "Hillcrest Pharmacy",
    title: "Correction resubmitted",
    endorsementText: "NCSO RK 21/08/26",
    amountClaimed: 2.95,
    state: "resubmitted",
    history: [
      event("2026-08-14T09:00:00", "pharmacy", null, "submitted", "Submitted for processing."),
      event("2026-08-14T09:30:00", "code", "submitted", "in_review", "Case built for operator review."),
      event("2026-08-14T10:15:00", "operator", "in_review", "referred_back", "Referred back for correction."),
      event("2026-09-04T08:05:00", "pharmacy", "referred_back", "resubmitted", "Resubmitted with the corrected endorsement."),
    ],
  },
  {
    caseId: "EX-24119",
    pharmacyCode: "FM208",
    pharmacyName: "Oakfield Pharmacy",
    title: "Evidence conflict",
    endorsementText: "NCSO AM 19/08/26",
    amountClaimed: 3.9,
    state: "information_requested",
    history: [
      event("2026-09-04T10:05:00", "pharmacy", null, "submitted", "Submitted for processing."),
      event("2026-09-04T10:22:00", "code", "submitted", "in_review", "Case built for operator review."),
      event("2026-09-04T10:48:00", "operator", "in_review", "information_requested", "Information requested.", {
        draftReason: "Operator-approved draft: confirm the dispensed quantity of 56, since the claim states 84.",
        manualReason: "Information requested by the operator: the claimed quantity does not match the captured form.",
      }),
    ],
  },
  {
    caseId: "EX-24123",
    pharmacyCode: "FK390",
    pharmacyName: "Meadow Lane Dispensary",
    title: "Deliberate failure and abstention",
    endorsementText: "N?S? ~~ 1?/0?",
    amountClaimed: 3.86,
    state: "escalated",
    history: [
      event("2026-09-04T10:31:00", "pharmacy", null, "submitted", "Submitted for processing."),
      event("2026-09-04T10:52:00", "code", "submitted", "in_review", "Case built for operator review."),
      event("2026-09-04T11:10:00", "operator", "in_review", "escalated", "Escalated to a senior operator: the capture and endorsement could not be read reliably."),
    ],
  },
  {
    caseId: "EX-24101",
    pharmacyCode: "FT561",
    pharmacyName: "Station Road Pharmacy",
    title: "Cleared by rules (no model call)",
    endorsementText: "",
    amountClaimed: 1.02,
    state: "in_review",
    history: [
      event("2026-09-04T07:40:00", "pharmacy", null, "submitted", "Submitted for processing."),
      event("2026-09-04T07:52:00", "code", "submitted", "in_review", "Cleared by deterministic rules; case built for operator confirmation."),
    ],
  },
];

export function pharmacyOptions(claims: ClaimFixture[] = CLAIMS): { code: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const c of claims) if (!seen.has(c.pharmacyCode)) seen.set(c.pharmacyCode, c.pharmacyName);
  return Array.from(seen, ([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
}

export function claimsForPharmacy(code: string, claims: ClaimFixture[] = CLAIMS): ClaimFixture[] {
  return claims.filter((c) => c.pharmacyCode === code);
}
