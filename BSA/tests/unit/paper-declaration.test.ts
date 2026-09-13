import { beforeEach, describe, expect, it } from "vitest";
import { CASES } from "../../src/lib/domain/cases";
import { checkPaperDeclaration, EMPTY_PAPER_DECLARATION, paperDeclarationAdvice, preparePaperDeclaration, WORKED_PAPER_DECLARATION } from "../../src/lib/domain/paper-declaration";
import { prepareCaptureConfirmation, preparePaperCapture } from "../../src/lib/domain/paper-capture";
import { runAgent } from "../../src/lib/domain/agent";
import { paperImageEvidence } from "../../src/lib/domain/capture-evidence";
import { sessionCase, useAppStore } from "../../src/lib/store";

const D = CASES.find((c) => c.scenario === "D")!;
const store = () => useAppStore.getState();
beforeEach(() => store().resetDemo());

describe("proposed paper declaration checks", () => {
  it("keeps complete, missing and unavailable advice below 25 explanatory words", () => {
    for (const draft of [WORKED_PAPER_DECLARATION, { ...WORKED_PAPER_DECLARATION, endorsementText: "NCSO JB" }, EMPTY_PAPER_DECLARATION]) {
      const result = checkPaperDeclaration(D, preparePaperDeclaration(draft));
      const advice = paperDeclarationAdvice(result, "", "");
      expect(advice.trim().split(/\s+/).length).toBeLessThan(25);
      if (result.status !== "unable") {
        expect(advice).toContain("prescriber evidence");
        expect(advice).toContain("initials and date");
        expect(advice).toContain("Human reconciliation");
      }
    }
  });
  it("checks the exact JB example against August without reading the image or needing invented prescriber data", () => {
    const before = structuredClone(D);
    const result = checkPaperDeclaration(D, preparePaperDeclaration(WORKED_PAPER_DECLARATION));
    expect(result).toMatchObject({ status: "ready", version: "2026-08", clause: { id: "P2-C9" } });
    expect(result.checks.find((check) => check.id === "dated")?.met).toBe(true);
    expect(result.agreement).toContain("image cannot be read");
    expect(D).toEqual(before);
    expect(D.extracted.prescriber).toBe("Illegible");
  });

  it("uses the declared dispensing month, not the old scan date", () => {
    const paper = preparePaperDeclaration({ ...WORKED_PAPER_DECLARATION, endorsementText: "NCSO JB", dispensingDate: "2026-07-27" });
    expect(checkPaperDeclaration(D, paper)).toMatchObject({ status: "ready", version: "2026-07" });
    const august = checkPaperDeclaration(D, { ...paper, dispensingDate: "2026-08-27" });
    expect(august.status).toBe("missing");
    expect(august.gap).toContain("the form must show both");
    expect(checkPaperDeclaration(D, { ...paper, dispensingDate: "2027-01-27" }).status).toBe("unable");
  });
  it("derives July advice from its retrieved initials-only clause and invents no requirements without a clause", () => {
    const paper = preparePaperDeclaration({ ...WORKED_PAPER_DECLARATION, endorsementText: "NCSO JB", dispensingDate: "2026-07-27" });
    for (const quantity of [100, 99]) {
      const result = checkPaperDeclaration(D, { ...paper, quantity });
      const advice = paperDeclarationAdvice(result, "", "");
      expect(advice).toContain("the form needs initials.");
      expect(advice).not.toContain("date");
      expect(advice.trim().split(/\s+/).length).toBeLessThan(25);
      expect(result.gap).not.toContain("needs initials and date");
    }
    for (const result of [null, checkPaperDeclaration(D, { ...paper, dispensingDate: "2027-01-27" })]) {
      const advice = paperDeclarationAdvice(result, "", "");
      expect(advice).not.toContain("the form needs");
      expect(advice).not.toContain("initials");
      expect(advice.trim().split(/\s+/).length).toBeLessThan(25);
    }
  });

  it.each(["0", "-1", "1.5", "1e2", "0x64", "Infinity", "9007199254740992"])("rejects malformed quantities %s", (quantity) => {
    expect(() => preparePaperDeclaration({ ...WORKED_PAPER_DECLARATION, quantity })).toThrow("positive whole quantity");
  });
  it.each(["2026-02-30", "2026-13-27", "27/08/26", "bad-date"])("rejects invalid dates %s", (dispensingDate) => {
    expect(() => preparePaperDeclaration({ ...WORKED_PAPER_DECLARATION, dispensingDate })).toThrow("valid dispensing date");
  });
  it("keeps missing and conflicting fields unresolved", () => {
    expect(checkPaperDeclaration(D, preparePaperDeclaration(EMPTY_PAPER_DECLARATION)).status).toBe("unable");
    expect(checkPaperDeclaration(D, preparePaperDeclaration({ ...WORKED_PAPER_DECLARATION, quantity: "99" })).status).toBe("missing");
    expect(checkPaperDeclaration(D, preparePaperDeclaration({ ...WORKED_PAPER_DECLARATION, typedProduct: "unknown" })).status).toBe("missing");
  });
});

