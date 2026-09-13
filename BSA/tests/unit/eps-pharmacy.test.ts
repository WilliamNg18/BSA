import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EpsPharmacyCapture } from "@/components/demo/eps-pharmacy-capture";
import { EpsPrescriptionMessage } from "@/components/demo/eps-prescription-message";
import { caseById } from "@/lib/domain/cases";
import { createEpsPrescription, EPS_SUPPLY_RULE } from "@/lib/domain/eps-check";
import { checkEpsPharmacy } from "@/lib/domain/eps-pharmacy-check";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
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
  const s = useAppStore.getState(), latest = s.caseRevisions[caseId].at(-1)!;
  return caseForLifecycle(caseId, s.lifecycles, {
    ...s.caseRevisions,
    [caseId]: [...s.caseRevisions[caseId].slice(0, -1), { ...latest, channel: "eps", endorsementText: eps.dispenserEndorsement, epsPrescription: eps }],
  }, s.itemProcesses)!;
}

beforeEach(() => useAppStore.getState().resetDemo());

describe("visible EPS prescription", () => {
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
    for (const label of ["Complete endorsement", "NCSO missing date", "Generic missing brand", "Dispenser endorsement", "Exemption status", "Send claim", "No check against this month", "Problems found at NHSBSA weeks later"]) expect(html).toContain(label);
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
    const missing = checkEpsPharmacy(preview("EX-24101", generic), "");
    expect(missing.status).toBe("missing");
    expect(missing.gap).toContain("Brand or manufacturer");
    const complete = { ...generic, supplyEvidence: { ...generic.supplyEvidence!, brandManufacturer: EPS_SUPPLY_RULE.brandManufacturer } };
    expect(checkEpsPharmacy(preview("EX-24101", complete), "").status).toBe("ready");
    expect(useAppStore.getState().caseRevisions["EX-24101"]).toHaveLength(1);
  });
});
