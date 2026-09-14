import { beforeEach, describe, expect, it } from "vitest";
import { caseById, PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { historicalLifecycleFixtures } from "../../src/lib/domain/lifecycle-seed";
import { NO_VERIFICATION, itemStateLabel } from "../../src/lib/domain/lifecycle";
import { evaluateItemVerification } from "../../src/lib/domain/verification";
import { checkPharmacyCorrection, initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { getDomainSnapshot, getReleaseEligibility, sessionCase, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState();
const mismatch = "SYN-FQ123-MISMATCH", readable = "SYN-FQ123-READABLE", b = "EX-24112", d = "EX-24123";
beforeEach(() => store().resetDemo());
function send(id: string, enabled: boolean) {
  store().setAgentEnabled(enabled);
  const revision = store().caseRevisions[id].at(-1)!;
  const draft = initialisePharmacyDraft(sessionCase(id)!, revision);
  store().submitItem({ ...draft, caseId: id, channel: draft.channel!, revision: revision.number });
}

describe("authoritative two-gate source verification", () => {
  it.each([false, true])("wrong-but-complete pack never releases, enabled=%s", (enabled) => {
    send(mismatch, enabled);
    expect(store().itemVerification[mismatch]).toEqual(enabled
      ? { gate1: "pass", gate2: "fail", reconciled: false, released: false } : NO_VERIFICATION);
    expect(store().itemProcesses[mismatch].routing).toMatchObject({ requiresHuman: true, pricingAuthority: null });
    store().arriveInQueue(mismatch);
    expect(getReleaseEligibility(mismatch).allowed).toBe(false);
    expect(() => store().releaseToPricing(mismatch, "I choose to ignore the mismatched pack")).toThrow();
    expect(() => store().recordType2Decision({ caseId: mismatch, decision: "ACCEPT", reason: "Ignore the mismatch" })).toThrow();
    expect(store().lifecycles[mismatch].state).toBe("in_review");
  });

  it.each(["EX-24107"])("matching %s releases automatically only on explicit On submission", (id) => {
    const before = getDomainSnapshot();
    store().setAgentEnabled(true);
    expect(getDomainSnapshot()).toEqual(before);
    send(id, true);
    expect(store().itemVerification[id]).toEqual({ gate1: "pass", gate2: "pass", reconciled: true, released: true });
    expect(store().lifecycles[id].state).toBe("released_to_pricing");
    expect(store().lifecycles[id].history.at(-1)).toMatchObject({ actor: "code", releaseOrigin: "automatic_verification", revision: 2 });
    expect(itemStateLabel(store().lifecycles[id], "nhsbsa")).toContain("no operator action");
  });

  it("missing date fails format and actual received requirements", () => {
    send(b, true);
    expect(store().itemVerification[b]).toMatchObject({ gate1: "fail", gate2: "fail", released: false });
    expect(store().lifecycles[b].state).toBe("submitted");
  });

  it("readable scan does not corroborate an edited declaration", () => {
    const original = caseById(readable)!;
    const revision = historicalLifecycleFixtures().caseRevisions[readable][0];
    const paperDeclaration = { ...revision.paperDeclaration!, quantity: 56 };
    const result = evaluateItemVerification(original, { ...revision, paperDeclaration, declaration: undefined }, true);
    expect(result.verification).toEqual({ gate1: "pass", gate2: "fail", reconciled: false, released: false });
  });

  it("unreadable D declaration passes format but never claims to read or automatically release its scan", () => {
    send(d, true);
    expect(store().itemVerification[d]).toEqual({ gate1: "pass", gate2: "fail", reconciled: false, released: false });
    expect(store().itemProcesses[d].routing.outcome).toBe("type1_capture");
    expect(getReleaseEligibility(d).allowed).toBe(false);
  });

  it.each([false, true])("explicit D capture permits only human-attributed release, enabled=%s", (enabled) => {
    const fields = { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO JB 27/08/26", prescriber: "Dr Example (synthetic)" };
    store().setAgentEnabled(enabled);
    store().submitItem({ caseId: d, channel: "paper", endorsementText: fields.endorsementText,
      declaration: { fields, declaredAt: "2026-09-14T10:00:00Z", provenance: "pharmacy_declaration" } });
    store().confirmType1({ caseId: d, revision: 2, fields, provenance: "pharmacy_declaration", declarationReconciled: true });
    expect(getReleaseEligibility(d).allowed).toBe(true);
    expect(() => store().releaseToPricing(d, "short")).toThrow("reason");
    store().releaseToPricing(d, "I checked the declared facts against the source.");
    expect(store().lifecycles[d].state).toBe("released_to_pricing");
    expect(store().lifecycles[d].history.at(-1)).toMatchObject({ actor: "operator", releaseOrigin: "human_decision", decision: "ACCEPT" });
    expect(store().itemVerification[d]).toEqual(enabled
      ? { gate1: "pass", gate2: "pass", reconciled: true, released: true }
      : { gate1: "none", gate2: "none", reconciled: false, released: true });
    expect(itemStateLabel(store().lifecycles[d], "nhsbsa")).toContain("after operator review");
    expect(itemStateLabel(store().lifecycles[d], "nhsbsa")).not.toContain("no operator");
  });

  it("mutable passing metadata and a drafted sufficient outcome cannot bypass independent facts", () => {
    send(mismatch, true);
    store().arriveInQueue(mismatch);
    store().setOperatorDraft(mismatch, { revision: 2, outcome: "ACCEPT", rbCode: "", note: "Looks complete to me" });
    useAppStore.setState({ itemVerification: { ...store().itemVerification, [mismatch]: { gate1: "pass", gate2: "pass", reconciled: true, released: false } } });
    const before = getDomainSnapshot();
    expect(() => store().releaseToPricing(mismatch)).toThrow();
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("changing received EPS product and quantity does not rewrite its independent claim ledger", () => {
    const original = initialisePharmacyDraft(sessionCase(b)!, store().caseRevisions[b][0]);
    const epsPrescription = { ...original.epsPrescription!, items: [{ ...original.epsPrescription!.items[0], quantity: 56 }],
      dispenserEndorsement: "NCSO RK 21/08/26" };
    store().setAgentEnabled(true);
    store().submitItem({ caseId: b, channel: "eps", endorsementText: epsPrescription.dispenserEndorsement, epsPrescription });
    expect(sessionCase(b)!.claim.quantity).toBe(28);
    expect(store().itemVerification[b]).toMatchObject({ gate1: "pass", gate2: "fail", reconciled: false, released: false });
  });

  it("retains exact operational snapshots through toggles, perspectives and all demo steps", () => {
    send(mismatch, true);
    store().arriveInQueue(mismatch);
    store().setOperatorDraft(mismatch, { revision: 2, outcome: "REFER_BACK", rbCode: "RB2B", note: "Check the mismatched pack" });
    const before = getDomainSnapshot();
    for (const enabled of [false, true]) for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
      store().setAgentEnabled(enabled); store().setPerspective(perspective);
      for (let step = 1; step <= 11; step++) store().setDemoStep(step);
      expect(getDomainSnapshot()).toEqual(before);
    }
    expect(before.lifecycles[mismatch].history.at(-1)?.at).toBeTruthy();
  });

  it("a new submission invalidates release, drafts and capture, preserving old history", () => {
    const id = "EX-24107";
    send(id, true);
    const before = structuredClone(store().lifecycles[id].history);
    store().setPharmacyDraft(id, { ...initialisePharmacyDraft(sessionCase(id)!, store().caseRevisions[id].at(-1)!) });
    send(id, false);
    expect(store().itemVerification[id]).toEqual(NO_VERIFICATION);
    expect(store().itemProcesses[id].releaseOrigin).toBeUndefined();
    expect(store().pharmacyDrafts[id]).toBeUndefined();
    expect(store().lifecycles[id].history.slice(0, before.length)).toEqual(before);
    expect(() => store().setPharmacyDraft(id, { revision: 2, endorsementText: "old" })).toThrow("stale");
  });

  it("Apply suggestion fills a draft; final matching referral explicitly approves the note; pharmacy Apply is separate", () => {
    send(b, true);
    store().arriveInQueue(b);
    store().applySuggestionToDecision(b);
    expect(store().records).toHaveLength(0);
    const draft = store().operatorDrafts[b];
    store().referBack(b, draft.rbCode, draft.note);
    expect(store().records.at(-1)?.approvedDraft?.text).toBe(draft.note);
    const revision = store().caseRevisions[b].at(-1)!;
    store().applySuggestedCorrection(b);
    expect(store().lifecycles[b].state).toBe("referred_back");
    expect(store().lifecycles[b].history.at(-1)?.actor).toBe("pharmacy");
    expect(checkPharmacyCorrection(sessionCase(b)!, revision, store().pharmacyDrafts[b]).status).toBe("ready");
    expect(store().caseRevisions[b].at(-1)).toBe(revision);
    store().resubmit(b);
    expect(store().caseRevisions[b].at(-1)?.number).toBe(3);
    expect(store().itemVerification[b].released).toBe(false);
    store().arriveInQueue(b);
    store().releaseToPricing(b, "Corrected date checked by the operator.");
    expect(itemStateLabel(store().lifecycles[b], "nhsbsa")).toContain("after operator review");
  });

  it("generic correction fills actual source fields and never approves or submits from Apply", () => {
    const id = mismatch;
    store().setAgentEnabled(true);
    store().applySuggestedCorrection(id);
    expect(store().pharmacyDrafts[id].epsPrescription?.supplyEvidence).toMatchObject({ brandManufacturer: "Demo manufacturer (synthetic)", packSize: 21, form: "capsules" });
    expect(store().lifecycles[id].state).toBe("in_review");
    expect(store().caseRevisions[id]).toHaveLength(1);
  });

  it("keeps exactly four operational identities and blocks every background action", () => {
    for (const map of [store().lifecycles, store().caseRevisions, store().itemProcesses, store().itemVerification, store().caseStates]) {
      expect(Object.keys(map).sort()).toEqual([...PLAYABLE_CASE_IDS].sort());
    }
    for (const id of ["EX-24119", "EX-24101", "EX-24088", readable, "SYN-FQ123-TYPE2", "SYN-FQ123-RECHECK"]) {
      expect(sessionCase(id)).toBeNull();
      expect(() => store().followCase(id)).toThrow("Unknown");
      expect(() => store().submitItem({ caseId: id, channel: "eps", endorsementText: "" })).toThrow("Unknown");
    }
  });

  it("validates human-confirmed seed D without treating its retained scan text as the declaration", () => {
    const seed = store().caseRevisions[d][0], snapshot = structuredClone(seed);
    store().setAgentEnabled(true);
    store().confirmType1({ caseId: d, revision: 1, provenance: "human_capture", declarationReconciled: true,
      fields: { ...seed.declaration!.fields, prescriber: "Separately established synthetic prescriber" } });
    expect(getReleaseEligibility(d).allowed).toBe(true);
    expect(store().caseRevisions[d][0]).toEqual(snapshot);
    expect(caseById(d)!.extracted.endorsementText).not.toBe(seed.declaration!.fields.endorsementText);
  });

  it.each([false, true])("retains actual applied advice provenance on Release even after toggle Off=%s", (off) => {
    store().setAgentEnabled(true);
    store().resubmitFromPharmacy(b, "NCSO RK 21/08/26");
    store().arriveInQueue(b);
    store().applySuggestionToDecision(b);
    const evidence = store().lifecycles[b].history.at(-1)!.appliedSuggestionEvidence!;
    expect(evidence.recommendation).toBe("SUFFICIENT");
    if (off) store().setAgentEnabled(false);
    store().releaseToPricing(b, "Human checked the supplied corrected date.");
    const record = store().records.at(-1)!;
    expect(record.recommendation).toBe("SUFFICIENT");
    expect(record.agentVersion).toBe(evidence.agentVersion);
    expect(record.agentVersion).not.toBe("not invoked");
    expect(record.sources).toEqual(expect.arrayContaining(evidence.sources));
    expect(record.checks).toEqual(expect.arrayContaining(evidence.checks));
    expect(record.isOverride).toBe(false);
  });

  it("paper draft edits synchronise only the derived declaration, retaining separately entered prescriber", () => {
    const revision = store().caseRevisions[d][0], before = structuredClone(revision);
    const draft = initialisePharmacyDraft(sessionCase(d)!, revision);
    store().setPharmacyDraft(d, { ...draft, paperDeclaration: { ...draft.paperDeclaration!, quantity: 50 },
      declaration: { ...draft.declaration!, fields: { ...draft.declaration!.fields, prescriber: "Human supplied synthetic prescriber" } } });
    expect(store().pharmacyDrafts[d].declaration?.fields).toMatchObject({ quantity: 50, prescriber: "Human supplied synthetic prescriber" });
    expect(store().caseRevisions[d][0]).toEqual(before);
    expect(store().itemVerification[d]).toEqual(NO_VERIFICATION);
  });

  it("explicit new-attempt Apply works on seeded B without approving its historical referral", () => {
    store().setAgentEnabled(true);
    expect(() => store().applySuggestedCorrection(b)).toThrow("operator-approved");
    const revision = store().caseRevisions[b][0];
    store().setPharmacyDraft(b, { ...initialisePharmacyDraft(sessionCase(b)!, revision), purpose: "new_submission" });
    store().applySuggestedCorrection(b);
    expect(store().pharmacyDrafts[b].endorsementText).toContain("21/08/26");
    expect(store().records).toHaveLength(0);
    expect(store().lifecycles[b].state).toBe("referred_back");
    expect(store().caseRevisions[b][0]).toBe(revision);
    expect(() => store().resubmit(b)).toThrow("explicit new attempt");
    store().submitItem({ ...store().pharmacyDrafts[b], caseId: b, channel: "eps" });
    expect(store().lifecycles[b].state).toBe("released_to_pricing");
  });
});
