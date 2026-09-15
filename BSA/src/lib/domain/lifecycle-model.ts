/** Pure session projections and validation. No persistence or payment authority. */
import { caseById } from "./cases";
import { interpretPharmacyText } from "./pharmacy-check";
import { PHARMACIES, PRODUCTS, productByCode } from "./reference";
import { versionForDate } from "./tariff";
import type { CaseLifecycle, CaseRevision, HistoryEvent, ItemProcess, PharmacyPrecheckSnapshot, ProcessSubmission, Type1Capture } from "./lifecycle";
import type { DeclaredItemFields, EpsPrescription, ExceptionCase, PaperDeclaration } from "./types";

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

/** Human capture authority comes from its append-only event, not routing metadata. */
export function captureForRevision(row: CaseLifecycle, revision: number): Type1Capture | null {
  return row.history.filter((event) => event.actor === "operator" && event.processStep === "type1_capture" &&
    event.capture?.revision === revision).at(-1)?.capture ?? null;
}

function requireDate(date: string): void {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error("A valid dispensing or prescription date is required.");
  }
}

/** Exact synthetic catalogue lookup, never an inferred reading of the image. */
export function paperDeclarationFields(paper: PaperDeclaration): DeclaredItemFields {
  if (!paper || typeof paper.typedProduct !== "string" || typeof paper.endorsementText !== "string" ||
    paper.declaredByPharmacy !== true || paper.quantity !== null && (!Number.isSafeInteger(paper.quantity) || paper.quantity <= 0) ||
    paper.brandManufacturer !== undefined && typeof paper.brandManufacturer !== "string" ||
    paper.form !== undefined && typeof paper.form !== "string" ||
    paper.packSize !== undefined && paper.packSize !== null && (!Number.isSafeInteger(paper.packSize) || paper.packSize <= 0)) {
    throw new Error("Invalid paper declaration.");
  }
  requireDate(paper.dispensingDate);
  const text = paper.typedProduct.trim();
  const product = PRODUCTS.find((item) => item.code === text || item.name.toLowerCase() === text.toLowerCase());
  if (text.startsWith("SYN-") && !product) throw new Error("Unknown synthetic product code.");
  return { productCode: product?.code ?? null, quantity: paper.quantity, endorsementText: paper.endorsementText,
    ...(paper.brandManufacturer !== undefined ? { brandManufacturer: paper.brandManufacturer } : {}),
    ...(paper.packSize !== undefined ? { packSize: paper.packSize } : {}),
    ...(paper.form !== undefined ? { form: paper.form } : {}),
  };
}

/** Corrections change claim selection, never the separately recorded prescription or supply. */
export function validateRetainedEpsSources(previous: EpsPrescription | undefined, next: EpsPrescription | undefined): void {
  if (!previous?.supplyRecord) return;
  if (!next?.supplyRecord) throw new Error("The original EPS supply record must be retained.");
  const sources = (eps: EpsPrescription) => ({
    prescriber: { name: eps.prescriber.name, practice: eps.prescriber.practice }, patientLabel: eps.patientLabel, prescriptionDate: eps.prescriptionDate,
    dispensingDate: eps.dispensingDate, prescriberEndorsement: eps.prescriberEndorsement,
    supplyRecord: eps.supplyRecord ? { productCode: eps.supplyRecord.productCode, quantity: eps.supplyRecord.quantity } : null,
    items: eps.items.map((item) => ({
      prescribedCode: item.prescribedCode, product: item.product, strength: item.strength, form: item.form, quantity: item.quantity, dose: item.dose,
    })),
  });
  if (JSON.stringify(sources(previous)) !== JSON.stringify(sources(next))) {
    throw new Error("A claim correction cannot alter the original prescription or pharmacy supply record.");
  }
}

