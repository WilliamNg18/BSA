import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { QueuePage } from "../../src/pages/queue";
import { DecisionRecordPage } from "../../src/pages/decision-record";
import { useAppStore } from "../../src/lib/store";
import { formatBaselineNumber, monthModel, PROCESS_MONTH_DEFAULTS } from "../../src/lib/domain/baseline";

afterEach(() => useAppStore.getState().resetDemo());

function queue() {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(QueuePage)));
}

function record(id: string) {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [`/case/${id}/record`] },
    createElement(Routes, null, createElement(Route, { path: "/case/:id/record", element: createElement(DecisionRecordPage) }))));
}

describe("Task 22 current-revision staff presentation", () => {
  it.each([false, true])("separates automatic pricing, Type 1 and Type 2 without writing state, agent %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const before = useAppStore.getState();
    const html = queue();
    const table = html.match(/<table[^>]*data-type2-worklist[\s\S]*?<\/table>/)?.[0];
    expect(table).toBeTruthy();
    expect(table).not.toContain("EX-24107");
    expect(table).not.toContain("EX-24101");
    expect(table).not.toContain("EX-24123");
    expect(table).toContain("EX-24112");
    expect(table).toContain("EX-24119");
    expect(html).toContain('data-type1-case="EX-24123"');
    expect(html).toContain("priced automatically this month, no person involved");
    expect(html).toContain("Shared monthly model, not session completions");
    expect(useAppStore.getState()).toBe(before);
  });

  it("uses shared monthly inputs, never the legacy referral-only projection", () => {
    const store = useAppStore.getState();
    store.setProcessInput("monthlyItems", "120000000");
    const model = monthModel({ ...PROCESS_MONTH_DEFAULTS, monthlyItems: 120_000_000 });
    expect(queue()).toContain(`${formatBaselineNumber(model.counts.autoPricedItems)} priced automatically`);
    expect(queue()).not.toContain("Show legacy full-day simulation");
  });

  it("excludes a newly auto-routed revision rather than retaining a stale staff row", () => {
    const store = useAppStore.getState();
    store.submitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO initialled AB dated 12/08/2026" });
    expect(useAppStore.getState().itemProcesses["EX-24112"].routing.outcome).toBe("auto_priced");
    expect(queue()).not.toContain('data-case-id="EX-24112"');
  });

  it("withholds stale routing with an explicit error", () => {
    const store = useAppStore.getState();
    useAppStore.setState({ itemProcesses: { ...store.itemProcesses,
      "EX-24112": { ...store.itemProcesses["EX-24112"], revision: -1 } } });
    expect(queue()).toContain("Some items lack current routing metadata");
    expect(queue()).not.toContain('data-case-id="EX-24112"');
  });

  it.each([false, true])("retains F's original reason and cited history in mode %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const before = useAppStore.getState();
    const original = before.records.find((entry) => entry.caseId === "EX-24088")!;
    const html = record("EX-24088");
    expect(html).toContain("Original decision history");
    expect(html).toContain(original.tariffVersion);
    expect(html).toContain(original.reason || original.overrideReason || "Not recorded");
    if (!enabled) expect(html).toContain("experience only, no rule recorded");
    expect(useAppStore.getState()).toBe(before);
  });
});
