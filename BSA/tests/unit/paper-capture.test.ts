import { beforeEach, describe, expect, it } from "vitest";
import { PAPER_DECLARATION_PROVENANCE, prepareCaptureConfirmation, preparePaperCapture } from "../../src/lib/domain/paper-capture";
import type { PharmacyDeclaration } from "../../src/lib/domain/types";
import { caseById } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";

const declaration: PharmacyDeclaration = Object.freeze({
  fields: Object.freeze({ productCode: "SYN-001", quantity: 28, endorsementText: "NCSO AB 12/08/2026", prescriber: "Dr Demo (synthetic)" }),
  declaredAt: "2026-08-12T09:00:00Z",
  provenance: "pharmacy_declaration",
});

describe("paper capture helper with the authoritative store", () => {
  const D = caseById("EX-24123")!;
  const store = () => useAppStore.getState();
  const submittedDeclaration: PharmacyDeclaration = {
    provenance: "pharmacy_declaration", declaredAt: "2026-09-13T10:00:00Z",
    fields: {
      productCode: "SYN-COCOD-100", quantity: 100,
      endorsementText: "NCSO JB 27/08/26", prescriber: "Dr Demo (synthetic)",
    },
  };
  beforeEach(() => store().resetDemo());

  function submitDeclaration(declaration = submittedDeclaration) {
    store().setAgentEnabled(true);
    store().submitItem({
      caseId: D.id, channel: "paper", endorsementText: declaration.fields.endorsementText, declaration,
    });
    return store().caseRevisions[D.id].at(-1)!;
  }

  it("preparation, mode changes and perspective changes cannot confirm capture", () => {
    const revision = submitDeclaration();
    const before = getDomainSnapshot();
    const prepared = preparePaperCapture(true, revision.declaration);
    const result = prepareCaptureConfirmation({
      caseId: D.id, revision: revision.number, ...prepared, declaration: revision.declaration, declarationReconciled: true,
    });
    expect(result.errors).toBeNull();
    store().setPerspective("pharmacy");
    store().setPerspective("nhsbsa");
    store().setAgentEnabled(false);
    preparePaperCapture(false, revision.declaration);
    store().setAgentEnabled(true);
    expect(getDomainSnapshot()).toEqual(before);
    expect(store().itemProcesses[D.id].capture).toBeNull();
    expect(runAgent(sessionCase(D.id)!).recommendation).toBe("ABSTAIN");
  });

  it("records manual unknowns then requires a separate Type 2 decision for RB2B", () => {
    const result = prepareCaptureConfirmation({
      caseId: D.id, revision: store().itemProcesses[D.id].revision,
      ...preparePaperCapture(false), declarationReconciled: false,
    });
    expect(result.errors).toBeNull();
    if (!result.input) throw new Error("Expected a prepared manual capture");
    store().confirmType1(result.input);
    expect(store().itemProcesses[D.id]).toMatchObject({
      capture: { provenance: "human_capture", declarationReconciled: false, fields: { productCode: null, quantity: null, prescriber: null } },
      routing: { outcome: "type2_endorsement" }, rbCode: null,
    });
    expect(store().lifecycles[D.id].state).toBe("in_review");
    store().recordType2Decision({
      caseId: D.id, decision: "REFER_BACK", reason: "Cannot establish product presentation from the poor paper.", rbCode: "RB2B",
    });
    expect(store().itemProcesses[D.id]).toMatchObject({ routing: { outcome: "referred_back" }, rbCode: "RB2B" });
    expect(store().lifecycles[D.id].history.at(-1)?.actor).toBe("operator");
  });

  it("builds from explicitly confirmed complete declaration without improving image evidence", () => {
    const original = structuredClone(D);
    const revision = submitDeclaration();
    const prepared = preparePaperCapture(true, revision.declaration);
    expect(prepareCaptureConfirmation({
      caseId: D.id, revision: revision.number, ...prepared, declaration: revision.declaration, declarationReconciled: false,
    }).input).toBeNull();
    const result = prepareCaptureConfirmation({
      caseId: D.id, revision: revision.number, ...prepared, declaration: revision.declaration, declarationReconciled: true,
    });
    if (!result.input) throw new Error("Expected a prepared declaration capture");
    store().confirmType1(result.input);
    const c = sessionCase(D.id)!;
    expect(c.extracted).toEqual(original.extracted);
    expect(c.imageQuality).toBe(0.31);
    expect(c.regions).toEqual(original.regions);
    expect(c.readings).toEqual(original.readings);
    expect(runAgent(c)).toMatchObject({
      recommendation: "SUFFICIENT", gate: { result: "PASS" },
      tariffVersion: "2026-08", clause: { id: "P2-C9" }, signals: { imageQuality: 0.31 },
    });
    expect(store().caseRevisions[D.id].at(-1)).toEqual(revision);
    expect(store().itemProcesses[D.id].routing.outcome).toBe("type2_endorsement");
    expect(store().lifecycles[D.id].state).toBe("in_review");
  });

  it.each([
    { quantity: "99", prescriber: "Dr Demo (synthetic)", recommendation: "ABSTAIN", gate: "NOT_RUN" },
    { quantity: "100", prescriber: "", recommendation: "ABSTAIN", gate: "NOT_RUN" },
  ])("does not let a checked box bypass $recommendation evidence limits", ({ quantity, prescriber, recommendation, gate }) => {
    const revision = submitDeclaration();
    const prepared = preparePaperCapture(true, revision.declaration);
    const result = prepareCaptureConfirmation({
      caseId: D.id, revision: revision.number, ...prepared, declaration: revision.declaration,
      fields: { ...prepared.fields, quantity, prescriber }, declarationReconciled: true,
    });
    if (!result.input) throw new Error("Expected valid draft syntax for store validation");
    store().confirmType1(result.input);
    expect(runAgent(sessionCase(D.id)!)).toMatchObject({ recommendation, gate: { result: gate } });
    expect(store().caseRevisions[D.id].at(-1)?.declaration).toEqual(submittedDeclaration);
    expect(D.extracted.prescriber).toBe("Illegible");
  });

  it("leaves stale draft rejection to the store without overwriting the new revision", () => {
    const revision = submitDeclaration();
    const result = prepareCaptureConfirmation({
      caseId: D.id, revision: revision.number, ...preparePaperCapture(true, revision.declaration),
      declaration: revision.declaration, declarationReconciled: true,
    });
    submitDeclaration();
    const before = getDomainSnapshot();
    if (!result.input) throw new Error("Expected a prepared declaration capture");
    expect(() => store().confirmType1(result.input!)).toThrow("current awaiting Type 1 revision");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("attributes a reconciled correction to the human, preserving the submitted declaration", () => {
    const revision = submitDeclaration();
    const prepared = preparePaperCapture(true, revision.declaration);
    const result = prepareCaptureConfirmation({
      caseId: D.id, revision: revision.number, ...prepared, declaration: revision.declaration,
      fields: { ...prepared.fields, prescriber: "Dr Example (synthetic)" }, declarationReconciled: true,
    });
    if (!result.input) throw new Error("Expected a reconciled human correction");
    expect(result.input).toMatchObject({ provenance: "human_capture", declarationReconciled: true });
    store().confirmType1(result.input);
    expect(runAgent(sessionCase(D.id)!)).toMatchObject({ recommendation: "SUFFICIENT", gate: { result: "PASS" } });
    expect(store().caseRevisions[D.id].at(-1)?.declaration).toEqual(submittedDeclaration);
  });
});
const context = { caseId: "EX-24123", revision: 2 };

describe("paper capture presentation, not evidence authority", () => {
  it("leaves manual capture empty even when a declaration exists", () => {
    expect(preparePaperCapture(false, declaration)).toEqual({
      fields: { productCode: "", quantity: "", endorsementText: "", prescriber: "" }, provenance: "human_capture",
    });
    expect(preparePaperCapture(true)).toEqual(preparePaperCapture(false, declaration));
  });

  it("prefills only the attributed immutable declaration without confirming anything", () => {
    const prepared = preparePaperCapture(true, declaration);
    expect(prepared).toEqual({
      fields: { productCode: "SYN-001", quantity: "28", endorsementText: "NCSO AB 12/08/2026", prescriber: "Dr Demo (synthetic)" },
      provenance: "pharmacy_declaration",
    });
    prepared.fields.endorsementText = "Human correction";
    expect(declaration.fields.endorsementText).toBe("NCSO AB 12/08/2026");
    expect(PAPER_DECLARATION_PROVENANCE).toBe("declared by the pharmacy, not read from the form");
  });

  it("does not invent missing declaration fields", () => {
    expect(preparePaperCapture(true, { ...declaration, fields: { productCode: null, quantity: null, endorsementText: "" } }).fields)
      .toEqual({ productCode: "", quantity: "", endorsementText: "", prescriber: "" });
  });

  it("requires a separate explicit human reconciliation for declared fields", () => {
    const prepared = preparePaperCapture(true, declaration);
    expect(prepareCaptureConfirmation({ ...context, ...prepared, declaration, declarationReconciled: false })).toEqual({
      input: null, errors: { declarationReconciled: "Reconcile the declaration with the paper, or use manual capture." },
    });
    expect(prepareCaptureConfirmation({ ...context, ...prepared, declaration, declarationReconciled: true }).input)
      .toEqual({ ...context, fields: declaration.fields, provenance: "pharmacy_declaration", declarationReconciled: true });
  });

  it("keeps manual unknowns explicit for authoritative downstream routing", () => {
    expect(prepareCaptureConfirmation({
      ...context, ...preparePaperCapture(false), declarationReconciled: true,
    }).input).toEqual({
      ...context, fields: { productCode: null, quantity: null, endorsementText: "", prescriber: null },
      provenance: "human_capture", declarationReconciled: false,
    });
  });

  it("cannot attribute a draft to an unavailable pharmacy declaration", () => {
    const result = prepareCaptureConfirmation({
      ...context, ...preparePaperCapture(true, declaration), declarationReconciled: true,
    });
    expect(result.input).toBeNull();
    expect(result.errors?.declarationReconciled).toContain("original pharmacy declaration is unavailable");
  });

  it.each(["0", "-1", "1.5", "NaN", "Infinity", "1e2", "0x10", "9007199254740992", "two"])(
    "rejects invalid quantity %s rather than silently substituting a value", (quantity) => {
      const result = prepareCaptureConfirmation({
        ...context, ...preparePaperCapture(true, declaration), declaration,
        fields: { productCode: "SYN-001", quantity, endorsementText: "", prescriber: "" },
        declarationReconciled: true,
      });
      expect(result.input).toBeNull();
      expect(result.errors?.quantity).toBeTruthy();
    },
  );

  it("prepares corrected fields without altering the submission or granting authority", () => {
    expect(prepareCaptureConfirmation({
      ...context, provenance: "pharmacy_declaration", declaration, declarationReconciled: true,
      fields: { productCode: " SYN-002 ", quantity: " 56 ", endorsementText: " human correction ", prescriber: " Dr Demo (synthetic) " },
    }).input).toEqual({
      ...context, provenance: "human_capture", declarationReconciled: true,
      fields: { productCode: "SYN-002", quantity: 56, endorsementText: "human correction", prescriber: "Dr Demo (synthetic)" },
    });
    expect(declaration.fields.quantity).toBe(28);
  });
});
