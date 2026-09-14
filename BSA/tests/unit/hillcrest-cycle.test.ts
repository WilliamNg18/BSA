import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CASES, PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { createEpsPrescription, EPS_SUPPLY_RULE } from "../../src/lib/domain/eps-check";
import { runAgent } from "../../src/lib/domain/agent";
import { immutable, paperDeclarationFields } from "../../src/lib/domain/lifecycle-model";
import { historicalLifecycleFixtures, seededLifecycleSession } from "../../src/lib/domain/lifecycle-seed";
import { LIFECYCLE_LABELS, type ProcessSubmission } from "../../src/lib/domain/lifecycle";
import { routeSubmission, routingFactsForCase } from "../../src/lib/domain/routing";
import { pharmacySnapshot, checkPharmacy } from "../../src/lib/domain/pharmacy-check";
import { getDomainSnapshot, historicalDecisionRecords, sessionCase, useAppStore } from "../../src/lib/store";
import type { EpsPrescription, PaperDeclaration } from "../../src/lib/domain/types";

const store = () => useAppStore.getState();
const [A, B, , D, , F] = CASES;
const generic = "SYN-FQ123-MISMATCH";
const paper: PaperDeclaration = { typedProduct: "Co-codamol 30/500 tablets", quantity: 100,
  endorsementText: "NCSO JB 27/08/26", dispensingDate: "2026-08-27", declaredByPharmacy: true };
const eps = (id = B.id): EpsPrescription => ({ ...createEpsPrescription(sessionCase(id)!), claimMessageState: "submitted" });
const submit = (prescription = eps()): ProcessSubmission => ({ caseId: B.id, channel: "eps",
  endorsementText: prescription.dispenserEndorsement, epsPrescription: prescription, revision: store().caseRevisions[B.id].at(-1)!.number });
