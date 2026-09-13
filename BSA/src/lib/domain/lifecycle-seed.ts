/** Synthetic month, all seven states at each of the five existing pharmacies. */
import { CASES, QUEUE_FILLER } from "./cases";
import { PHARMACIES } from "./reference";
import { LIFECYCLE_LABELS, type CaseLifecycle, type CaseRevision, type HistoryEvent, type LifecycleState } from "./lifecycle";
import { immutable } from "./lifecycle-model";

const canonicalStates: LifecycleState[] = ["paid", "referred_back", "information_requested", "in_review", "paid", "referred_back"];
const templates: Record<LifecycleState, number> = { submitted: 0, in_review: 3, information_requested: 2, referred_back: 1, resubmitted: 1, paid: 0, escalated: 3 };

/** Fresh deeply immutable seeds. Metadata-only rows use explicitly synthetic templates. */
export function seededLifecycleSession(): {
  lifecycles: Record<string, CaseLifecycle>;
  caseRevisions: Record<string, readonly CaseRevision[]>;
} {
  const lifecycles: Record<string, CaseLifecycle> = {};
  const caseRevisions: Record<string, readonly CaseRevision[]> = {};
  const add = (caseId: string, pharmacyCode: string, state: LifecycleState, template = templates[state]) => {
    const c = CASES[template];
    const history: HistoryEvent[] = [];
    const event = (to: LifecycleState, actor: HistoryEvent["actor"], message: string) => {
      history.push({ at: new Date(Date.UTC(2026, 8, 1, 9, history.length)).toISOString(), actor, from: history.at(-1)?.to ?? null, to, message, revision: 1 });
    };
    event("submitted", "pharmacy", "Synthetic claim submitted.");
    const automatic = state === "paid" && (c.scenario === "A" || c.scenario === "E");
    if (state !== "submitted" && !automatic) event("in_review", "code", "Routed for operator review.");
    if (state === "resubmitted") {
      event("referred_back", "operator", "Correction required before re-check.");
      event(state, "pharmacy", "Synthetic endorsement resubmitted; re-check pending.");
    } else if (state !== "submitted" && state !== "in_review") {
      event(state, automatic ? "code" : "operator", automatic ? "Priced by NHSBSA's existing rules engine; no person involved." : state === "paid" ? "Released to existing pricing (synthetic)." : "Synthetic human decision recorded.");
    }
    // F retains the historical record identity and timestamp, not a new decision.
    if (c.scenario === "F") Object.assign(history.at(-1)!, { at: "2026-09-03T15:02:11", recordId: "DR-000871" });
    if (state === "referred_back" || state === "information_requested") Object.assign(history.at(-1)!, {
      decision: state === "referred_back" ? "REFER_BACK" : "REQUEST_INFORMATION", tariffVersion: "2026-08", clauseId: "P2-C9",
      reason: state === "referred_back" ? "Endorsement initialled but not dated." : "Confirm the conflicting quantities; do not choose one automatically.",
    });
    lifecycles[caseId] = { caseId, pharmacyCode, state, history };
    caseRevisions[caseId] = [{ number: 1, at: history[0].at, kind: "seed", templateCaseId: c.id, endorsementText: c.extracted.endorsementText, precheck: null, confirmation: null,
      channel: c.channel === "Electronic (EPS)" ? "eps" : "paper" }];
  };
  CASES.forEach((c, i) => add(c.id, c.pharmacy.contractorCode, canonicalStates[i], i));
  QUEUE_FILLER.forEach((row) => {
    const pharmacy = PHARMACIES.find((p) => p.name === row.pharmacy)!;
    const state = row.state === "cleared_by_rules" ? "paid" : row.state === "human_decision_recorded" ? "referred_back" : row.state === "additional_evidence_required" ? "information_requested" : "in_review";
    add(row.id, pharmacy.contractorCode, state);
  });
  PHARMACIES.forEach((pharmacy) => {
    (Object.keys(LIFECYCLE_LABELS) as LifecycleState[]).forEach((state, index) => {
      if (!Object.values(lifecycles).some((row) => row.pharmacyCode === pharmacy.contractorCode && row.state === state)) {
        add(`SYN-${pharmacy.contractorCode}-${index + 1}`, pharmacy.contractorCode, state);
      }
    });
  });
  return immutable({ lifecycles, caseRevisions });
}

export function seededLifecycles(): Record<string, CaseLifecycle> {
  return seededLifecycleSession().lifecycles;
}