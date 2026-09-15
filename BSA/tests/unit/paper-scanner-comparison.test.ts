import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PaperScannerComparison } from "../../src/components/demo/paper-scanner-comparison";
import { characterRecognitionConfidence, scanTextBlocks, wrapScanText } from "../../src/components/demo/paper-scanner-model";
import { caseById } from "../../src/lib/domain/cases";
import { seededLifecycleSession } from "../../src/lib/domain/lifecycle-seed";
import { reconcilePaperEvidence, type PaperReconciliationInput } from "../../src/lib/domain/paper-reconciliation";
import { submissionReplica } from "../../src/lib/domain/submission-fidelity";
import type { CaseRevision } from "../../src/lib/domain/lifecycle";
import type { ExceptionCase } from "../../src/lib/domain/types";

function source(readable = false) {
  const original = structuredClone(caseById(readable ? "EX-24112" : "EX-24123")!);
  const paper = {
    typedProduct: "  Co-codamol 30/500 tablets  ", quantity: 100, endorsementText: "NCSO JB 27/08/26",
    dispensingDate: "2026-08-27", declaredByPharmacy: true as const,
    brandManufacturer: "Pharmacy maker (synthetic)", packSize: 100, form: "tablets",
  };
  const revision: CaseRevision = {
    ...seededLifecycleSession().caseRevisions["EX-24123"][0],
    templateCaseId: original.id, channel: "paper", number: 2, kind: "resubmission",
    endorsementText: paper.endorsementText, paperDeclaration: paper,
  };
  const scan: ExceptionCase = {
    ...original, regions: [
      { id: "item", label: "Item on original paper", x: 1, y: 2, w: 50, h: 10, text: readable ? "Original supplied product 100" : "Co-cod?mol 30/5?0 t?bs 1??", confidence: readable ? 0.95 : 0.31 },
      { id: "endorsement", label: "Endorsement on original paper", x: 1, y: 20, w: 50, h: 10, text: readable ? "NCSO JB 27/08/26" : "N?S? JB ??/08/26", confidence: readable ? 0.99 : 0.2 },
    ],
    extracted: { ...original.extracted, dispensingDate: "2026-08-27", prescriber: readable ? "Dr Source (synthetic)" : "Illegible" },
  };
  const evidence: PaperReconciliationInput = {
    revision: 2,
    declaration: { productCode: "SYN-COCOD-100", quantity: 100, dispensingDate: paper.dispensingDate },
    scan: { readable, fields: { productCode: "SYN-COCOD-100", quantity: readable ? 100 : null, dispensingDate: paper.dispensingDate }, provenance: "original_scan" },
    characterRecognition: [
      { field: "productCode", value: readable ? "SYN-COCOD-100" : "SYN-UNCERTAIN", confidence: readable ? 0.99 : 0.31 },
      { field: "quantity", value: readable ? 100 : null, confidence: readable ? 0.975 : 0.15 },
      { field: "dispensingDate", value: readable ? "2026-08-27" : null, confidence: readable ? 0.985 : 0.12 },
    ],
    tariffChecks: [{ field: "quantity", met: true, request: { rule: "quantity_matches_prescription" } }],
    verification: { gate1: "pass", gate2: readable ? "pass" : "fail", reconciled: readable, released: false },
  };
  return { submission: submissionReplica(revision, scan), reconciliation: reconcilePaperEvidence(evidence) };
}

function column(html: string, name: string) {
  return html.split(`data-paper-source="${name}"`)[1]?.split("</section>")[0] ?? "";
}

