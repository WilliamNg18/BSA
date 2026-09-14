import { beforeEach, describe, expect, it } from "vitest";
import { caseById } from "../../src/lib/domain/cases";
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

  it.each(["EX-24107", "EX-24101", readable])("matching %s releases automatically only on explicit On submission", (id) => {
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
    const revision = store().caseRevisions[readable][0];
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
    send(readable, true);
    const before = structuredClone(store().lifecycles[readable].history);
    store().setPharmacyDraft(readable, { ...initialisePharmacyDraft(sessionCase(readable)!, store().caseRevisions[readable].at(-1)!) });
    send(readable, false);
    expect(store().itemVerification[readable]).toEqual(NO_VERIFICATION);
    expect(store().itemProcesses[readable].releaseOrigin).toBeUndefined();
    expect(store().pharmacyDrafts[readable]).toBeUndefined();
    expect(store().lifecycles[readable].history.slice(0, before.length)).toEqual(before);
    expect(() => store().setPharmacyDraft(readable, { revision: 2, endorsementText: "old" })).toThrow("stale");
  });

  it("Apply suggestion fills a draft; final matching referral explicitly approves the note; pharmacy Apply is separate", () => {
    send(b, true);
    store().arriveInQueue(b);
    store().applySuggestionToDecision(b);
    expect(store().records).toHaveLength(2);
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
    const id = "SYN-FQ123-TYPE2";
    store().setAgentEnabled(true);
    store().applySuggestedCorrection(id);
    expect(store().pharmacyDrafts[id].epsPrescription?.supplyEvidence).toMatchObject({ brandManufacturer: "Demo manufacturer (synthetic)", packSize: 21, form: "capsules" });
    expect(store().lifecycles[id].state).toBe("in_review");
    expect(store().caseRevisions[id]).toHaveLength(1);
  });
});
