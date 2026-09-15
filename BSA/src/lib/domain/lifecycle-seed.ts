import { historicalLifecycleFixtures } from "../../../data/archive/lifecycle-fixtures";
export { historicalLifecycleFixtures };
/** Synthetic month for the single operational pharmacy. */
import { PLAYABLE_CASE_IDS, caseById, playableCaseChannel } from "./cases";
import { createEpsPrescription } from "./eps-check";
import { HILLCREST_PHARMACY } from "./reference";
import { type CaseLifecycle, type CaseRevision } from "./lifecycle";
import { immutable } from "./lifecycle-model";
import { createPaperSubmissionSource } from "./paper-source";
import { correctionFingerprint } from "./correction-acknowledgement";
import { buildReferralNote } from "./referral-wording";
import { evaluateItemVerification } from "./verification";




/** Fresh deeply immutable seeds. Metadata-only rows use explicitly synthetic templates. */


/** Four playable items only. Historical fixtures remain read-only test evidence. */
export function seededLifecycleSession(): ReturnType<typeof historicalLifecycleFixtures> {
  const lifecycles: Record<string, CaseLifecycle> = {}, caseRevisions: Record<string, readonly CaseRevision[]> = {};
  const at = "2026-09-14T09:00:00.000Z";
  for (const id of PLAYABLE_CASE_IDS) {
    const c = caseById(id)! , channel = playableCaseChannel(id)!;
    const paperDeclaration = c.paperDeclaration;
    const declaration = paperDeclaration ? { declaredAt: at, provenance: "pharmacy_declaration" as const,
      fields: { productCode: c.claim.productCode, quantity: paperDeclaration.quantity, endorsementText: paperDeclaration.endorsementText,
        ...(c.pharmacySupplyRecord?.prescriber ? { prescriber: c.pharmacySupplyRecord.prescriber } : {}),
        ...(paperDeclaration.brandManufacturer !== undefined ? { brandManufacturer: paperDeclaration.brandManufacturer,
          packSize: paperDeclaration.packSize, form: paperDeclaration.form } : {}) } } : undefined;
    let revision: CaseRevision = { number: 1, at, kind: "seed", templateCaseId: id,
      endorsementText: paperDeclaration?.endorsementText ?? c.epsPrescription?.dispenserEndorsement ?? c.extracted.endorsementText,
      channel, precheck: null, confirmation: null, declaration, paperDeclaration,
      ...(channel === "eps" ? { epsPrescription: { ...(c.epsPrescription ?? createEpsPrescription(c)), claimMessageState: "submitted" } } : {}) };
    if (channel === "paper") revision = { ...revision, paperSource: createPaperSubmissionSource(c, revision) };
    if (id === "SYN-FQ123-MISMATCH") revision = { ...revision, verificationEnabled: true };
    const row: CaseLifecycle = { caseId: id, pharmacyCode: HILLCREST_PHARMACY.contractorCode, state: "submitted",
      history: [{ at, actor: "pharmacy", from: null, to: "submitted", revision: 1, channel, processStep: "submission",
        message: "Synthetic pharmacy submission retained exactly." }] };
    if (revision.verificationEnabled) {
      const assessment = evaluateItemVerification(c, revision, true);
      row.history.push({ at, actor: "code", from: "submitted", to: "submitted", revision: 1,
        processStep: "verification", verification: assessment.verification, message: assessment.reason });
    }
    if (id === "EX-24107") {
      row.history.push({ at, actor: "code", from: "submitted", to: "paid", revision: 1, channel,
        processStep: "automatic_pricing", message: "Priced by NHSBSA's existing rules engine, no person involved." });
      row.state = "paid";
    } else {
      row.history.push({ at, actor: "code", from: "submitted", to: "in_review", revision: 1, channel,
        message: "Synthetic item routed for human review." });
      row.state = "in_review";
    }
    if (id === "SYN-FQ123-MISMATCH" || id === "EX-24112") {
      const note = buildReferralNote([{ rule: id === "EX-24112" ? "brand_required_for_multiple_suppliers" : "strength_matches_prescription" }]);
      row.history.push({ at: "2026-09-14T09:01:00.000Z", actor: "operator", from: "in_review", to: "referred_back",
        revision: 1, channel, processStep: "referral", decision: "REFER_BACK", rbCode: "RB2B", reason: note, message: note,
        ...(id === "EX-24112" ? { clauseId: "SYN-EPS-SUPPLY", tariffVersion: "2026-08" } : {}),
        approvedDraft: { text: note, approvedAt: "2026-09-14T09:01:00.000Z", approvedBy: "Synthetic historical operator",
          decision: "REFER_BACK", clauseId: id === "EX-24112" ? "SYN-EPS-SUPPLY" : null,
          tariffVersion: id === "EX-24112" ? "2026-08" : "not_applicable", provenance: "verified_findings" } });
      row.state = "referred_back";
    }
    caseRevisions[id] = [revision]; lifecycles[id] = row;
    if (id === "EX-24112") {
      const corrected = { ...revision, declaration: { ...declaration!, fields: c.pharmacySupplyRecord! },
        paperDeclaration: { ...paperDeclaration!, brandManufacturer: c.pharmacySupplyRecord!.brandManufacturer } };
      const acknowledgement = { revision: 1, fingerprint: correctionFingerprint({ revision: 1, channel: "paper",
        endorsementText: corrected.endorsementText, declaration: corrected.declaration, paperDeclaration: corrected.paperDeclaration }) };
      let resubmitted: CaseRevision = { ...corrected, number: 2, at: "2026-09-14T09:03:00.000Z", kind: "resubmission",
        verificationEnabled: true, correctionAcknowledgement: acknowledgement };
      resubmitted = { ...resubmitted, paperSource: createPaperSubmissionSource(c, resubmitted) };
      caseRevisions[id] = [revision, resubmitted];
      row.history.push(
        { at: "2026-09-14T09:02:00.000Z", actor: "pharmacy", from: "referred_back", to: "referred_back",
          revision: 1, processStep: "correction_acknowledged", correctionAcknowledgement: acknowledgement, message: "Pharmacy confirmed the corrected brand information is accurate." },
        { at: resubmitted.at, actor: "pharmacy", from: "referred_back", to: "resubmitted", revision: 2,
          processStep: "resubmission", message: "Acknowledged paper amendment resubmitted; operator release remains required." },
        { at: resubmitted.at, actor: "code", from: "resubmitted", to: "resubmitted", revision: 2,
          processStep: "verification", verification: evaluateItemVerification(c, resubmitted, true).verification,
          message: "Corrected paper evidence rechecked; ready for the operator's release." },
      );
      row.state = "resubmitted";
    }
  }
  return immutable({ lifecycles, caseRevisions });
}

export function seededLifecycles(): Record<string, CaseLifecycle> {
  return seededLifecycleSession().lifecycles;
}