beforeEach(() => { store().resetDemo(); vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-13T12:00:00Z")); });
afterEach(() => vi.restoreAllMocks());

describe("single Hillcrest first-load cycle", () => {
  it("seeds exactly four operational items and one untouched automatic price", () => {
    const s = store();
    expect(Object.keys(s.lifecycles)).toEqual(PLAYABLE_CASE_IDS);
    expect(Object.values(s.lifecycles).every((row) => row.pharmacyCode === "FQ123")).toBe(true);
    expect(Object.entries(s.itemProcesses).filter(([, process]) => process.routing.outcome === "auto_priced").map(([id]) => id)).toEqual([A.id]);
    expect(s.lifecycles[A.id].state).toBe("paid");
    expect(s.records).toEqual([]);
    expect(s.itemProcesses[D.id].routing.outcome).toBe("type1_capture");
    expect(s.itemProcesses[generic].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
    expect(s.lifecycles[B.id].state).toBe("referred_back");
    expect(s.itemProcesses[B.id].rbCode).toBe("SYN-NCSO");
    for (const map of [s.caseStates, s.caseRevisions, s.itemProcesses, s.itemVerification]) {
      expect(Object.keys(map).sort()).toEqual([...PLAYABLE_CASE_IDS].sort());
    }
    for (const [state, labels] of Object.entries(LIFECYCLE_LABELS)) {
      if (state !== "released_to_pricing") expect(labels.nhsbsa).toEqual({ on: labels.pharmacy, off: labels.pharmacy });
    }
    expect(Object.values(s.lifecycles).some((item) => item.state === "released_to_pricing")).toBe(false);
    expect(LIFECYCLE_LABELS.released_to_pricing.nhsbsa.on).toBe(LIFECYCLE_LABELS.released_to_pricing.nhsbsa.off);
  });

  it("retains F's original and corrected evidence as pure historical fixtures", () => {
    const before = getDomainSnapshot();
    const s = historicalLifecycleFixtures(), history = s.lifecycles[F.id].history;
    const records = historicalDecisionRecords();
    expect(Object.keys(s.lifecycles)).toHaveLength(10);
    expect(records[0]).toMatchObject({ id: "DR-000871", timestamp: "2026-09-03T15:02:11", decision: "REFER_BACK" });
    expect(history[2]).toMatchObject({ recordId: "DR-000871", to: "referred_back", revision: 1 });
    expect(s.caseRevisions[F.id][0].endorsementText).toBe(F.extracted.endorsementText);
    expect(s.caseRevisions[F.id][1]).toMatchObject({ number: 2, kind: "resubmission", endorsementText: "NCSO DL 06/08/26" });
    expect(history.slice(3).map((event) => event.actor)).toEqual(["pharmacy", "code", "operator", "code"]);
    expect(records[1]).toMatchObject({ id: "DR-000872", decision: "ACCEPT", revision: 2, recommendation: "NONE" });
    expect(history.at(-1)?.message).toContain("NHSBSA's existing rules engine");
    expect(F.extracted.endorsementText).toBe("NCSO  DL");
    expect(sessionCase(F.id)).toBeNull();
    expect(getDomainSnapshot()).toEqual(before);
  });
});

describe("immutable source submission contracts", () => {
  it("copies the full EPS prescription, projects the source fields and selects July by dispensing date", () => {
    const prescription = { ...eps(), dispensingDate: "2026-07-21" };
    const before = store().caseRevisions[B.id];
    store().submitItem(submit(prescription));
    const revision = store().caseRevisions[B.id].at(-1)!;
    expect(revision.epsPrescription).toEqual(prescription);
    expect(revision.epsPrescription).not.toBe(prescription);
    expect(Object.isFrozen(revision.epsPrescription?.items[0])).toBe(true);
    expect(sessionCase(B.id)).toMatchObject({ epsPrescription: prescription, extracted: {
      dispensingDate: "2026-07-21", quantity: prescription.items[0].quantity, prescriber: prescription.prescriber.name,
    }, regions: [] });
    expect(store().itemProcesses[B.id].routing.outcome).toBe("auto_priced");
    expect(store().caseRevisions[B.id].slice(0, -1)).toEqual(before);
    prescription.dispensingDate = "2026-08-21";
    expect(revision.epsPrescription?.dispensingDate).toBe("2026-07-21");
  });

  it("validates advice against the newly submitted date rather than the old fixture date", () => {
    const prescription = { ...eps(), dispensingDate: "2026-07-21" };
    const projected = { ...B, extracted: { ...B.extracted, dispensingDate: prescription.dispensingDate } };
    const precheck = pharmacySnapshot(prescription.dispenserEndorsement, prescription.dispensingDate, "scripted",
      checkPharmacy(projected, prescription.dispenserEndorsement), "2026-09-13T12:00:00Z");
    store().submitItem({ ...submit(prescription), precheck });
    expect(store().caseRevisions[B.id].at(-1)?.precheck?.tariffVersion).toBe("2026-07");
  });

  it.each([
    ["channel", (input: ProcessSubmission) => ({ ...input, channel: "paper" as const })],
    ["endorsement copy", (input: ProcessSubmission) => ({ ...input, endorsementText: "Different" })],
    ["revision", (input: ProcessSubmission) => ({ ...input, revision: 0 })],
    ["draft claim", (input: ProcessSubmission) => ({ ...input, epsPrescription: { ...input.epsPrescription!, claimMessageState: "draft" as const } })],
    ["multiple items", (input: ProcessSubmission) => ({ ...input, epsPrescription: { ...input.epsPrescription!, items: [...input.epsPrescription!.items, ...input.epsPrescription!.items] } })],
    ["invalid date", (input: ProcessSubmission) => ({ ...input, epsPrescription: { ...input.epsPrescription!, dispensingDate: "2026-02-30" } })],
    ["unknown code", (input: ProcessSubmission) => ({ ...input, epsPrescription: { ...input.epsPrescription!, items: [{ ...input.epsPrescription!.items[0], dispensedCode: "123456" }] } })],
    ["product copy", (input: ProcessSubmission) => ({ ...input, epsPrescription: { ...input.epsPrescription!, items: [{ ...input.epsPrescription!.items[0], dispensedName: "Different" }] } })],
    ["strength copy", (input: ProcessSubmission) => ({ ...input, epsPrescription: { ...input.epsPrescription!, items: [{ ...input.epsPrescription!.items[0], strength: "500mg" }] } })],
    ["form copy", (input: ProcessSubmission) => ({ ...input, epsPrescription: { ...input.epsPrescription!, items: [{ ...input.epsPrescription!.items[0], form: "capsules" }] } })],
  ] as const)("rejects %s atomically", (_, change) => {
    const before = getDomainSnapshot();
    expect(() => store().submitItem(change(submit()))).toThrow();
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("retains paper and maps only declared fields, never inventing a prescriber or reading the scan", () => {
    const before = structuredClone(D);
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: paper.endorsementText, paperDeclaration: paper });
    const revision = store().caseRevisions[D.id].at(-1)!;
    expect(revision.paperDeclaration).toEqual(paper);
    expect(revision.declaration?.fields).toEqual(paperDeclarationFields(paper));
    expect(revision.declaration?.fields.prescriber).toBeUndefined();
    expect(sessionCase(D.id)?.extracted).toEqual(before.extracted);
    expect(sessionCase(D.id)?.regions).toEqual(before.regions);
    expect(runAgent(sessionCase(D.id)!).recommendation).toBe("ABSTAIN");
  });

  it("rejects stale paper copy while allowing explicit separate prescriber evidence", () => {
    const input = { caseId: D.id, channel: "paper" as const, endorsementText: paper.endorsementText, paperDeclaration: paper,
      declaration: { fields: { ...paperDeclarationFields(paper), prescriber: "Dr Demo (synthetic)" },
        declaredAt: "2026-09-13T12:00:00Z", provenance: "pharmacy_declaration" as const } };
    const before = getDomainSnapshot();
    expect(() => store().submitItem({ ...input, declaration: { ...input.declaration, fields: { ...input.declaration.fields, quantity: 99 } } })).toThrow(/copies/);
    expect(getDomainSnapshot()).toEqual(before);
    store().submitItem(input);
    expect(store().caseRevisions[D.id].at(-1)?.declaration?.fields.prescriber).toBe("Dr Demo (synthetic)");
  });

  it("rejects non-synthetic human capture codes without writing history", () => {
    const before = getDomainSnapshot();
    expect(() => store().confirmType1({ caseId: D.id, revision: 1, provenance: "human_capture", declarationReconciled: false,
      fields: { ...paperDeclarationFields(paper), productCode: "123456789" } })).toThrow(/synthetic product codes/);
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("cannot bypass generic supply requirements by omitting the optional evidence, in either decision mode", () => {
    const prescription = { ...store().caseRevisions[generic][0].epsPrescription!, supplyEvidence: undefined };
    for (const enabled of [false, true]) {
      store().setAgentEnabled(enabled);
      store().submitItem({ caseId: generic, channel: "eps", endorsementText: "", epsPrescription: prescription });
      expect(store().itemProcesses[generic].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
      store().arriveInQueue(generic);
      const before = getDomainSnapshot();
      expect(() => store().recordType2Decision({ caseId: generic, decision: "ACCEPT", reason: "Cannot invent missing supply evidence." })).toThrow();
      expect(getDomainSnapshot()).toEqual(before);
    }
  });

  it("complete generic supply is cleared by code with no human or model decision", () => {
    const prescription = { ...store().caseRevisions[generic][0].epsPrescription!, supplyEvidence: {
      ruleId: EPS_SUPPLY_RULE.id, brandManufacturer: EPS_SUPPLY_RULE.brandManufacturer, packSize: 21, form: "capsules",
    } };
    const records = store().records;
    store().submitItem({ caseId: generic, channel: "eps", endorsementText: "", epsPrescription: prescription });
    expect(store().lifecycles[generic].state).toBe("paid");
    expect(store().itemProcesses[generic].routing.outcome).toBe("auto_priced");
    expect(store().records).toBe(records);
  });

  it("missing generic quantity remains a review gap, never an EPS image-capture failure", () => {
    const c = sessionCase(generic)!;
    const missing = { ...c, epsPrescription: undefined, extracted: { ...c.extracted, quantity: null } };
    expect(routeSubmission(routingFactsForCase(missing, "eps"))).toMatchObject({
      outcome: "type2_endorsement", requiresHuman: true, pricingAuthority: null,
    });
  });

  it("legacy correction retains EPS source and supply evidence instead of dropping the generic obligation", () => {
    const before = store().caseRevisions[generic][0];
    store().recordType2Decision({ caseId: generic, decision: "REFER_BACK", reason: "Human requires the correct supply pack.", rbCode: "RB2B" });
    store().resubmitFromPharmacy(generic, "Pharmacy correction, supply pack still mismatched");
    const latest = store().caseRevisions[generic].at(-1)!;
    expect(latest.epsPrescription).toEqual({ ...before.epsPrescription, dispenserEndorsement: latest.endorsementText });
    expect(latest.epsPrescription?.supplyEvidence).toEqual(before.epsPrescription?.supplyEvidence);
    expect(store().itemProcesses[generic].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
    expect(store().caseRevisions[generic][0]).toEqual(before);
  });

  it("paper dispensing date travels with the declaration but never claims the original scan was read", () => {
    const declaration = { ...paper, dispensingDate: "2026-07-27" };
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: declaration.endorsementText, paperDeclaration: declaration });
    expect(sessionCase(D.id)?.extracted.dispensingDate).toBe("2026-07-27");
    expect(sessionCase(D.id)?.paperDeclaration).toEqual(declaration);
    expect(sessionCase(D.id)?.extracted.prescriber).toBe("Illegible");
    expect(sessionCase(D.id)?.imageQuality).toBe(D.imageQuality);
    expect(D.extracted.dispensingDate).toBe("2026-08-27");
  });
});

it.each([false, true])("full cycle preserves every action in Both and switched perspectives, Agent %s", (enabled) => {
  const run = (switched: boolean) => {
    store().resetDemo();
    store().setAgentEnabled(enabled);
    const initial = getDomainSnapshot(), checkpoints = [initial];
    const act = (action: () => void) => {
      const before = getDomainSnapshot();
      if (switched) {
        store().setPerspective("pharmacy");
        expect(getDomainSnapshot()).toEqual(before);
        store().setPerspective("nhsbsa");
        expect(getDomainSnapshot()).toEqual(before);
      }
      action();
      checkpoints.push(getDomainSnapshot());
    };
    act(() => store().submitItem({ caseId: D.id, channel: "paper", endorsementText: paper.endorsementText, paperDeclaration: paper }));
    const revision = store().itemProcesses[D.id].revision;
    act(() => store().confirmType1({ caseId: D.id, revision, fields: { ...paperDeclarationFields(paper), prescriber: "Dr Demo (synthetic)" },
      provenance: "human_capture", declarationReconciled: enabled }));
    expect(store().itemProcesses[D.id].routing.outcome).toBe("type2_endorsement");
    act(() => store().recordType2Decision({ caseId: D.id, decision: "REFER_BACK", reason: "Human requires reconciled presentation evidence.", rbCode: "RB2B" }));
    const referral = immutable(store().lifecycles[D.id].history);
    act(() => store().resubmitItem({ caseId: D.id, channel: "paper", endorsementText: paper.endorsementText, paperDeclaration: paper }));
    expect(store().lifecycles[D.id].state).toBe("resubmitted");
    act(() => store().confirmType1({ caseId: D.id, revision: store().itemProcesses[D.id].revision,
      fields: { ...paperDeclarationFields(paper), prescriber: "Dr Demo (synthetic)" }, provenance: "human_capture", declarationReconciled: true }));
    act(() => store().recordType2Decision({ caseId: D.id, decision: "ACCEPT", reason: "Human reconciled all corrected source evidence." }));
    expect(store().lifecycles[D.id].state).toBe("paid");
    expect(store().lifecycles[D.id].history.slice(0, referral.length)).toEqual(referral);
    expect(store().itemProcesses[D.id].routing).toMatchObject({ outcome: "type2_endorsement", pricingAuthority: "existing_rules_engine" });
    act(() => store().resetDemo());
    expect(getDomainSnapshot()).toEqual(initial);
    expect(store().agentEnabled).toBe(false);
    expect(store().lifecycles).toEqual(seededLifecycleSession().lifecycles);
    return checkpoints;
  };
  expect(run(true)).toEqual(run(false));
});
