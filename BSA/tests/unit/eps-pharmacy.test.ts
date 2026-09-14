import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EpsPharmacyCapture } from "@/components/demo/eps-pharmacy-capture";
import { EpsPrescriptionMessage } from "@/components/demo/eps-prescription-message";
import { caseById } from "@/lib/domain/cases";
import { createEpsPrescription, EPS_SUPPLY_RULE } from "@/lib/domain/eps-check";
import { checkEpsPharmacy } from "@/lib/domain/eps-pharmacy-check";
import { projectEpsSubmissionDraft } from "@/lib/domain/eps-submission-draft";
import { PharmacyCheckRunner, pharmacySnapshot } from "@/lib/domain/pharmacy-check";
import type { EpsPrescription } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

function preview(caseId: string, eps: EpsPrescription) {
  const s = useAppStore.getState();
  return projectEpsSubmissionDraft(caseId, eps, s.lifecycles, s.caseRevisions);
}

beforeEach(() => useAppStore.getState().resetDemo());

describe("visible EPS prescription", () => {
  it.each(["pending", "ACCEPT", "ESCALATE", "REFER_BACK"] as const)("previews a fresh EPS attempt after human recheck: %s", (decision) => {
    const id = "EX-24112", s = useAppStore.getState();
    const eps = { ...createEpsPrescription(caseById(id)!), dispenserEndorsement: "NCSO RK 21/08/26", claimMessageState: "submitted" as const };
    s.resubmitItem({ caseId: id, channel: "eps", endorsementText: eps.dispenserEndorsement, epsPrescription: eps });
    if (decision !== "pending") {
      s.arriveInQueue(id);
      s.recordType2Decision({ caseId: id, decision, reason: "Human checked the corrected date.", ...(decision === "REFER_BACK" ? { rbCode: "SYN-NCSO" } : {}) });
    }
    const before = useAppStore.getState();
    expect(checkEpsPharmacy(preview(id, eps), eps.dispenserEndorsement).status).toBe("ready");
    expect(useAppStore.getState()).toBe(before);
    s.submitItem({ caseId: id, channel: "eps", endorsementText: eps.dispenserEndorsement, epsPrescription: eps });
    expect(useAppStore.getState().itemProcesses[id].routing.outcome).toBe("auto_priced");
    expect(useAppStore.getState().caseRevisions[id].slice(0, -1)).toEqual(before.caseRevisions[id]);
  });

  it("does not borrow a prior paper declaration or confirmed capture for a new EPS draft", () => {
    const id = "EX-24112", s = useAppStore.getState();
    const eps = { ...createEpsPrescription(caseById(id)!), dispenserEndorsement: "NCSO RK 21/08/26", claimMessageState: "submitted" as const };
    const fields = { productCode: eps.items[0].dispensedCode, quantity: 28, endorsementText: eps.dispenserEndorsement, prescriber: eps.prescriber.name };
    s.submitItem({ caseId: id, channel: "paper", endorsementText: eps.dispenserEndorsement,
      declaration: { fields, provenance: "pharmacy_declaration", declaredAt: "2026-09-13T12:00:00.000Z" } });
    s.confirmType1({ caseId: id, revision: s.caseRevisions[id].at(-1)!.number + 1, fields, provenance: "pharmacy_declaration", declarationReconciled: true });
    const before = useAppStore.getState();
    const projected = preview(id, eps);
    expect(projected.capturedEvidence).toBeUndefined();
    expect(projected.paperDeclaration).toBeUndefined();
    expect(checkEpsPharmacy(projected, eps.dispenserEndorsement).status).toBe("ready");
    expect(useAppStore.getState()).toBe(before);
    s.submitItem({ caseId: id, channel: "eps", endorsementText: eps.dispenserEndorsement, epsPrescription: eps });
    expect(useAppStore.getState().itemProcesses[id].routing.outcome).toBe("auto_priced");
  });

  it("separates the prescription from dispenser fields and never renders an image", () => {
    const draft = createEpsPrescription(caseById("EX-24107")!);
    const html = renderToStaticMarkup(createElement(EpsPrescriptionMessage, { prescription: draft }));
    for (const label of ["Prescriber", "Practice", "Prescription date", "Patient A (synthetic)", "Product", "Strength", "Form", "Quantity", "Dose", "Prescriber endorsement", "Dispenser endorsement", "Claim message"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("EPS has no image to read and no Type 1 capture");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("<img");
  });

  it("shows exactly three EPS scenarios, the source fields, manual pain and explicit Send", () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(EpsPharmacyCapture)));
    for (const label of ["Complete endorsement", "NCSO missing date", "Wrong pack size", "Dispenser endorsement", "Exemption status", "Send claim", "No check against this month", "If incomplete, problems may be found at NHSBSA weeks later"]) expect(html).toContain(label);
    expect(html).not.toContain("Unreadable form");
    expect(html).not.toContain("Apply correction");
    expect(html).toContain("NOT RUN");
  });

  it("only reports ready for deterministic automatic routing", () => {
    const a = createEpsPrescription(caseById("EX-24107")!);
    expect(checkEpsPharmacy(preview("EX-24107", a), a.dispenserEndorsement).status).toBe("ready");
    const b = createEpsPrescription(caseById("EX-24112")!);
    const missing = checkEpsPharmacy(preview("EX-24112", b), b.dispenserEndorsement);
    expect(missing.status).toBe("missing");
    expect(missing.checks.filter((check) => check.met === false).map((check) => check.id)).toContain("dated");
    const corrected = { ...b, dispenserEndorsement: `${b.dispenserEndorsement} 21/08/26` };
    expect(checkEpsPharmacy(preview("EX-24112", corrected), corrected.dispenserEndorsement).status).toBe("ready");
  });

  it("uses the dispensing month, preserving B July sufficiency", () => {
    const b = { ...createEpsPrescription(caseById("EX-24112")!), dispensingDate: "2026-07-21" };
    const result = checkEpsPharmacy(preview("EX-24112", b), b.dispenserEndorsement);
    expect(result.version).toBe("2026-07");
    expect(result.checks.some((check) => check.id === "dated")).toBe(false);
  });

  it("does not infer initials or clinical instructions", () => {
    const a = { ...createEpsPrescription(caseById("EX-24107")!), dispenserEndorsement: "NCSO 14/08/26" };
    expect(checkEpsPharmacy(preview("EX-24107", a), a.dispenserEndorsement).checks.find((check) => check.id === "initialled")?.met).toBe(false);
  });

  it.each(["", "2026-02-31", "2027-01-01"])("keeps incomplete or uncovered draft dates explicit: %s", (dispensingDate) => {
    const source = { ...createEpsPrescription(caseById("EX-24107")!), dispensingDate };
    const before = useAppStore.getState();
    const result = checkEpsPharmacy(preview("EX-24107", source), source.dispenserEndorsement);
    expect(result.status).not.toBe("ready");
    expect(result.gap).not.toBe("None");
    expect(useAppStore.getState()).toBe(before);
  });

  it("sends exact Off text and immutable source without a silent precheck", () => {
    const s = useAppStore.getState();
    const original = structuredClone(s.caseRevisions["EX-24112"]);
    const text = "  NCSO RK arbitrary typed text  ";
    const draft = { ...createEpsPrescription(caseById("EX-24112")!), dispenserEndorsement: text, claimMessageState: "submitted" as const };
    s.submitItem({ caseId: "EX-24112", channel: "eps", endorsementText: text, epsPrescription: draft,
      precheck: pharmacySnapshot(text, draft.dispensingDate, "off", null, null) });
    const after = useAppStore.getState(), revision = after.caseRevisions["EX-24112"].at(-1)!;
    expect(revision.endorsementText).toBe(text);
    expect(revision.epsPrescription?.dispenserEndorsement).toBe(text);
    expect(revision.precheck).toMatchObject({ mode: "off", status: "not_checked", checks: [], facts: null, checkedAt: null });
    expect(after.caseRevisions["EX-24112"].slice(0, -1)).toEqual(original);
    expect(Object.isFrozen(revision.epsPrescription)).toBe(true);
    expect(after.itemProcesses["EX-24112"].routing.outcome).not.toBe("type1_capture");
  });

  it("invalidates stale and Off checks without calling the EPS evaluator", () => {
    vi.useFakeTimers();
    try {
      const runner = new PharmacyCheckRunner(), evaluate = vi.fn(checkEpsPharmacy);
      const c = caseById("EX-24107")!;
      runner.start("on", c, c.extracted.endorsementText, true, false, undefined, evaluate);
      runner.start("off", c, "changed", false, false, undefined, evaluate);
      vi.runAllTimers();
      expect(evaluate).not.toHaveBeenCalled();
      expect(runner.getSnapshot()).toMatchObject({ key: "off", result: null, checkedAt: null });
      runner.cancel();
    } finally { vi.useRealTimers(); }
  });

  it("requires persisted manufacturer/pack/form for the generic source, not an advisory flag", () => {
    const original = createEpsPrescription(caseById("EX-24101")!);
    const generic: EpsPrescription = {
      ...original,
      items: original.items.map((item) => ({ ...item, prescribedCode: EPS_SUPPLY_RULE.productCode, dispensedCode: EPS_SUPPLY_RULE.productCode, product: "Amoxicillin 500mg capsules (generic synthetic)", dispensedName: "Amoxicillin 500mg capsules (generic synthetic)" })),
      supplyEvidence: { ruleId: EPS_SUPPLY_RULE.id, brandManufacturer: "", packSize: 21, form: "capsules" },
    };
    const missing = checkEpsPharmacy(preview("SYN-FQ123-MISMATCH", generic), "");
    expect(missing.status).toBe("missing");
    expect(missing.gap).toContain("Brand or manufacturer");
    const complete = { ...generic, supplyEvidence: { ...generic.supplyEvidence!, brandManufacturer: EPS_SUPPLY_RULE.brandManufacturer } };
    expect(checkEpsPharmacy(preview("SYN-FQ123-MISMATCH", complete), "").status).toBe("ready");
    expect(checkEpsPharmacy(preview("EX-24107", complete), "").status).not.toBe("ready");
    const missingPrescriber = { ...complete, prescriber: { ...complete.prescriber, name: "" } };
    const incomplete = checkEpsPharmacy(preview("SYN-FQ123-MISMATCH", missingPrescriber), "");
    expect(incomplete.status).toBe("missing");
    expect(incomplete.gap).not.toBe("None");
    expect(incomplete.gap.toLowerCase()).toContain("prescriber");
    expect(useAppStore.getState().caseRevisions["SYN-FQ123-MISMATCH"]).toHaveLength(1);
  });
});
