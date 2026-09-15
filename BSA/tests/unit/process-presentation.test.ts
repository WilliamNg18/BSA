import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BaselineCalculator } from "@/components/demo/baseline-calculator";
import { BaselineScene } from "@/components/demo/baseline-scene";
import { ExceptionPipeline } from "@/components/demo/exception-pipeline";
import { MonthlyNumber } from "@/components/demo/monthly-number";
import { SceneEstimateNumber } from "@/components/demo/scene-estimate-number";
import { AssumptionsPage } from "@/pages/assumptions";
import { BoundaryPage } from "@/pages/boundary";
import { HomePage } from "@/pages/home";
import { ArchitecturePage } from "@/pages/architecture";
import { ARCHITECTURE } from "@/lib/domain/content";
import { TOOL_DEFINITIONS } from "@/lib/domain/tools";
import { CASES } from "@/lib/domain/cases";
import { MANUAL_LOOP_MONTH_DEFAULTS, PROCESS_MONTH_DEFAULTS, formatBaselineNumber, formatProcessHours, formatProcessItems, monthModel, type ManualLoopMonthInputs } from "@/lib/domain/baseline";
import { MANUAL_LOOP_METRICS } from "@/lib/domain/manual-loop-presentation";
import { useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

function render(Component: ComponentType, path = "/") {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(Component)));
}
function tourCard(markup: string, scenario: string) {
  const start = markup.search(new RegExp(`<li\\b[^>]*data-case="${scenario}"`));
  expect(start, `Tour card ${scenario}`).toBeGreaterThanOrEqual(0);
  const tail = markup.slice(start);
  let depth = 0;
  for (const tag of tail.matchAll(/<\/?li\b[^>]*>/g)) {
    depth += tag[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return tail.slice(0, tag.index + tag[0].length);
  }
  throw new Error(`Tour card ${scenario} has no closing list item`);
}


beforeEach(() => {
  useAppStore.getState().resetDemo();
  useAppStore.getState().setPerspective("both");
});

describe("whole-process presentation", () => {
  it("confines architecture branding to the reference table without rewriting contracts or stored sources", () => {
    const source = JSON.stringify({ ARCHITECTURE, TOOL_DEFINITIONS });
    const state = useAppStore.getState();
    const markup = render(ArchitecturePage);
    const mappings = markup.match(/<table\b[^>]*data-reference-mapping="true"[^>]*>[\s\S]*?<\/table>/g) ?? [];
    expect(mappings).toHaveLength(1);
    const mapping = mappings[0];
    if (!mapping) throw new Error("The reference mapping table is missing");
    expect(mapping).toContain("Reference mapping, one example");
    expect(mapping).toContain("Azure OpenAI");
    expect(markup.replace(mapping, "")).not.toMatch(/Azure|Microsoft|Foundry|OpenAI|Cosmos|Purview|Entra|Key Vault|Private Link|Application Insights|GitHub Actions|Bicep|Terraform|TypeScript/);
    expect(markup).toContain("Proposed for production");
    expect(markup).toContain("not assurance that synthetic rules can ship unchanged");
    expect(markup).toContain("NHSBSA");
    expect(markup).toContain("dm+d");
    expect(markup).toContain("Tariff");
    for (const capability of ["Read image region", "look up product/pack", "look up claim", "check history", "retrieve the effective-date Tariff clause"]) expect(markup).toContain(capability);
    expect(markup).toContain("Recording is application-owned, not a model write tool.");
    expect(markup).toContain("Five read-only sources:");
    expect(markup).toContain("effective-date Tariff corpus.");
    expect(markup).toContain("Captured fields are a source representation, not independent corroboration.");
    expect(JSON.stringify({ ARCHITECTURE, TOOL_DEFINITIONS })).toBe(source);
    expect(useAppStore.getState()).toBe(state);
  });

  it.each([0.1, 0.2, 7_222.222222, 96_000_000])("uses the same shared formatter for visible and accessible endpoints: %s", (value) => {
    for (const format of [formatProcessHours, formatProcessItems]) {
      const expected = format(value);
      const monthly = renderToStaticMarkup(createElement(MonthlyNumber, { value, format }));
      const scene = renderToStaticMarkup(createElement(SceneEstimateNumber, { value, format, enabled: true, scenario: monthModel(PROCESS_MONTH_DEFAULTS) }));
      for (const markup of [monthly, scene]) {
        expect(markup).toContain(`aria-label="${expected}"`);
        expect(markup).toContain(`<span aria-hidden="true">${expected}</span>`);
      }
    }
  });

  it.each([false, true])("shows both shared model columns without summing overlapping cohorts, agent %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const expected = monthModel(MANUAL_LOOP_MONTH_DEFAULTS);
    const markup = render(BaselineCalculator);
    for (const column of ["today", "withAgent"] as const) {
      for (const { key, format } of MANUAL_LOOP_METRICS) {
        expect(markup).toMatch(new RegExp(`data-process-metric="${column}-${key}"[^]*?aria-label="${format(expected[column][key])}"`));
      }
    }
    expect(markup).toContain("With total includes abstention gathering and judgement for every queued item");
    expect(markup).toContain("This is not a claim about real staff or historical records");
    expect(markup).toContain("297.5 operator hours gathering and judging");
    expect(markup).not.toContain("Items one operator can complete");
    expect(markup).not.toContain("Time is spent only");
    expect(markup).not.toContain('role="switch"');
  });

  it("uses edited process inputs in both calculator and scene without perspective-dependent state", () => {
    const inputs: ManualLoopMonthInputs = { ...MANUAL_LOOP_MONTH_DEFAULTS, monthlyItems: 1_000, manualLoopItems: 2, gatheringMinutesToday: 0.01, mysCompletionMinutes: 0.02 };
    for (const key of Object.keys(inputs) as (keyof ManualLoopMonthInputs)[]) useAppStore.getState().setManualLoopInput(key, String(inputs[key]));
    const expected = monthModel(inputs);
    for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
      useAppStore.getState().setPerspective(perspective);
      const before = useAppStore.getState();
      const calculator = render(BaselineCalculator);
      const scene = render(BaselineScene);
      expect(calculator).toMatch(new RegExp(`data-process-metric="today-operatorHours"[^]*?aria-label="${formatBaselineNumber(expected.today.operatorHours, 1)}"`));
      expect(scene).toMatch(new RegExp(`data-scene-metric="autoPricedItems"[^]*?>${formatBaselineNumber(expected.counts.autoPricedItems, 1)}</span>`));
      expect(useAppStore.getState()).toBe(before);
    }
  });

  it("invalid shared inputs remove stale metrics and expose the invalid field", () => {
    useAppStore.getState().setManualLoopInput("monthlyItems", "invalid");
    const calculator = render(BaselineCalculator);
    expect(calculator).toContain('role="alert"');
    expect(calculator).toContain('aria-invalid="true"');
    expect(calculator).toContain('data-month-detail="true" open=""');
    expect(calculator).not.toContain("data-process-metric");
    expect(render(BaselineScene)).not.toContain("data-scene-metric");
    expect(render(ExceptionPipeline)).not.toContain("data-pipeline-referrals");
  });

  it("starts with automation and preserves separately qualified public context", () => {
    const markup = render(HomePage, "/#scene");
    expect(markup.indexOf('data-key-figure="automated-items"')).toBeLessThan(markup.indexOf('data-key-figure="staff-touch"'));
    expect(markup).toContain("Most items");
    expect(markup).toContain("Approximately 4%");
    expect(markup).toContain("Approximately 85,000");
    expect(markup).toContain("Over 100,000,000");
    expect(markup).toContain("91%");
    expect(markup).toContain("9%");
    expect(markup).toContain("2,200,000");
    expect(markup).toContain("2,000,000");
    expect(markup).toContain("not independently verified here");
  });

  it.each([false, true])("keeps branching and human authority in both pipeline modes: %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const markup = render(ExceptionPipeline);
    for (const stage of ["channels", "rules", "type1", "type2", "referred-back", "mys", "resubmit"]) expect(markup).toContain(`data-pipeline-stage="${stage}"`);
    expect(markup).toContain("data-auto-bypass");
    expect(markup).toContain("No Type 1 or Type 2 queue row.");
    expect(markup).toContain("EPS");
    expect(markup).toContain("dm+d");
    expect(markup).toContain("MYS Unpaid items");
    expect(markup).toContain("NHSmail");
    expect(markup.match(/data-agent-kernel=/g)?.length ?? 0).toBe(enabled ? 3 : 0);
    if (enabled) expect(markup).toContain("declared by the pharmacy, not read from the form");
    expect(markup).not.toContain('role="switch"');
    expect(markup).not.toContain("These items never enter");
  });

  it("retains opposite-side navigation guards", () => {
    useAppStore.getState().setPerspective("pharmacy");
    expect(render(ExceptionPipeline)).not.toContain('href="/queue"');
    useAppStore.getState().setPerspective("nhsbsa");
    const markup = render(ExceptionPipeline);
    expect(markup).not.toContain('href="/pharmacy"');
    expect(markup).not.toContain('href="/pharmacy/claims"');
  });

  it("shares current editable inputs with assumptions and labels the old register historical", () => {
    const markup = render(AssumptionsPage);
    expect(markup).toContain("Shared process assumptions");
    expect(markup).toContain('id="process-monthlyItems"');
    expect(markup).toContain("Historical referral-only comparison");
    expect(markup).toMatch(/<details[^>]*data-legacy-assumptions="true"[^>]*>/);
    expect(markup).not.toMatch(/<details[^>]*data-legacy-assumptions="true"[^>]*open/);
  });

  it("marks the unreadable-paper design proposed without inventing image certainty", () => {
    const markup = render(BoundaryPage);
    expect(markup).toContain("Proposed: poor-paper declaration path");
    expect(markup).toContain("The agent cannot read the poor scan");
    expect(markup).toContain("declared by the pharmacy, not read from the form");
    expect(markup).toContain("Type 2 judgement remains human");
  });

  it.each([false, true])("shows current routing in the four-case tour without an operator action for automatic A: %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const markup = render(HomePage, "/#cases");
    expect(markup).toContain('data-case="A" data-case-routing="auto_priced"');
    expect(markup).not.toContain("Open case A");
    expect(markup).toContain("no person involved");
    expect(markup).toContain('data-case="D" data-case-routing="type1_capture"');
    expect(markup).toContain("Unreadable paper");
    expect(markup).toContain("Open case D");
    if (enabled) {
      expect(markup).toContain("Humans confirm compatible evidence; image certainty stays unknown.");
      expect(markup).toContain("Unreconciled evidence still abstains.");
    }
    useAppStore.getState().submitItem({ caseId: "EX-24107", channel: "eps", endorsementText: "NCSO RK" });
    const resubmitted = render(HomePage, "/#cases");
    expect(resubmitted).toContain('data-case="A" data-case-routing="type2_endorsement"');
    expect(resubmitted).toContain("Open case A");
  });

  it("renders all four playable tour items without treating background C as unavailable evidence", () => {
    const before = useAppStore.getState();
    const markup = render(HomePage, "/#cases");
    expect(markup).not.toContain('role="alert"');
    for (const id of ["EX-24107", "EX-24112", "SYN-FQ123-MISMATCH", "EX-24123"]) {
      expect(markup).toContain(id);
    }
    expect(markup).not.toContain('href="/case/EX-24119"');
    expect(markup).not.toContain('href="/case/EX-24088"');
    expect(useAppStore.getState()).toBe(before);
  });

  it.each([
    { name: "B EPS Off", id: "EX-24112", scenario: "B", paper: false, enabled: false, declared: false },
    { name: "B readable paper Off", id: "EX-24112", scenario: "B", paper: true, enabled: false, declared: false },
    { name: "B readable paper undeclared On", id: "EX-24112", scenario: "B", paper: true, enabled: true, declared: false },
    { name: "D unreadable paper undeclared On", id: "EX-24123", scenario: "D", paper: true, enabled: true, declared: false },
    { name: "D unreadable paper declared On", id: "EX-24123", scenario: "D", paper: true, enabled: true, declared: true },
  ])("tour guidance reflects current source evidence: $name", ({ id, scenario, paper, enabled, declared }) => {
    const store = useAppStore.getState();
    if (!declared) store.submitItem({
      caseId: id, channel: paper ? "paper" : "eps",
      endorsementText: paper ? "NCSO RK 21/08/26" : "NCSO RK",
    });
    store.setAgentEnabled(enabled);
    const before = useAppStore.getState();
    const markup = render(HomePage, "/#cases");
    const card = tourCard(markup, scenario);
    expect(useAppStore.getState()).toBe(before);
    if (!paper) {
      expect(card).toContain("Read EPS claim message");
      expect(card).not.toContain("Locate image");
      expect(card).not.toContain("Locate paper image");
      expect(card).not.toContain("Awaiting Type 1 capture");
      return;
    }
    expect(card).toContain('data-case-capture="pending"');
    expect(card).toContain("Type 1 capture");
    if (scenario === "B") expect(card).not.toContain("Unreadable paper");
    else expect(card).toContain("Unreadable paper");
    if (declared) {
      expect(card).toContain("declared by the pharmacy, not read from the form");
      expect(card).toContain("Humans confirm compatible evidence");
      expect(card).toContain("Unreconciled evidence still abstains");
    } else {
      expect(card).not.toContain("declared by the pharmacy");
      expect(card).not.toContain("Agentic action");
      expect(card).toContain("Type 2 judgement follows only when required.");
      if (enabled) expect(card).toContain("No pharmacy declaration is available.");
    }
    const panel = card.match(/aria-label="Awaiting Type 1 capture">([\s\S]*?)<\/section>/)?.[1];
    expect(panel).toBeDefined();
    const prose = [...panel!.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)]
      .map((match) => match[1].replace(/<[^>]*>/g, "")).join(" ");
    expect(prose.trim().split(/\s+/).length).toBeLessThan(25);
  });

  it.each([false, true])("retains human attribution after capture-only pricing without another action, Agent %s", (enabled) => {
    const store = useAppStore.getState();
    store.setAgentEnabled(enabled);
    store.submitItem({ caseId: "EX-24112", channel: "paper", endorsementText: "NCSO RK 21/08/26" });
    const revision = useAppStore.getState().caseRevisions["EX-24112"].at(-1)!;
    const item = CASES.find((candidate) => candidate.id === "EX-24112")!;
    store.confirmType1({
      caseId: "EX-24112", revision: revision.number,
      fields: { productCode: item.extracted.productCode, quantity: item.extracted.quantity, endorsementText: "NCSO RK 21/08/26" },
      provenance: "human_capture", declarationReconciled: true,
    });
    const state = useAppStore.getState();
    expect(state.itemProcesses["EX-24112"].routing).toMatchObject({ outcome: "type1_capture", requiresHuman: false });
    expect(state.lifecycles["EX-24112"].state).toBe("paid");
    for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
      store.setPerspective(perspective);
      const before = useAppStore.getState();
      const markup = render(HomePage, "/#cases");
      const card = tourCard(markup, "B");
      expect(card).toContain('data-case-capture="complete"');
      expect(card).toContain("Completed Type 1 capture");
      expect(card).toContain("A person confirmed the captured fields");
      expect(card).not.toContain("Awaiting Type 1 capture");
      expect(card).not.toContain("no person involved");
      expect(card).not.toContain("Open case B");
      expect(card).not.toContain("data-outcome");
      expect(useAppStore.getState()).toBe(before);
    }
  });
});
