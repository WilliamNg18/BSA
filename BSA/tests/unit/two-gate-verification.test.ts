import { beforeEach, describe, expect, it, vi } from "vitest";
import { caseById, PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { historicalLifecycleFixtures } from "../../src/lib/domain/lifecycle-seed";
import { NO_VERIFICATION, itemStateLabel, receiptPricingLabel } from "../../src/lib/domain/lifecycle";
import { evaluateItemVerification } from "../../src/lib/domain/verification";
import { checkPharmacyCorrection, initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { getDomainSnapshot, getReleaseEligibility, sessionCase, useAppStore } from "../../src/lib/store";
import * as agent from "../../src/lib/domain/agent";

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

  it("complete EPS receipts distinguish recorded On release from Off pricing and retain each attempt", () => {
    const id = "EX-24107";
    send(id, true);
    const verified = receiptPricingLabel(store().lifecycles[id], 2);
    expect(verified).toContain("released to existing pricing, no operator action");
    expect(verified).not.toContain("Awaiting Type 2");
    store().setAgentEnabled(false);
    expect(receiptPricingLabel(store().lifecycles[id], 2)).toBe(verified);
    send(id, false);
    expect(receiptPricingLabel(store().lifecycles[id], 3)).toContain("priced by NHSBSA's existing rules engine, no person involved");
    expect(receiptPricingLabel(store().lifecycles[id], 2)).toBe(verified);
    expect(receiptPricingLabel(store().lifecycles[id], 999)).toBeNull();
    send(mismatch, true);
    expect(receiptPricingLabel(store().lifecycles[mismatch], 2)).toBeNull();
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

  it("forged routing capture metadata cannot replace an actual operator capture event", () => {
    const process = store().itemProcesses[d], revision = store().caseRevisions[d][0];
    useAppStore.setState({ itemProcesses: { ...store().itemProcesses, [d]: { ...process,
      routing: { ...process.routing, outcome: "type2_endorsement", requiresHuman: true },
      capture: { revision: 1, confirmedAt: "2026-09-14T12:00:00Z", operator: "Forged metadata", provenance: "pharmacy_declaration",
        declarationReconciled: true, fields: { ...revision.declaration!.fields, prescriber: "Invented synthetic prescriber" } },
    } } });
    expect(getReleaseEligibility(d).allowed).toBe(false);
    expect(() => store().releaseToPricing(d, "I assert this source was captured")).toThrow();
    expect(store().lifecycles[d].history.some((event) => event.capture)).toBe(false);
  });

  it.each([false, true])("complete manual Off capture needs no proposed attestation; On still does, enabled=%s", (enabled) => {
    store().setAgentEnabled(enabled);
    store().submitItem({ caseId: d, channel: "paper", endorsementText: caseById(d)!.extracted.endorsementText });
    const fields = { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO JB", prescriber: "Manually keyed synthetic prescriber" };
    store().confirmType1({ caseId: d, revision: 2, fields, provenance: "human_capture", declarationReconciled: false });
    store().referBack(d, "RB2B", "Complete the missing paper fields and endorsement date.");
    store().setPharmacyDraft(d, {
      revision: 2, channel: "paper", purpose: "correction", endorsementText: "NCSO JB 27/08/26",
      paperDeclaration: { typedProduct: fields.productCode, quantity: fields.quantity,
        endorsementText: "NCSO JB 27/08/26", dispensingDate: "2026-08-27", declaredByPharmacy: true },
    });
    store().resubmit(d);
    store().confirmType1({ caseId: d, revision: 3, fields: { ...fields, endorsementText: "NCSO JB 27/08/26" },
      provenance: "human_capture", declarationReconciled: false });
    expect(getReleaseEligibility(d).allowed).toBe(!enabled);
    if (enabled) expect(() => store().releaseToPricing(d, "No attestation was supplied.")).toThrow();
    else {
      store().releaseToPricing(d, "Manually keyed facts independently match the claim.");
      expect(store().itemVerification[d]).toEqual({ ...NO_VERIFICATION, released: true });
      expect(itemStateLabel(store().lifecycles[d], "nhsbsa")).toContain("after operator review");
    }
  });

  it("On submission can finish through actual Off manual capture without a hidden attestation requirement", () => {
    const fields = { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO JB 27/08/26", prescriber: "Manually established synthetic prescriber" };
    store().setAgentEnabled(true);
    store().submitItem({ caseId: d, channel: "paper", endorsementText: fields.endorsementText,
      declaration: { fields, declaredAt: "2026-09-14T12:00:00Z", provenance: "pharmacy_declaration" } });
    const history = structuredClone(store().lifecycles[d].history), beforeToggle = getDomainSnapshot();
    expect(store().itemVerification[d]).toMatchObject({ gate1: "pass", gate2: "fail", released: false });
    store().setAgentEnabled(false);
    expect(getDomainSnapshot()).toEqual(beforeToggle);
    store().confirmType1({ caseId: d, revision: 2, fields, provenance: "human_capture", declarationReconciled: false });
    expect(store().itemProcesses[d].capture?.assistanceEnabled).toBe(false);
    expect(getReleaseEligibility(d).allowed).toBe(true);
    store().releaseToPricing(d, "Manually captured fields match the independent claim.");
    expect(store().lifecycles[d].history.slice(0, history.length)).toEqual(history);
    expect(store().caseRevisions[d].at(-1)?.verificationEnabled).toBe(true);
    expect(store().itemProcesses[d].releaseOrigin).toBe("human_decision");
    expect(itemStateLabel(store().lifecycles[d], "nhsbsa")).not.toContain("no operator action");
    expect(store().records.at(-1)?.recommendation).toBe("NONE");
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

  it.each([0, 0.5, 2])("does not verify a generic claimed amount %s against a different known pack reference", (amountClaimed) => {
    const original = caseById(mismatch)!, revision = store().caseRevisions[mismatch][0];
    const epsPrescription = { ...revision.epsPrescription!, supplyEvidence: { ...revision.epsPrescription!.supplyEvidence!, packSize: 21 } };
    const result = evaluateItemVerification({ ...original, claim: { ...original.claim, amountClaimed } }, { ...revision, epsPrescription }, true);
    expect(result.verification).toMatchObject({ gate1: "pass", gate2: "fail", reconciled: false, released: false });
  });

  it("a forged advice state cannot turn queue arrival into pricing or release", () => {
    send(b, true);
    const pack = agent.runAgent(sessionCase(b)!);
    const spy = vi.spyOn(agent, "runAgent").mockReturnValue({ ...pack, state: "cleared_by_rules", agentInvoked: true });
    try {
      store().arriveInQueue(b);
      expect(store().lifecycles[b].state).toBe("in_review");
      expect(store().caseStates[b]).toBe("operator_review_required");
      expect(store().itemVerification[b].released).toBe(false);
      expect(store().lifecycles[b].history.at(-1)).toMatchObject({ actor: "agent", from: "in_review", to: "in_review" });
    } finally {
      spy.mockRestore();
    }
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
    store().setPharmacyDraft(b, { ...initialisePharmacyDraft(sessionCase(b)!, revision), purpose: "correction" });
    store().applySuggestedCorrection(b);
    expect(store().pharmacyCorrections).toHaveLength(0);
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
    expect(receiptPricingLabel(store().lifecycles[b], 3)).toContain("after operator review");
    expect(receiptPricingLabel(store().lifecycles[b], 3)).not.toContain("no operator action");
  });

  it("generic correction fills actual source fields and never approves or submits from Apply", () => {
    const id = mismatch;
    store().setAgentEnabled(true);
    store().setPharmacyDraft(id, { ...initialisePharmacyDraft(sessionCase(id)!, store().caseRevisions[id][0]), purpose: "new_submission" });
    store().applySuggestedCorrection(id);
    expect(store().pharmacyDrafts[id].epsPrescription?.supplyEvidence).toMatchObject({ brandManufacturer: "Demo manufacturer (synthetic)", packSize: 21, form: "capsules" });
    expect(store().lifecycles[id].state).toBe("in_review");
    expect(store().caseRevisions[id]).toHaveLength(1);
    expect(store().pharmacyCorrections).toHaveLength(1);
    expect(store().pharmacyCorrections[0]).toMatchObject({
      caseId: id, revision: 2, basis: "source_gap",
      sourceVerification: { before: { gate2: "fail" }, after: { gate2: "pass", released: false } },
    });
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
    expect(store().pharmacyCorrections).toHaveLength(1);
    expect(store().pharmacyCorrections[0]).toMatchObject({ caseId: b, revision: 2, before: { status: "missing" }, after: { status: "ready" } });
    expect(store().records).toHaveLength(0);
    expect(store().lifecycles[b].state).toBe("referred_back");
    expect(store().caseRevisions[b][0]).toBe(revision);
    expect(() => store().resubmit(b)).toThrow("explicit new attempt");
    store().submitItem({ ...store().pharmacyDrafts[b], caseId: b, channel: "eps" });
    expect(store().lifecycles[b].state).toBe("released_to_pricing");
  });

  it("shared Apply and the legacy correction recorder count the same next attempt only once", () => {
    store().setAgentEnabled(true);
    const revision = store().caseRevisions[b][0];
    store().setPharmacyDraft(b, { ...initialisePharmacyDraft(sessionCase(b)!, revision), purpose: "new_submission" });
    store().applySuggestedCorrection(b);
    const caught = store().pharmacyCorrections[0];
    store().recordPharmacyCorrection(b, caught.before, caught.after, 2, { channel: "eps" });
    expect(store().pharmacyCorrections).toHaveLength(1);
    expect(store().caseRevisions[b][0]).toBe(revision);
    expect(store().itemVerification[b]).toEqual(NO_VERIFICATION);
    store().setAgentEnabled(false);
    store().setPerspective("pharmacy");
    expect(store().pharmacyCorrections).toHaveLength(1);
    store().resetDemo();
    expect(store().pharmacyCorrections).toHaveLength(0);
  });

  it("does not count a date-only improvement while required source facts remain invalid", () => {
    store().setAgentEnabled(true);
    const revision = store().caseRevisions[b][0], draft = initialisePharmacyDraft(sessionCase(b)!, revision);
    store().setPharmacyDraft(b, { ...draft, purpose: "new_submission",
      epsPrescription: { ...draft.epsPrescription!, prescriber: { ...draft.epsPrescription!.prescriber, name: "" } } });
    store().applySuggestedCorrection(b);
    expect(store().pharmacyDrafts[b].endorsementText).toContain("21/08/26");
    expect(store().pharmacyCorrections).toHaveLength(0);
  });

  it("does not count partial unreadable-paper corrections as ready", () => {
    store().setAgentEnabled(true);
    const revision = store().caseRevisions[d][0], draft = initialisePharmacyDraft(sessionCase(d)!, revision);
    store().setPharmacyDraft(d, { ...draft, purpose: "new_submission", endorsementText: "NCSO JB",
      paperDeclaration: { ...draft.paperDeclaration!, quantity: null, endorsementText: "NCSO JB" } });
    store().applySuggestedCorrection(d);
    expect(store().pharmacyDrafts[d].endorsementText).toContain("27/08/26");
    expect(store().pharmacyCorrections).toHaveLength(0);
    expect(store().caseRevisions[d][0]).toBe(revision);
  });

  it("same-state pharmacy preparation cannot erase a human release anchor", () => {
    store().setAgentEnabled(true);
    store().resubmitFromPharmacy(b, "NCSO RK 21/08/26");
    store().arriveInQueue(b);
    store().releaseToPricing(b, "Human checked the current source facts.");
    const revision = store().caseRevisions[b].at(-1)!, draft = initialisePharmacyDraft(sessionCase(b)!, revision);
    store().setPharmacyDraft(b, { ...draft, purpose: "new_submission", endorsementText: "NCSO RK",
      epsPrescription: { ...draft.epsPrescription!, dispenserEndorsement: "NCSO RK" } });
    store().applySuggestedCorrection(b);
    expect(store().lifecycles[b].history.at(-1)?.processStep).toBe("correction_applied");
    expect(itemStateLabel(store().lifecycles[b], "nhsbsa")).toContain("after operator review");
    expect(itemStateLabel(store().lifecycles[b], "nhsbsa")).not.toContain("no operator action");
    expect(itemStateLabel({ ...store().lifecycles[b], history: [] }, "nhsbsa")).toContain("provenance unavailable");
  });

  it.each(PLAYABLE_CASE_IDS.flatMap((id) => [false, true].map((enabled) => ({ id, enabled }))))(
    "runs the actual $id cycle with identical full snapshots across perspectives, enabled=$enabled", ({ id, enabled }) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-14T12:00:00Z"));
      try {
        const run = (switching: boolean) => {
          store().resetDemo();
          store().setPerspective("both");
          store().setAgentEnabled(enabled);
          const snapshots: ReturnType<typeof getDomainSnapshot>[] = [];
          const act = (side: "pharmacy" | "nhsbsa", action: () => void) => {
            if (switching) store().setPerspective(side);
            action();
            snapshots.push(getDomainSnapshot());
          };
          act("pharmacy", () => {
            if (id === d) {
              const fields = { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO JB", prescriber: "Separately supplied synthetic prescriber" };
              store().submitItem({ caseId: d, channel: "paper", endorsementText: fields.endorsementText,
                paperDeclaration: { typedProduct: fields.productCode, quantity: 100, endorsementText: fields.endorsementText,
                  dispensingDate: "2026-08-27", declaredByPharmacy: true },
                declaration: { fields, declaredAt: "2026-09-14T12:00:00Z", provenance: "pharmacy_declaration" } });
            } else send(id, enabled);
          });
          if (id === "EX-24107") {
            expect(store().lifecycles[id].state).toBe(enabled ? "released_to_pricing" : "paid");
            return snapshots;
          }
          const capture = () => {
            const revision = store().caseRevisions[id].at(-1)!;
            store().confirmType1({ caseId: id, revision: revision.number, fields: revision.declaration!.fields,
              provenance: "pharmacy_declaration", declarationReconciled: true });
          };
          act("nhsbsa", id === d ? capture : () => store().arriveInQueue(id));
          if (enabled) act("nhsbsa", () => store().applySuggestionToDecision(id));
          act("nhsbsa", () => store().referBack(id, id === b ? "SYN-NCSO" : "RB2B",
            enabled ? store().operatorDrafts[id].note : "Please correct the missing or mismatched source facts."));
          expect(store().lifecycles[id].state).toBe("referred_back");
          act("pharmacy", () => {
            if (enabled) store().applySuggestedCorrection(id);
            else {
              const revision = store().caseRevisions[id].at(-1)!, draft = initialisePharmacyDraft(sessionCase(id)!, revision);
              const endorsementText = id === mismatch ? "" : id === b ? "NCSO RK 21/08/26" : "NCSO JB 27/08/26";
              store().setPharmacyDraft(id, { ...draft, endorsementText,
                ...(draft.epsPrescription ? { epsPrescription: { ...draft.epsPrescription, dispenserEndorsement: endorsementText,
                  ...(id === mismatch ? { supplyEvidence: { ...draft.epsPrescription.supplyEvidence!, packSize: 21 } } : {}) } } : {}),
                ...(draft.paperDeclaration ? { paperDeclaration: { ...draft.paperDeclaration, endorsementText } } : {}) });
            }
          });
          expect(store().lifecycles[id].state).toBe("referred_back");
          act("pharmacy", () => store().resubmit(id));
          expect(store().itemVerification[id].released).toBe(false);
          act("nhsbsa", id === d ? capture : () => store().arriveInQueue(id));
          if (enabled) act("nhsbsa", () => store().applySuggestionToDecision(id));
          act("nhsbsa", () => store().releaseToPricing(id, "Human checked the corrected source evidence."));
          expect(store().lifecycles[id].state).toBe("released_to_pricing");
          expect(store().itemProcesses[id].releaseOrigin).toBe("human_decision");
          expect(itemStateLabel(store().lifecycles[id], "nhsbsa")).not.toContain("no operator action");
          return snapshots;
        };
        expect(run(true)).toEqual(run(false));
      } finally {
        vi.useRealTimers();
      }
    },
  );
});
