/** Offline scripted interpretation and shared deterministic checks, never a live model. */
import { productByCode } from "./reference";
import { AGREEMENT_THRESHOLD, QUALITY_THRESHOLD, endorsementRequired, evaluateRequirements, mandatoryFieldsCheck, sampleAgreement, validateCitation } from "./rules";
import { versionForDate } from "./tariff";
import type { EndorsementFacts, ExceptionCase, TariffClause } from "./types";
import type { PharmacyPrecheckSnapshot } from "./lifecycle";

export type PharmacyScenario = "A" | "B" | "D";
export const PHARMACY_CHECK_MS = 2000;
export const PHARMACY_STEPS = ["Captured", "Endorsement type", "Dispensing-date version", "Clause", "Requirements"] as const;
export type PharmacyStepStatus = "PASS" | "MISSING" | "STOPPED" | "NOT RUN";
export interface PharmacyCheck {
  status: "ready" | "missing" | "unable";
  facts: EndorsementFacts | null;
  version: string | null;
  clause: TariffClause | null;
  checks: { id: string; label: string; met: boolean | null }[];
  stages: PharmacyStepStatus[];
  gap: string;
  agreement: string;
}

/** Strict calendar dates, not arbitrary digit pairs. All readings are scripted. */
export function interpretPharmacyText(text: string): EndorsementFacts {
  const type = /\bncso\b/i.test(text) ? "NCSO" : /\bbb\b/i.test(text) ? "BB" : /\bxp\b/i.test(text) ? "XP" : text.trim() ? "UNKNOWN" : "NONE";
  const dated = [...text.matchAll(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\b/g)].some((match) => {
    const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]) + (match[3].length === 2 ? 2000 : 0);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  });
  return { type, present: Boolean(text.trim()), initialled: /\b[A-Z]{2,3}\b/.test(text.replace(/\b(?:NCSO|BB|XP)\b/gi, "")), dated, quotedText: text, note: "Scripted typed-field reading" };
}

export function pharmacyDateCorrection(c: ExceptionCase, text: string): string {
  const facts = interpretPharmacyText(text);
  if (c.scenario !== "B" || facts.type !== "NCSO" || !facts.initialled || facts.dated) return text;
  const [year, month, day] = c.extracted.dispensingDate.split("-");
  return `${text.trimEnd()} ${day}/${month}/${year.slice(2)}`;
}

/** Clone-only projection; never mutate fixtures, readings or the canonical gate. */
export function checkPharmacy(c: ExceptionCase, text: string): PharmacyCheck {
  const stop = (stage: number, gap: string, agreement = "NOT RUN", facts: EndorsementFacts | null = null, version: string | null = null): PharmacyCheck => ({
    status: "unable", facts, version, clause: null, checks: [], gap, agreement,
    stages: PHARMACY_STEPS.map((_, index) => index < stage ? "PASS" : index === stage ? "STOPPED" : "NOT RUN"),
  });
  // D stops before rule retrieval, even when a user types a plausible replacement.
  if (c.scenario === "D" || c.imageQuality < QUALITY_THRESHOLD || !productByCode(c.extracted.productCode)) return stop(0, "Capture uncertain; manual review");
  const interpreted = interpretPharmacyText(text);
  const readings = text === c.extracted.endorsementText ? c.readings : [interpreted, { ...interpreted }, { ...interpreted }];
  const consensus = sampleAgreement(readings);
  const agreement = `${consensus.agree}/${consensus.total} scripted readings`;
  if (consensus.agree < AGREEMENT_THRESHOLD || !consensus.consensus || ["UNKNOWN", "NONE"].includes(consensus.consensus.type)) return stop(1, "Endorsement type unresolved", agreement);
  const facts = { ...consensus.consensus, quotedText: text, note: "Scripted typed-field reading" };
  // Validated pharmacy coverage is NCSO only, not any type with a tariff clause.
  if (facts.type !== "NCSO") return stop(1, "Outside validated NCSO coverage; manual review", agreement, facts);
  const version = versionForDate(c.extracted.dispensingDate);
  if (!version) return stop(2, "Dispensing-date version unresolved", agreement, facts);
  const clause = version.clauses.find((entry) => entry.endorsementType === facts.type) ?? null;
  if (!clause || validateCitation(clause, version, clause.text) !== true) return stop(3, "No validated clause", agreement, facts, version.version);
  const extracted = { ...c.extracted, endorsementText: text };
  const requirements = evaluateRequirements(clause, facts, extracted);
  const required = endorsementRequired(productByCode(extracted.productCode), version, c.claim.amountClaimed);
  const checks = [
    ...mandatoryFieldsCheck(extracted).map((entry, index) => ({ id: `mandatory-${index}`, label: entry.name, met: entry.pass })),
    ...requirements.map((entry) => ({ id: entry.requirement.id, label: entry.requirement.label, met: entry.met })),
  ];
  const complete = required.required !== null && checks.length > 0 && checks.every((entry) => entry.met === true);
  return { status: complete ? "ready" : "missing", facts, version: version.version, clause: structuredClone(clause), checks,
    stages: ["PASS", "PASS", "PASS", "PASS", complete ? "PASS" : "MISSING"],
    gap: complete ? "None" : checks.filter((entry) => entry.met !== true).map((entry) => entry.label).join(", "), agreement };
}