describe("three independent immutable scanner sources", () => {
  it.each([false, true])("renders the exact three column labels with read-only values and confidence, readable=%s", (readable) => {
    const props = source(readable), before = structuredClone(props);
    const html = renderToStaticMarkup(createElement(PaperScannerComparison, props));
    expect(html).toContain('aria-label="Paper scanner comparison"');
    expect(html).toContain("As submitted by the pharmacy");
    expect(html).toContain("Pharmacy&#x27;s declaration (as typed)");
    expect(html).toContain("Scan as the high-speed scanner sees it");
    expect(html).toContain("Extracted by character recognition (hypothetical)");
    expect(html).toContain("synthetic; illustrates what NHSBSA&#x27;s capture would produce");
    expect(html.match(/data-paper-source=/g)).toHaveLength(3);
    expect(html).toContain("grid-cols-3");
    expect(html).not.toMatch(/<(input|button|textarea|select)\b/);
    expect(html).not.toMatch(/max-h-|overflow-(auto|hidden)|line-clamp-/);
    expect(column(html, "declaration")).toContain("  Co-codamol 30/500 tablets  ");
    expect(column(html, "declaration")).toContain("Pharmacy maker (synthetic)");
    expect(column(html, "character-recognition")).toContain(readable ? "97.5%" : "15%");
    expect(props).toEqual(before);
  });

  it("does not replace unknown OCR dates with the correct declaration or source date", () => {
    const html = renderToStaticMarkup(createElement(PaperScannerComparison, source()));
    expect(column(html, "declaration")).toContain("2026-08-27");
    expect(column(html, "scan")).toContain("2026-08-27");
    const ocr = column(html, "character-recognition");
    expect(ocr).toContain("Dispensing date");
    expect(ocr).toContain("Unknown");
    expect(ocr).toContain("12%");
    expect(ocr).not.toContain("2026-08-27");
  });
  it("distinguishes a known blank from an unknown reading and associates their source labels", () => {
    const props = source(true);
    const reconciliation = { ...props.reconciliation, evidence: { ...props.reconciliation.evidence, characterRecognition: [
      { field: "brandManufacturer" as const, value: "", confidence: 0.99 },
      { field: "packSize" as const, value: null, confidence: 0.99 },
    ] } };
    const html = renderToStaticMarkup(createElement(PaperScannerComparison, { ...props, reconciliation }));
    const ocr = column(html, "character-recognition");
    expect(ocr).toContain("Blank");
    expect(ocr).toContain("Unknown");
    expect(ocr).toContain('aria-describedby="_R_0_-ocr-source"');
    expect(column(html, "declaration")).toContain('aria-describedby="_R_0_-declaration-source"');
  });

  it("keeps later human-confirmed corrections outside all three original columns", () => {
    const before = source();
    const reconciliation = reconcilePaperEvidence({
      ...before.reconciliation.evidence,
      capture: { revision: 2, declarationReconciled: true, fields: { productCode: "SYN-HUMAN-CORRECTION", quantity: 100, prescriber: "Dr Human (synthetic)" } },
    });
    const raw = renderToStaticMarkup(createElement(PaperScannerComparison, before));
    const corrected = renderToStaticMarkup(createElement(PaperScannerComparison, { ...before, reconciliation }));
    for (const name of ["declaration", "scan", "character-recognition"]) expect(column(corrected, name)).toBe(column(raw, name));
    expect(corrected).toContain("Human-confirmed effective evidence");
    expect(corrected).toContain("SYN-HUMAN-CORRECTION");
    expect(corrected).toContain("Dr Human (synthetic)");
    expect(corrected).not.toContain("All sources agree");
  });

  it("never uses projected capture values or another revision to paint an original scan", () => {
    const props = source();
    const badSource = { ...props.submission, paperScan: { ...props.submission.paperScan!, capturedEvidence: {
      revision: 2, fields: { productCode: "SYN-REWRITTEN", quantity: 1, endorsementText: "Rewritten" },
      provenance: "human_capture" as const, declarationReconciled: true,
    } } };
    const html = renderToStaticMarkup(createElement(PaperScannerComparison, { ...props, submission: badSource }));
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("<svg");
    const stale = renderToStaticMarkup(createElement(PaperScannerComparison, {
      ...props, submission: { ...props.submission, asSubmitted: { ...props.submission.asSubmitted, number: 3 } },
    }));
    expect(stale).toContain("does not belong to this submission revision");
    expect(stale).not.toContain("data-paper-source");
  });

  it("labels an explicit pharmacy amendment and keeps an earlier submission unchanged", () => {
    const original = source(), before = structuredClone(original);
    const amendment = { ...original, reconciliation: reconcilePaperEvidence({
      ...original.reconciliation.evidence, scan: { ...original.reconciliation.evidence.scan, provenance: "acknowledged_pharmacy_amendment" },
    }) };
    expect(renderToStaticMarkup(createElement(PaperScannerComparison, amendment))).toContain("Explicit pharmacy amendment (synthetic)");
    expect(original).toEqual(before);
  });

  it("renders missing declarations and OCR explicitly, never using capture as a fallback", () => {
    const props = source();
    const submission = { ...props.submission, asSubmitted: { ...props.submission.asSubmitted, paperDeclaration: undefined, declaration: undefined } };
    const reconciliation = { ...props.reconciliation, evidence: { ...props.reconciliation.evidence, characterRecognition: [] } };
    const html = renderToStaticMarkup(createElement(PaperScannerComparison, { submission, reconciliation }));
    expect(html).toContain("No declaration accompanied this paper");
    expect(html).toContain("No hypothetical extraction supplied");
  });
});

