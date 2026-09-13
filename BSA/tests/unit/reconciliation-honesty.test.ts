import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { compositeFrom } from "../../src/lib/domain/rules";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import { SignalList } from "../../src/components/demo/signals";
import type { ExceptionCase } from "../../src/lib/domain/types";
import { CasePackPage } from "../../src/pages/case-pack";
import { NotificationContext } from "../../src/hooks/use-notification";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});
vi.mock("@/hooks/use-reduced-motion", () => ({ useReducedMotion: () => true }));
afterEach(() => useAppStore.getState().resetDemo());

function renderCase(id: string) {
  return renderToStaticMarkup(createElement(NotificationContext.Provider, { value: { show: () => {}, clear: () => {} } },
    createElement(MemoryRouter, { initialEntries: [`/case/${id}`] },
      createElement(Routes, null, createElement(Route, { path: "/case/:id", element: createElement(CasePackPage) })))));
}

const [, B, C, D] = CASES;
const capturedD = (reconciled: boolean, quantity: number | null = 100): ExceptionCase => ({
  ...D,
  capturedEvidence: {
    revision: 1, provenance: "pharmacy_declaration", declarationReconciled: reconciled,
    fields: { productCode: "SYN-COCOD-100", quantity, endorsementText: "NCSO AB 27/08/26", prescriber: "Dr Demo (synthetic)" },
  },
});

describe("reconciliation distinguishes unknown evidence from agreement", () => {
  it.each([
    ["original unreadable D", D],
    ["unreconciled captured D", capturedD(false)],
    ["confirmed D with unknown quantity", capturedD(true, null)],
    ["unknown product on readable evidence", { ...B, extracted: { ...B.extracted, productCode: null } }],
    ["low-confidence quantity on readable evidence", { ...B, extracted: { ...B.extracted, quantityConfidence: 0.4 } }],
  ] as const)("%s cannot claim agreement from an empty conflict list", (_, c) => {
    const before = structuredClone(c);
    const pack = runAgent(c);
    expect(pack.conflicts).toEqual([]);
    expect(pack.signals.reconciliation).toBe("not_established");
    expect(pack.recommendation).toBe("ABSTAIN");
    expect(pack.composite.level).toBe("abstain");
    const trace = pack.trace.find((step) => step.phase === "RECONCILE")!;
    expect(trace.status).toBe("warn");
    expect(trace.summary).toContain("Reconciliation not established");
    expect(trace.items.join(" ")).not.toContain("? = claim");
    expect(c).toEqual(before);
  });

  it.each([C, capturedD(true, 99)])("retains material conflicts rather than relabelling them unknown", (c) => {
    const pack = runAgent(c);
    expect(pack.signals.reconciliation).toBe("conflict");
    expect(pack.trace.find((step) => step.phase === "RECONCILE")?.status).toBe("warn");
    expect(pack.conflicts.some((conflict) => conflict.material)).toBe(true);
  });

  it.each([B, capturedD(true)])("limits established agreement to comparable fields", (c) => {
    const pack = runAgent(c);
    expect(pack.signals.reconciliation).toBe("agree");
    const trace = pack.trace.find((step) => step.phase === "RECONCILE")!;
    expect(trace.status).toBe("ok");
    expect(trace.summary).toBe(c.capturedEvidence
      ? "Human-confirmed fields match the claim. Image agreement remains unknown; the declaration was not read from the form."
      : "Comparable fields agree. This does not establish agreement for missing or unreadable evidence.");
    expect(pack.recommendation).toBe(c.scenario === "D" ? "SUFFICIENT" : "REFER_BACK");
    if (c.scenario === "D") {
      expect(pack.signals.imageQuality).toBe(0.31);
      expect(pack.gate.result).toBe("PASS");
      expect(c.extracted.prescriber).toBe("Illegible");
    }
  });

  it("cannot report all five signals satisfied when reconciliation is not established", () => {
    const result = compositeFrom({
      provisionFound: true, sampleAgreement: { agree: 3, total: 3 },
      reconciliation: "not_established", imageQuality: 0.99, inCoverage: true,
    });
    expect(result.level).toBe("abstain");
    expect(result.reasons).toContain("Source reconciliation is not established from known comparable fields");
    expect(result.reasons.join(" ")).not.toContain("All five");
  });

  it("renders unknown reconciliation as unsatisfied, never green agreement", () => {
    const html = renderToStaticMarkup(createElement(SignalList, { signals: runAgent(D).signals }));
    const row = html.split("<li ").find((entry) => entry.includes("Sources reconcile"))!;
    expect(row).toContain("Not established");
    expect(row).not.toContain("bg-emerald");
    expect(row).not.toContain(", satisfied");
    expect(row).not.toContain(", not applicable");
    expect(row).toContain("bg-slate-400");
    expect(row).toContain(", not established");
  });

  it("keeps the lifecycle label neutral before any case is built", () => {
    expect(LIFECYCLE_LABELS.in_review.nhsbsa).toEqual({ on: "Awaiting operator", off: "Awaiting operator" });
  });

  it("renders D's unknown evidence and waiting lifecycle without false agreement or build claims", () => {
    useAppStore.getState().setAgentEnabled(true);
    const before = getDomainSnapshot();
    const html = renderCase(D.id);
    expect(html).toContain("Reconciliation not established.");
    expect(html).toContain("No detected conflict does not establish agreement.");
    expect(html).toContain("Awaiting operator");
    expect(html).not.toContain("The sources agree.");
    expect(html).not.toContain("No disagreement between the form");
    expect(html).not.toContain("Case built, awaiting operator");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("qualifies established case-pack agreement without hiding missing endorsement evidence", () => {
    useAppStore.getState().setAgentEnabled(true);
    const html = renderCase(B.id);
    expect(html).toContain("Comparable fields agree.");
    expect(html).toContain("This comparison does not establish agreement for missing or unreadable evidence.");
    expect(html).not.toContain("The sources agree.");
  });
});