export function pharmacySnapshot(text: string, dispensingDate: string, mode: PharmacyPrecheckSnapshot["mode"], result: PharmacyCheck | null, checkedAt: string | null): PharmacyPrecheckSnapshot {
  const completed = mode === "scripted" && result !== null && checkedAt !== null;
  return { typedText: text, dispensingDate, mode, facts: completed ? result.facts : null,
    tariffVersion: completed ? result.version : null, clauseId: completed ? result.clause?.id ?? null : null,
    checkedAt: completed ? checkedAt : null, status: completed ? result.status : "not_checked", checks: completed ? result.checks : [] };
}

/** Timeline preset only, not a hidden Off-mode precheck or a payment decision. */
export function completePharmacyScenario(c: ExceptionCase, text: string, result: PharmacyCheck | null): boolean {
  if (c.scenario === "D") return false;
  if (result?.status === "ready") return true;
  // Recognise only the known complete A and explicitly date-corrected B fixtures.
  // Other unassisted edits stay on the uncertain illustrative manual path.
  const completeText = c.scenario === "A" ? c.extracted.endorsementText
    : c.scenario === "B" ? pharmacyDateCorrection(c, c.extracted.endorsementText) : null;
  return completeText !== null && text === completeText;
}

export interface CheckRevision { key: string; phase: number; result: PharmacyCheck | null; checkedAt: string | null }
/** Cancellation and revision identity are testable without React or a browser. */
export class PharmacyCheckRunner {
  private revision = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private listeners = new Set<() => void>();
  private value: CheckRevision = { key: "", phase: 0, result: null, checkedAt: null };
  getSnapshot = () => this.value;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(value: CheckRevision) { this.value = value; this.listeners.forEach((listener) => listener()); }
  cancel = () => { this.revision++; this.timers.forEach(clearTimeout); this.timers = []; };
  start(key: string, c: ExceptionCase, text: string, enabled: boolean, reduced: boolean) {
    this.cancel();
    const revision = this.revision;
    this.publish({ key, phase: 0, result: null, checkedAt: null });
    if (!enabled) return;
    const complete = () => { if (revision === this.revision) this.publish({ key, phase: PHARMACY_STEPS.length, result: checkPharmacy(c, text), checkedAt: new Date().toISOString() }); };
    if (reduced) { complete(); return; }
    for (let phase = 1; phase < PHARMACY_STEPS.length; phase++) this.timers.push(setTimeout(() => {
      if (revision === this.revision) this.publish({ key, phase, result: null, checkedAt: null });
    }, PHARMACY_CHECK_MS * phase / PHARMACY_STEPS.length));
    this.timers.push(setTimeout(complete, PHARMACY_CHECK_MS));
  }
}