describe("synthetic source image presentation", () => {
  it("renders a single-string SVG title without React child warnings", () => {
    const warning = vi.spyOn(console, "error");
    try {
      const html = renderToStaticMarkup(createElement(PaperScannerComparison, source()));
      expect(html).toContain(">Synthetic submitted paper scan: EX-24123</title>");
      expect(warning).not.toHaveBeenCalled();
    } finally {
      warning.mockRestore();
    }
  });
  it("draws source regions only, preserving uncertain glyphs and source date", () => {
    const scan = source().submission.paperScan!;
    const blocks = scanTextBlocks(scan);
    expect(blocks[0].lines.join(" ")).toBe(scan.regions[0].text);
    expect(blocks.at(-1)?.lines).toEqual(["2026-08-27"]);
    expect(blocks.some((block) => block.lines.includes("Illegible"))).toBe(true);
    expect(blocks.find((block) => block.label === "Synthetic patient label")?.lines.join(" ")).toBe(scan.patientLabel);
    expect(blocks.find((block) => block.label === "Submitting pharmacy")?.lines.join(" ")).toContain(scan.pharmacy.contractorCode);
  });
  it("leaves an explicitly blank source region empty instead of labelling it unreadable", () => {
    const scan = source(true).submission.paperScan!;
    const blocks = scanTextBlocks({ ...scan, regions: [{ ...scan.regions[0], label: "Brand or manufacturer", text: "" }] });
    expect(blocks[0]).toEqual({ label: "Brand or manufacturer", lines: [""] });
  });
  it("wraps long source strings without ellipsis, truncation or corrected values", () => {
    const text = "Original synthetic manufacturer with a deliberately long unchanged field value";
    expect(wrapScanText(text).join(" ")).toBe(text);
    expect(wrapScanText("X".repeat(105)).join("")).toBe("X".repeat(105));
    expect(wrapScanText(text).every((line) => line.length <= 30)).toBe(true);
    expect(() => wrapScanText(text, 0)).toThrow();
  });
  it.each([0, 0.001, 0.31, 0.985, 1])("keeps provided confidence %s instead of inventing certainty", (confidence) => {
    const label = characterRecognitionConfidence(confidence);
    expect(Number(label.replace("%", ""))).toBeCloseTo(confidence * 100);
  });
  it.each([-0.1, 1.1, NaN, Infinity])("rejects invalid confidence %s", (confidence) => {
    expect(() => characterRecognitionConfidence(confidence)).toThrow();
  });
  it("does not round a sub-certain source confidence up to 100 per cent", () => {
    expect(characterRecognitionConfidence(0.9999999999)).not.toBe("100%");
  });
});
