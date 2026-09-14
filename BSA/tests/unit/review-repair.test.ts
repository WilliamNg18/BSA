import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { SceneDiagram } from "../../src/components/demo/tour-diagrams";
import { BaselineCalculator } from "../../src/components/demo/baseline-calculator";
import { Type1Capture } from "../../src/components/demo/type1-capture";
import { EpsPharmacyCapture } from "../../src/components/demo/eps-pharmacy-capture";
import { PharmacyClaimsPage } from "../../src/pages/pharmacy-claims";
import { CasePackPage } from "../../src/pages/case-pack";
import { HomePage } from "../../src/pages/home";
import { NotificationContext } from "../../src/hooks/use-notification";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";
import { runAgent } from "../../src/lib/domain/agent";
import { CASES } from "../../src/lib/domain/cases";
import { abstentionReasonLabel } from "../../src/lib/abstention-display";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});
vi.mock("@/hooks/use-reduced-motion", () => ({ useReducedMotion: () => true }));

beforeEach(() => useAppStore.getState().resetDemo());

function render(Component: ComponentType, path = "/") {
  return renderToStaticMarkup(createElement(NotificationContext.Provider, { value: { show: () => {}, clear: () => {} } },
    createElement(MemoryRouter, { initialEntries: [path] },
      createElement(Routes, null, createElement(Route, { path: path.startsWith("/case/") ? "/case/:id" : "*", element: createElement(Component) })))));
}
const text = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const words = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
const paragraphs = (html: string) => [...html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)].map((match) => text(match[1]));

function section(html: string, marker: string) {
  const at = html.indexOf(marker);
  expect(at, marker).toBeGreaterThanOrEqual(0);
  const start = html.lastIndexOf("<section", at);
  let depth = 0;
  for (const match of html.slice(start).matchAll(/<\/?section\b[^>]*>/g)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(start, start + match.index! + match[0].length);
  }
  throw new Error(`Unclosed section: ${marker}`);
}
function capture() {
  return renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123" }));
}
function declare(endorsementText = "NCSO JB 27/08/26", dispensingDate = "2026-08-27") {
  const store = useAppStore.getState();
  store.submitItem({ caseId: "EX-24123", channel: "paper", endorsementText,
    paperDeclaration: { typedProduct: "Co-codamol 30/500 tablets", quantity: 100, endorsementText, dispensingDate, declaredByPharmacy: true } });
  store.setAgentEnabled(true);
}
function expectOperatorProse(html: string) {
  const panel = section(html, "Operator decision</h2>");
  const help = [...panel.matchAll(/<span class="text-xs text-muted-foreground">([\s\S]*?)<\/span>/g)].map((m) => text(m[1]));
  expect(words([...paragraphs(panel), ...help].join(" "))).toBeLessThan(25);
  return panel;
}

it("keeps the Overview branch and complete monthly-effort explanation below 25 words", () => {
  const scene = render(SceneDiagram).split("Uncertain items</p>")[1].split("</li>")[0];
  expect(words(paragraphs(scene).join(" "))).toBeLessThan(25);
  expect(scene).toContain("Items may need both");
  const month = render(BaselineCalculator);
  const effort = paragraphs(month).filter((p) => p.includes("With total") || p.includes("Built cases") || p.includes("built cases"));
  expect(words(effort.join(" "))).toBeLessThan(25);
  expect(effort.join(" ")).toContain("abstention gathering and judgement for every queued item");
  expect(effort.join(" ")).toContain("without double-checks");
});

it.each([false, true])("keeps monthly-count and MYS explanations cumulative and concise, Agent %s", (enabled) => {
  useAppStore.getState().setAgentEnabled(enabled);
  const html = render(PharmacyClaimsPage, "/pharmacy/claims");
  const monthly = section(html, 'aria-label="Selected pharmacy this month"').split('aria-label="Shared monthly process projection"')[0];
  expect(words(paragraphs(monthly).join(" "))).toBeLessThan(25);
  const mys = section(html, 'aria-label="MYS Unpaid items"');
  expect(words(paragraphs(mys).join(" "))).toBeLessThan(25);
  for (const required of ["NHSmail", "18 months", "80%", "balance when priced", "calculates no payments"]) expect(mys).toContain(required);
});

it.each(["NCSO JB 27/08/26", "NCSO JB", "BB JB"])("keeps received declaration advice, reconciliation consent and footer concise: %s", (endorsement) => {
  declare(endorsement);
  const before = getDomainSnapshot();
  const html = capture();
  const checkStart = html.indexOf('<div class="space-y-2 rounded-md border p-3 text-sm">');
  expect(checkStart).toBeGreaterThan(0);
  const check = html.slice(checkStart, html.indexOf("</div>", checkStart));
  const narrative = paragraphs(check).filter((p) => !p.startsWith("Declared dispensing-month Tariff:"));
  expect(words(narrative.join(" "))).toBeLessThan(25);
  const label = text(html.match(/<label class="flex items-start gap-2 text-sm">([\s\S]*?)<\/label>/)![1]);
  const explanation = paragraphs(html).find((p) => p.startsWith("Attestation,"))!;
  expect(words(`${label} ${explanation}`)).toBeLessThan(25);
  expect(explanation).toContain("not proven image agreement");
  const footer = paragraphs(html).filter((p) => p.startsWith("Code routes"));
  expect(words(footer.join(" "))).toBeLessThan(25);
  expect(footer.join(" ")).toContain("a person decides");
  expect(getDomainSnapshot()).toEqual(before);
});