describe("immutable paper declaration to human-confirmed Type 2", () => {
  it("treats ordinary workbench posting as a new attempt, distinct from correction of the seeded referral", () => {
    const B = CASES[1];
    expect(store().lifecycles[B.id].state).toBe("referred_back");
    store().submitItem({ caseId: B.id, channel: "paper", endorsementText: "NCSO AB 12/08/26" });
    const revision = store().caseRevisions[B.id].at(-1)!;
    expect(revision.kind).toBe("submission");
    store().confirmType1({
      caseId: B.id, revision: revision.number, provenance: "human_capture", declarationReconciled: false,
      fields: { productCode: B.claim.productCode, quantity: B.claim.quantity, endorsementText: "NCSO AB 12/08/26", prescriber: "Dr Demo (synthetic)" },
    });
    expect(store().itemProcesses[B.id].routing).toMatchObject({
      outcome: "type1_capture", requiresHuman: false, pricingAuthority: "existing_rules_engine",
    });
    expect(store().lifecycles[B.id].state).toBe("paid");
  });
  function submit() {
    const paper = preparePaperDeclaration(WORKED_PAPER_DECLARATION);
    store().setAgentEnabled(true);
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: paper.endorsementText, paperDeclaration: paper });
    return store().caseRevisions[D.id].at(-1)!;
  }
  it("never pre-fills the illegible prescriber and abstains until separately established evidence is confirmed", () => {
    const revision = submit();
    const prepared = preparePaperCapture(true, revision.declaration);
    expect(prepared.fields.prescriber).toBe("");
    expect(runAgent(sessionCase(D.id)!).recommendation).toBe("ABSTAIN");
    const result = prepareCaptureConfirmation({
      caseId: D.id, revision: revision.number, ...prepared, declaration: revision.declaration, declarationReconciled: true,
    });
    if (!result.input) throw new Error("Expected syntactically valid confirmation");
    store().confirmType1(result.input);
    expect(runAgent(sessionCase(D.id)!)).toMatchObject({ recommendation: "ABSTAIN", gate: { result: "NOT_RUN" } });
    expect(store().lifecycles[D.id].state).toBe("in_review");
  });
  it("preserves all source readings while a human supplies prescriber evidence and confirms the declared date", () => {
    const revision = submit();
    const result = prepareCaptureConfirmation({
      caseId: D.id, revision: revision.number, ...preparePaperCapture(true, revision.declaration),
      declaration: revision.declaration, declarationReconciled: true,
      fields: { ...preparePaperCapture(true, revision.declaration).fields, prescriber: "Dr Evidence (synthetic)" },
    });
    if (!result.input) throw new Error("Expected explicit human correction");
    store().confirmType1(result.input);
    const pack = runAgent(sessionCase(D.id)!);
    expect(pack).toMatchObject({ recommendation: "SUFFICIENT", gate: { result: "PASS" }, tariffVersion: "2026-08" });
    expect(pack.signals.imageQuality).toBe(D.imageQuality);
    expect(pack.signals.sampleAgreement).toEqual({ agree: 1, total: 3 });
    expect(pack.trace.find((step) => step.phase === "RECONCILE")?.summary).toContain("Image agreement remains unknown");
    expect(pack.evidence.find((item) => item.id === "e-region")?.value).toContain(D.regions.find((region) => region.id === "endorsement")!.text);
    expect(store().caseRevisions[D.id].at(-1)).toEqual(revision);
    expect(store().lifecycles[D.id].state).toBe("in_review");
    expect(store().itemProcesses[D.id].routing.outcome).toBe("type2_endorsement");
  });
  it("carries the declared date into rule selection and evidence without repainting the retained scan", () => {
    const paper = preparePaperDeclaration({ ...WORKED_PAPER_DECLARATION, dispensingDate: "2026-07-27" });
    store().submitItem({ caseId: D.id, channel: "paper", endorsementText: paper.endorsementText, paperDeclaration: paper });
    const c = sessionCase(D.id)!;
    expect(c.extracted.dispensingDate).toBe("2026-07-27");
    expect(paperImageEvidence(c).extracted).toEqual(D.extracted);
    expect(paperImageEvidence(c).regions).toEqual(D.regions);
    expect(runAgent(c).evidence.find((entry) => entry.id === "e-declared-dispensingDate")).toMatchObject({
      value: "2026-07-27", provenance: "declared by the pharmacy, not read from the form; original declaration retained",
    });
  });
});
