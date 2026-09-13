/** Pure session projections and validation. No persistence or payment authority. */
import { caseById } from "./cases";
import { interpretPharmacyText } from "./pharmacy-check";
import { PHARMACIES } from "./reference";
import { versionForDate } from "./tariff";
import type { CaseLifecycle, CaseRevision, HistoryEvent, ItemProcess, PharmacyPrecheckSnapshot } from "./lifecycle";
import type { ExceptionCase } from "./types";

/** Clone before recursively freezing: caller-owned objects and fixtures stay untouched. */
export function immutable<T>(value: T): T {
  const freeze = (item: unknown): void => {
    if (item && typeof item === "object") {
      Object.values(item).forEach(freeze);
      Object.freeze(item);
    }
  };
  const copy = structuredClone(value);
  freeze(copy);
  return copy;
}

export function requireText(text: string, label: string, minimum = 1): void {
  if (typeof text !== "string" || text.trim().length < minimum) throw new Error(`${label} requires at least ${minimum} characters.`);
}

export function requireLifecycle(caseId: string, lifecycles: Record<string, CaseLifecycle>): CaseLifecycle {
  if (!Object.hasOwn(lifecycles, caseId)) throw new Error(`Unknown synthetic case: ${caseId}.`);
  return lifecycles[caseId];
}

export function appendHistory(current: CaseLifecycle, event: HistoryEvent): CaseLifecycle {
  if (event.from !== current.state || (event.actor === "agent" && event.to !== current.state)) throw new Error("Invalid lifecycle event.");
  return immutable({ ...current, state: event.to, history: [...current.history, event] });
}

/**
 * Pure pack/trace input. Seed evidence is unchanged. Only an explicit pharmacy
 * text revision replaces endorsement evidence; confirmations never resolve C's
 * quantity conflict. D's capture uncertainty and disagreeing readings survive.
 * A fresh frozen clone is returned: memoise on lifecycles + caseRevisions in UI.
 */
export function caseForLifecycle(
  caseId: string,
  lifecycles: Record<string, CaseLifecycle>,
  caseRevisions: Record<string, readonly CaseRevision[]>,
  itemProcesses?: Record<string, ItemProcess>,
): ExceptionCase | null {
  if (!Object.hasOwn(lifecycles, caseId)) return null;
  const revision = caseRevisions[caseId]?.at(-1);
  const original = caseById(caseId) ?? caseById(revision?.templateCaseId);
  if (!original || !revision) return null;
  const c = structuredClone(original);
  if (revision.channel) c.channel = revision.channel === "eps" ? "Electronic (EPS)" : "Paper FP10";
  if (c.id !== caseId) {
    const pharmacy = PHARMACIES.find((p) => p.contractorCode === lifecycles[caseId].pharmacyCode);
    if (!pharmacy) return null;
    c.id = caseId;
    c.pharmacy = { name: pharmacy.name, contractorCode: pharmacy.contractorCode };
  }
  if (c.scenario !== "D" && revision.endorsementText !== original.extracted.endorsementText) {
    const text = revision.endorsementText;
    c.extracted.endorsementText = text;
    c.claim.endorsementText = text;
    c.regions = c.regions.map((r) => r.id === "endorsement" ? { ...r, text } : r);
    const facts = interpretPharmacyText(text);
    c.readings = [facts, { ...facts }, { ...facts }];
    c.inCoverage = c.inCoverage && facts.type === "NCSO";
  }
  const capture = lifecycles[caseId].history.filter((event) => event.capture?.revision === revision.number).at(-1)?.capture
    ?? itemProcesses?.[caseId]?.capture;
  if (capture?.revision === revision.number) {
    return immutable({ ...c, capturedEvidence: {
      fields: capture.fields, provenance: capture.provenance === "pharmacy_declaration" ? "pharmacy_declaration" : "human_capture",
      declarationReconciled: capture.declarationReconciled, revision: capture.revision,
    } });
  }
  return immutable(c);
}

/** Snapshots are advisory, but malformed/stale snapshots must not enter history. */
export function validatePrecheck(snapshot: PharmacyPrecheckSnapshot | undefined, text: string, date: string): void {
  if (snapshot === undefined) return;
  const fail = () => { throw new Error("Invalid or stale pharmacy precheck snapshot."); };
  if (!snapshot || snapshot.typedText !== text || snapshot.dispensingDate !== date ||
    !["ready", "missing", "unable", "not_checked"].includes(snapshot.status) ||
    !["scripted", "off", "unavailable", "pending"].includes(snapshot.mode) || !Array.isArray(snapshot.checks)) fail();
  for (const check of snapshot.checks) {
    if (!check || typeof check.id !== "string" || typeof check.label !== "string" || ![true, false, null].includes(check.met)) fail();
  }
  if (![snapshot.tariffVersion, snapshot.clauseId].every((v) => v === null || (typeof v === "string" && v.length > 0))) fail();
  const facts = snapshot.facts;
  if (facts !== null && (!facts || !["NCSO", "BB", "XP", "SP", "NONE", "UNKNOWN"].includes(facts.type) ||
    typeof facts.present !== "boolean" || ![true, false, null].includes(facts.initialled) || ![true, false, null].includes(facts.dated) ||
    facts.quotedText !== text || typeof facts.note !== "string")) fail();
  const version = versionForDate(date);
  if (snapshot.tariffVersion !== null && snapshot.tariffVersion !== version?.version) fail();
  if (snapshot.clauseId !== null && (!snapshot.tariffVersion || !version?.clauses.some((clause) => clause.id === snapshot.clauseId))) fail();
  if (snapshot.status === "not_checked") {
    if (facts !== null || snapshot.checkedAt !== null || snapshot.tariffVersion !== null || snapshot.clauseId !== null || snapshot.checks.length) fail();
  } else {
    if (snapshot.mode !== "scripted" || typeof snapshot.checkedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(snapshot.checkedAt) || !Number.isFinite(Date.parse(snapshot.checkedAt))) fail();
    if (snapshot.status !== "unable" && (!facts || !snapshot.tariffVersion || (!snapshot.clauseId && facts.type !== "NONE") || !snapshot.checks.length)) fail();
    if (snapshot.status === "ready" && snapshot.checks.some((check) => check.met !== true)) fail();
  }
}