it.each([false, true])("confirmed paper says supplied, not read; attestation never proves agreement, conflict=%s", (conflict) => {
  declare();
  const store = useAppStore.getState();
  store.confirmType1({ caseId: "EX-24123", revision: store.caseRevisions["EX-24123"].at(-1)!.number,
    fields: { productCode: conflict ? "SYN-AMLO10-28" : "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO JB 27/08/26", prescriber: "Dr Demo (synthetic)" },
    provenance: "human_capture", declarationReconciled: true });
  const before = getDomainSnapshot();
  const c = sessionCase("EX-24123")!;
  const pack = runAgent(c, { agentEnabled: true });
  if (conflict) expect(pack.recommendation).toBe("ABSTAIN");
  else {
    expect(pack.recommendation).toBe("SUFFICIENT");
    expect(pack.gate.checks.find((p) => p.name === "Mandatory fields present")?.detail).toBe("All mandatory fields supplied");
  }
  const html = capture();
  expect(html).toContain("The operator attested reconciliation; this does not prove source agreement.");
  expect(html).not.toContain("declaration and paper explicitly reconciled");
  expect(html).not.toContain("All mandatory fields read");
  expectOperatorProse(render(CasePackPage, "/case/EX-24123"));
  expect(getDomainSnapshot()).toEqual(before);
});

it("preserves the original three D reasons and all five signals while displaying concise aliases", () => {
  const pack = runAgent(CASES[3], { agentEnabled: true });
  const reasons = [...pack.abstainReasons];
  expect(reasons).toHaveLength(3);
  expect(reasons.map(abstentionReasonLabel)).toEqual(["No governing provision.", "Image quality 0.31; minimum 0.60.", "1/3 readings agree."]);
  expect(pack.abstainReasons).toEqual(reasons);
  expect(pack.signals.reconciliation).toBe("not_established");
  expect(pack.gate.result).toBe("NOT_RUN");
  expect(words(`No recommendation. ${reasons.map(abstentionReasonLabel).join(" ")}`)).toBeLessThan(25);
  const missing = ["Human-confirmed fields remain unknown, conflicting or unreconciled, or no provision was retrieved.",
    "Missing evidence: Product identified", "Missing evidence: Quantity present", "Missing evidence: Dispensing date present", "Missing evidence: Prescriber present"];
  expect(words(`No recommendation. ${missing.map(abstentionReasonLabel).join(" ")}`)).toBeLessThan(25);
  expect(abstentionReasonLabel("Unrecognised evidence explanation")).toBe("Unrecognised evidence explanation");
});

it.each([
  "constructor", "__proto__", "toString", "Unrecognised evidence explanation",
])("preserves unknown abstention text without resolving inherited keys: %s", (reason) => {
  expect(abstentionReasonLabel(reason)).toBe(reason);
});

it.each([
  { id: "EX-24112", enabled: false }, { id: "EX-24112", enabled: true },
  { id: "SYN-FQ123-MISMATCH", enabled: false }, { id: "SYN-FQ123-MISMATCH", enabled: true },
])("keeps every operator choice and optional approval within one concise explanation: $id Agent $enabled", ({ id, enabled }) => {
  const store = useAppStore.getState();
  store.submitItem({ caseId: id, channel: "eps", endorsementText: id === "EX-24112" ? "NCSO RK" : sessionCase(id)!.extracted.endorsementText });
  store.arriveInQueue(id);
  store.setAgentEnabled(enabled);
  const html = expectOperatorProse(render(CasePackPage, `/case/${id}`));
  for (const choice of ["Request information", "Refer back", "Escalate", "Reason (required)", "Record decision"]) expect(html).toContain(choice);
  expect(html).toContain("No payment approval");
  if (enabled) expect(html).toContain("Draft approval is optional");
});

it("uses readable outcome labels and conditional manual EPS risk without prechecking Off", () => {
  useAppStore.getState().setAgentEnabled(true);
  const home = render(HomePage, "/#cases");
  expect(home).toContain("Complete format, wrong pack");
  expect(home).not.toContain(">REQUEST_INFORMATION<");
  useAppStore.getState().setAgentEnabled(false);
  const before = getDomainSnapshot();
  const eps = render(EpsPharmacyCapture, "/pharmacy");
  expect(eps).toContain("No advisory check; later correction is possible");
  expect(eps).not.toContain('aria-label="Claims precheck"');
  expect(getDomainSnapshot()).toEqual(before);
});
