import { beforeEach, expect, it } from "vitest";
import { caseById } from "../../src/lib/domain/cases";
import { getAsSubmitted } from "../../src/lib/domain/submission-views";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState();
const actions = ["referBack", "requestInformation", "recordType2Decision", "recordOperatorDecision"] as const;
beforeEach(() => store().resetDemo());

it.each(actions.flatMap((action) => [false, true].map((enabled) => ({ action, enabled }))))(
  "rejects a proposed presentation through $action, Agent=$enabled, without changing evidence or draft", ({ action, enabled }) => {
    const id = "EX-24112", template = caseById(id)!;
    store().setAgentEnabled(enabled);
    store().submitItem({ caseId: id, channel: "paper", endorsementText: template.paperDeclaration!.endorsementText,
      paperDeclaration: { ...template.paperDeclaration!, form: "" } });
    store().arriveInQueue(id);
    const revision = store().caseRevisions[id].at(-1)!;
    const note = `Please provide ${template.pharmacySupplyRecord!.form} as the accurate presentation.`;
    store().setOperatorDraft(id, { revision: revision.number, outcome: "REFER_BACK", rbCode: "RB2B", note });
    const before = getDomainSnapshot(), submitted = getAsSubmitted(store(), id);
    const apply = () => {
      if (action === "referBack") store().referBack(id, "RB2B", note);
      else if (action === "requestInformation") store().requestInformation(id, note);
      else if (action === "recordType2Decision") store().recordType2Decision({ caseId: id, decision: "REFER_BACK", rbCode: "RB2B", reason: note });
      else store().recordOperatorDecision(id, "REQUEST_INFORMATION", note);
    };
    expect(apply).toThrow(/proposed corrected value/);
    expect(getDomainSnapshot()).toEqual(before);
    expect(getAsSubmitted(store(), id)).toEqual(submitted);
  },
);

it("includes acknowledged amendment supply fields in the actual synthetic scan, not OCR alone", () => {
  const id = "EX-24112", submitted = getAsSubmitted(store(), id);
  expect(submitted.asSubmitted.paperSource?.provenance).toBe("acknowledged_pharmacy_amendment");
  const brand = submitted.asSubmitted.paperDeclaration!.brandManufacturer!;
  expect(brand).not.toBe("");
  expect(submitted.asSubmitted.paperSource?.characterRecognition.find((entry) => entry.field === "brandManufacturer")?.value).toBe(brand);
  expect(submitted.paperScan?.regions.map((region) => region.text).join("\n")).toContain(brand);
});