/** Validate source copies before any state write. Advice cannot replace source fields. */
export function validateSubmissionSources(submission: ProcessSubmission, expectedRevision: number): void {
  if (submission.revision !== undefined && submission.revision !== expectedRevision) throw new Error("Stale submission revision.");
  const { epsPrescription: eps, paperDeclaration: paper, declaration, channel, endorsementText } = submission;
  if (eps !== undefined) {
    if (!eps || channel !== "eps" || paper !== undefined || declaration !== undefined) throw new Error("EPS source does not match the submission channel.");
    if (!Array.isArray(eps.items) || eps.items.length !== 1) throw new Error("Exactly one synthetic EPS item is supported.");
    if (!eps.prescriber || typeof eps.prescriber.name !== "string" || typeof eps.prescriber.practice !== "string" ||
      typeof eps.patientLabel !== "string" || !eps.patientLabel.toLowerCase().includes("synthetic") ||
      typeof eps.prescriberEndorsement !== "string" || typeof eps.dispenserEndorsement !== "string" ||
      eps.dispenserEndorsement !== endorsementText || eps.claimMessageState !== "submitted" ||
      !["exempt", "chargeable", "not_recorded"].includes(eps.exemptionStatus)) throw new Error("Invalid or mismatched EPS claim fields.");
    requireDate(eps.prescriptionDate);
    requireDate(eps.dispensingDate);
    const item = eps.items[0];
    const prescribedName = productByCode(item?.prescribedCode)?.name;
    const presentation = prescribedName ? /^(.*?)\s+([\d/]+(?:mg|mcg)?)\s+(tablets|capsules)(?: \(generic synthetic\))?$/.exec(prescribedName) : null;
    const composedName = item ? `${item.product} ${item.strength} ${item.form}` : "";
    if (!item || !productByCode(item.prescribedCode) || !productByCode(item.dispensedCode) ||
      !eps.supplyRecord && item.prescribedCode !== item.dispensedCode ||
      prescribedName !== item.product && prescribedName?.replace(" (generic synthetic)", "") !== composedName ||
      !presentation || item.strength !== presentation[2] || item.form !== presentation[3] ||
      productByCode(item.dispensedCode)?.name !== item.dispensedName ||
      !Number.isSafeInteger(item.quantity) || item.quantity <= 0 ||
      [item.strength, item.form, item.dose].some((value) => typeof value !== "string")) throw new Error("Invalid synthetic EPS item or product copy.");
    const supply = eps.supplyEvidence;
    if (eps.supplyRecord !== undefined && (!eps.supplyRecord || !productByCode(eps.supplyRecord.productCode) ||
      !Number.isSafeInteger(eps.supplyRecord.quantity) || eps.supplyRecord.quantity <= 0)) {
      throw new Error("Invalid independent pharmacy supply record.");
    }
    if (supply !== undefined && (!supply || supply.ruleId !== "SYN-EPS-SUPPLY" ||
      typeof supply.brandManufacturer !== "string" || typeof supply.form !== "string" ||
      supply.packSize !== null && (!Number.isSafeInteger(supply.packSize) || supply.packSize <= 0))) {
      throw new Error("Invalid synthetic EPS supply evidence.");
    }
  }
  if (paper !== undefined) {
    if (channel !== "paper" || eps !== undefined) throw new Error("Paper declaration does not match the submission channel.");
    const fields = paperDeclarationFields(paper);
    if (paper.endorsementText !== endorsementText || declaration &&
      (declaration.fields.productCode !== fields.productCode || declaration.fields.quantity !== fields.quantity ||
        declaration.fields.endorsementText !== fields.endorsementText ||
        declaration.fields.brandManufacturer !== fields.brandManufacturer || declaration.fields.packSize !== fields.packSize ||
        declaration.fields.form !== fields.form)) throw new Error("Paper declaration copies do not match.");
  }
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
  let c = structuredClone(original);
  if (revision.paperSource) {
    const scan = revision.paperSource.scan;
    c = { ...c, extracted: { ...scan.extracted }, regions: scan.regions, imageQuality: scan.imageQuality, imageStyle: scan.imageStyle };
  }
  if (revision.channel) c.channel = revision.channel === "eps" ? "Electronic (EPS)" : "Paper FP10";
  if (c.id !== caseId) {
    const pharmacy = PHARMACIES.find((p) => p.contractorCode === lifecycles[caseId].pharmacyCode);
    if (!pharmacy) return null;
    c.id = caseId;
    c.pharmacy = { name: pharmacy.name, contractorCode: pharmacy.contractorCode };
  }
  if (revision.epsPrescription) {
    const eps = revision.epsPrescription, item = eps.items[0];
    c = { ...c, epsPrescription: eps };
    c.patientLabel = eps.patientLabel;
    c.extracted = { ...c.extracted, productCode: item.dispensedCode, productText: item.dispensedName,
      quantity: item.quantity, endorsementText: eps.dispenserEndorsement, dispensingDate: eps.dispensingDate,
      prescriber: eps.prescriber.name, productConfidence: 1, quantityConfidence: 1, endorsementConfidence: 1 };
    c.claim = { ...c.claim, submittedVia: "EPS claim message" };
    c.regions = [];
    const facts = interpretPharmacyText(eps.dispenserEndorsement);
    c.readings = [facts, { ...facts }, { ...facts }];
  }
  if (revision.paperDeclaration) {
    c = { ...c, paperDeclaration: revision.paperDeclaration };
    c.extracted.dispensingDate = revision.paperDeclaration.dispensingDate;
  }
  const humanDecision = lifecycles[caseId].history.filter((event) => event.revision === revision.number && event.actor === "operator" && event.decision).at(-1);
  if (humanDecision?.to === "paid") c = { ...c, humanPricingConfirmed: true, initialState: "human_decision_recorded" };
  if ((["resubmission", "confirmation"].includes(revision.kind) || revision.kind !== "seed" && humanDecision) && humanDecision?.to !== "paid") {
    c = { ...c, requiresHumanRecheck: true, initialState: "operator_review_required" };
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
  if (facts !== null && (!facts || !["NCSO", "BB", "XP", "SP", "SUPPLY", "NONE", "UNKNOWN"].includes(facts.type) ||
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