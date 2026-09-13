/** Synthetic month for the single operational pharmacy. */
import { CASES } from "./cases";
import { HILLCREST_PHARMACY, productByCode } from "./reference";
import { type CaseLifecycle, type CaseRevision, type HistoryEvent, type LifecycleState } from "./lifecycle";
import { immutable } from "./lifecycle-model";

const canonicalStates: LifecycleState[] = ["paid", "referred_back", "information_requested", "in_review", "paid", "referred_back"];
const templates: Record<LifecycleState, number> = { submitted: 1, in_review: 3, information_requested: 2, referred_back: 1, resubmitted: 1, paid: 0, escalated: 3 };

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
      channel: c.claim.submittedVia === "EPS claim message" ? "eps" : "paper",
      ...(caseId === CASES[3].id ? { declaration: {
        fields: { productCode: c.claim.productCode, quantity: c.claim.quantity, endorsementText: "NCSO JB 27/08/26" },
        declaredAt: history[0].at, provenance: "pharmacy_declaration" as const,
      }, paperDeclaration: { typedProduct: "Co-codamol 30/500 tablets", quantity: 100, endorsementText: "NCSO JB 27/08/26",
        dispensingDate: "2026-08-27", declaredByPharmacy: true as const } } : {}),
    }];
  };
  CASES.forEach((c, i) => add(c.id, c.pharmacy.contractorCode, canonicalStates[i], i));
  add("SYN-FQ123-TYPE2", HILLCREST_PHARMACY.contractorCode, "in_review", 4);
  const pending = caseRevisions["SYN-FQ123-TYPE2"][0];
  const generic = productByCode("SYN-AMOX500-GENERIC-21")!;
  caseRevisions["SYN-FQ123-TYPE2"] = [{ ...pending, epsPrescription: {
    prescriber: { name: CASES[4].extracted.prescriber, practice: "Hillcrest practice (synthetic)" },
    patientLabel: "Generic example patient (synthetic)", prescriptionDate: "2026-08-11", dispensingDate: "2026-08-11",
    items: [{ prescribedCode: generic.code, product: generic.name, strength: "500mg", form: "capsules", quantity: 21,
      dose: "Synthetic instruction, not for clinical use", dispensedCode: generic.code, dispensedName: generic.name }],
    prescriberEndorsement: "", dispenserEndorsement: "", exemptionStatus: "not_recorded", claimMessageState: "submitted",
    supplyEvidence: { ruleId: "SYN-EPS-SUPPLY", brandManufacturer: "", packSize: 21, form: "capsules" },
  } }];
  add("SYN-FQ123-RECHECK", HILLCREST_PHARMACY.contractorCode, "referred_back", 1);
  const appendCorrection = (id: string, text: string, at: string) => {
    const previous = caseRevisions[id][0], row = lifecycles[id];
    caseRevisions[id] = [...caseRevisions[id], { ...previous, number: 2, at, kind: "resubmission", endorsementText: text }];
    row.history.push({ at, actor: "pharmacy", from: "referred_back", to: "resubmitted", revision: 2, channel: "eps",
      processStep: "resubmission", message: "Pharmacy corrected the endorsement and resubmitted; human re-check required." });
    row.state = "resubmitted";
  };
  appendCorrection("SYN-FQ123-RECHECK", "NCSO RK 21/08/26", "2026-09-04T09:00:00.000Z");
  // Preserve F's original three events and decision. The later story has its own revision and record.
  appendCorrection(CASES[5].id, "NCSO DL 06/08/26", "2026-09-04T09:01:00.000Z");
  const f = lifecycles[CASES[5].id];
  f.history.push(
    { at: "2026-09-04T09:02:00.000Z", actor: "code", from: "resubmitted", to: "in_review", revision: 2, channel: "eps", message: "Corrected item arrived for human re-check." },
    { at: "2026-09-04T09:03:00.000Z", actor: "operator", from: "in_review", to: "paid", revision: 2, channel: "eps",
      processStep: "type2_judgement", recordId: "DR-000872", decision: "ACCEPT", recommendation: "NONE",
      reason: "Human checked the corrected initials and date.", message: "Human accepted the corrected endorsement (synthetic)." },
    { at: "2026-09-04T09:03:00.001Z", actor: "code", from: "paid", to: "paid", revision: 2, channel: "eps",
      processStep: "existing_pricing", message: "Priced by NHSBSA's existing rules engine after human judgement; normal payment schedule (synthetic)." },
  );
  f.state = "paid";
  for (const id of [CASES[1].id, "SYN-FQ123-RECHECK"]) {
    const referral = lifecycles[id].history.find((event) => event.to === "referred_back")!;
    Object.assign(referral, { rbCode: "SYN-NCSO", processStep: "referral", exactFix: "Add the endorsement date beside the initials." });
  }
  return immutable({ lifecycles, caseRevisions });
}

export function seededLifecycles(): Record<string, CaseLifecycle> {
  return seededLifecycleSession().lifecycles;
}