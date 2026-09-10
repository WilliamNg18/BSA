/** Deterministic synthetic lifecycle seed. No real claims, contractors or payments. */
import { CASES, QUEUE_FILLER } from "./cases";
import { PHARMACIES } from "./reference";
import type { CaseLifecycle, HistoryEvent, LifecycleState } from "./lifecycle";
import type { CaseState } from "./types";

/** First submission of the synthetic month; fillers follow at a fixed interval. */
const MONTH_START = "2026-08-06T09:00:00.000Z";
const FILLER_INTERVAL_MINUTES = 4 * 24 * 60;
const FILLER_QUEUE_MINUTES = 3 * 24 * 60;
const OUTCOME_MINUTES = 90;
const SUBMISSION_HOUR = "T09:00:00.000Z";

function shift(at: string, minutes: number): string {
  return new Date(Date.parse(at) + minutes * 60_000).toISOString();
}

/** Normalises the existing synthetic timestamps to a single ISO 8601 form. */
function iso(at: string): string {
  return new Date(`${at}Z`).toISOString();
}

/** Uses the existing contractor codes; no pharmacy is remapped or invented. */
export function contractorCodeFor(pharmacyName: string): string | null {
  return PHARMACIES.find((p) => p.name === pharmacyName)?.contractorCode ?? null;
}

interface SeedRow {
  caseId: string;
  pharmacyCode: string;
  submittedAt: string;
  arrivedAt: string;
  caseState: CaseState;
}

function outcomeFor(caseState: CaseState): { to: LifecycleState; actor: HistoryEvent["actor"]; message: string } | null {
  if (caseState === "cleared_by_rules") {
    return { to: "paid", actor: "code", message: "Cleared by rules and released to existing pricing." };
  }
  if (caseState === "human_decision_recorded") {
    return { to: "referred_back", actor: "operator", message: "Operator referred the claim back for correction." };
  }
  return null;
}

function seedHistory(row: SeedRow): HistoryEvent[] {
  const events: HistoryEvent[] = [
    { at: row.submittedAt, actor: "pharmacy", from: null, to: "submitted", message: "Claim submitted with its endorsement." },
    { at: row.arrivedAt, actor: "code", from: "submitted", to: "in_review", message: "Routed to the exception queue for operator review." },
  ];
  const outcome = outcomeFor(row.caseState);
  if (outcome) {
    events.push({ at: shift(row.arrivedAt, OUTCOME_MINUTES), actor: outcome.actor, from: "in_review", to: outcome.to, message: outcome.message });
  }
  return events;
}

function seedRows(): SeedRow[] {
  const canonical = CASES.map((c) => ({
    caseId: c.id,
    pharmacyCode: c.pharmacy.contractorCode,
    submittedAt: `${c.extracted.dispensingDate}${SUBMISSION_HOUR}`,
    arrivedAt: iso(c.receivedAt),
    caseState: c.initialState,
  }));
  const filler = QUEUE_FILLER.flatMap((f, index) => {
    const pharmacyCode = contractorCodeFor(f.pharmacy);
    if (!pharmacyCode) return [];
    const submittedAt = shift(MONTH_START, index * FILLER_INTERVAL_MINUTES);
    return [{
      caseId: f.id,
      pharmacyCode,
      submittedAt,
      arrivedAt: shift(submittedAt, FILLER_QUEUE_MINUTES),
      caseState: f.state,
    }];
  });
  return [...canonical, ...filler];
}

/** A fresh synthetic month of lifecycles. Callers never mutate the returned records. */
export function seededLifecycles(): Record<string, CaseLifecycle> {
  const rows = seedRows();
  const entries = rows.map((row) => {
    const history = seedHistory(row).map((event) => Object.freeze(event));
    const lifecycle: CaseLifecycle = Object.freeze({
      caseId: row.caseId,
      pharmacyCode: row.pharmacyCode,
      state: history[history.length - 1].to,
      history: Object.freeze(history) as HistoryEvent[],
    });
    return [row.caseId, lifecycle] as const;
  });
  return Object.fromEntries(entries);
}
