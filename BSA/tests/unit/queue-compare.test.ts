import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueueCompare, QueueComparison } from "../../src/components/demo/queue-compare";
import { MONTH_MODEL_DEFAULTS, monthModel } from "../../src/lib/domain/baseline";
import { projectQueueComparison, QUEUE_SEEDS, queueCitationAvailable, queueStatus, queueTableWindow, type QueuePreviewRow } from "../../src/lib/domain/queue-model";
import * as agent from "../../src/lib/domain/agent";
import { CASES } from "../../src/lib/domain/cases";
import { useAppStore } from "../../src/lib/store";
import { useQueueStore } from "../../src/lib/queue-store";
import { QueuePage } from "../../src/pages/queue";

afterEach(() => useAppStore.getState().resetDemo());
const result = monthModel(MONTH_MODEL_DEFAULTS);
const seeds = (enabled: boolean): QueuePreviewRow[] => QUEUE_SEEDS.map((seed) => ({
  id: seed.id, state: seed.state, pharmacy: "Synthetic pharmacy", reason: "Synthetic reason",
  status: queueStatus(seed.state, enabled), fresh: false, canonical: seed.canonical,
  reviewable: seed.canonical, pending: false, projected: false,
}));

describe("current queue comparison", () => {
  it("renders the whole queue with repository tooltip context in both modes", () => {
    for (const enabled of [false, true]) {
      useAppStore.getState().setAgentEnabled(enabled);
      const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(QueuePage)));
      expect(html).toContain("NHSBSA exception queue");
      expect(html).toContain("showing 1 to 50");
    }
  });
  it("uses the new total Today12 and judging2, not legacy7", () => {
    const cited = CASES.filter(queueCitationAvailable).map((item) => item.id);
    const today = projectQueueComparison(result, 60, false, [], cited);
    const assisted = projectQueueComparison(result, 60, true, [], CASES.slice(0, 3).map((c) => c.id));
    expect(today.rows[0]).toMatchObject({ gathering: 10, judging: 2, finish: 12 });
    expect(assisted.rows[0]).toMatchObject({ gathering: 0, judging: 2, finish: 2 });
    expect(today.decided).toBe(5);
    expect(assisted.decided).toBeGreaterThan(today.decided);
    expect(assisted.cited).toBe(3);
    expect(today.cited).toBe(3);
    expect(today.rows.some((row) => row.phase === "Operator gathering evidence")).toBe(true);
    expect(projectQueueComparison(result, 59, false).rows.some((row) => row.phase === "Operator judging evidence")).toBe(true);
    expect(projectQueueComparison(result, 30, false).rows.some((row) => row.phase === "Operator gathering evidence")).toBe(true);
  });
  it("projects equal citation eligibility only after complete manual or assisted work", () => {
    const engine = vi.spyOn(agent, "runAgent");
    try {
      const cited = CASES.filter(queueCitationAvailable).map((item) => item.id);
      expect(cited).toEqual(CASES.slice(0, 3).map((item) => item.id));
      expect(projectQueueComparison(result, 10, false, [], cited).cited).toBe(0);
      expect(projectQueueComparison(result, 12, false, [], cited).cited).toBe(1);
      expect(projectQueueComparison(result, 30, false, [], cited).cited).toBe(2);
      expect(projectQueueComparison(result, 30, true, [], cited).cited).toBe(3);
      expect(projectQueueComparison(result, 60, false, [], cited).cited).toBe(3);
      expect(projectQueueComparison(result, 60, true, [], cited).cited).toBe(3);
      const noVersion = { ...CASES[0], extracted: { ...CASES[0].extracted, dispensingDate: "1900-01-01" } };
      expect(queueCitationAvailable(noVersion)).toBe(false);
      expect(queueCitationAvailable({ ...CASES[0], readings: [] })).toBe(false);
      expect(engine).not.toHaveBeenCalled();
    } finally { engine.mockRestore(); }
  });
  it.each([0, 3, 60, 360])("is bounded, citation-safe and protects D/E/F at minute%s", (elapsed) => {
    for (const assisted of [false, true]) {
      const p = projectQueueComparison(result, elapsed, assisted, [], QUEUE_SEEDS.map((s) => s.id));
      expect(p.rows.map((s) => s.id)).toEqual(QUEUE_SEEDS.map((s) => s.id));
      expect(p.operatorMinutes).toBeLessThanOrEqual(elapsed);
      expect(p.rows[3]).toMatchObject({ gathering: 10, judging: 2, cited: false });
      expect(p.rows[4]).toMatchObject({ gathering: 0, judging: 0, done: false, cited: false });
      expect(p.rows[5]).toMatchObject({ gathering: 0, judging: 0, done: false, cited: false });
      expect(p.rows.slice(6).every((s) => !s.cited)).toBe(true);
    }
  });
  it("uses edited shared costs and excludes actual human records", () => {
    const changed = monthModel({ ...MONTH_MODEL_DEFAULTS, todayMinutes: 15, judgingMinutes: 3 });
    const p = projectQueueComparison(changed, 60, false, [CASES[1].id]);
    expect(p.rows[0]).toMatchObject({ gathering: 12, judging: 3 });
    expect(p.rows[1]).toMatchObject({ gathering: 0, judging: 0, done: false, phase: "Historical record unchanged" });
  });
  it.each([false, true])("renders without any application or queue writes, mode%s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const app = useAppStore.getState(), queue = useQueueStore.getState(), fixture = structuredClone(CASES);
    const writes = vi.fn(), stop = useAppStore.subscribe(writes);
    try {
      expect(renderToStaticMarkup(createElement(QueueCompare, { result }))).toContain('aria-expanded="false"');
      const html = renderToStaticMarkup(createElement(QueueComparison, { result, elapsed: 60 }));
      expect(html).toContain("Projected items decided");
      expect(html).toContain("Projected decisions with rule cited");
      expect(writes).not.toHaveBeenCalled();
      expect(useAppStore.getState()).toBe(app);
      expect(useQueueStore.getState()).toBe(queue);
      expect(CASES).toEqual(fixture);
    } finally { stop(); }
  });
});

describe("counted logical table windows", () => {
  it.each([0, 1, 12, 13, 85_000, 1e9])("bounds rendered rows with honest counters and filters for volume%s", (volume) => {
    const model = monthModel({ ...MONTH_MODEL_DEFAULTS, volume });
    for (const enabled of [false, true]) {
      const rows = seeds(enabled);
      const first = queueTableWindow(model, rows, enabled, "all", 0);
      expect(first.rows.slice(0, 12).map((row) => row.id)).toEqual(QUEUE_SEEDS.map((s) => s.id));
      expect(first.total).toBe(Math.max(12, model.volume - model.pharmacyCaught));
      expect(Object.values(first.counts).reduce((sum, count) => sum + count, 0)).toBe(first.total);
      for (const status of ["all", ...Object.keys(first.counts)] as Parameters<typeof queueTableWindow>[3][]) {
        const window = queueTableWindow(model, rows, enabled, status, 0);
        if (status !== "all") expect(window.total).toBe(first.counts[status]);
        for (const position of [0, 49, 50, 999, 1e9]) {
          const page = queueTableWindow(model, rows, enabled, status, position);
          expect(page.rows.length).toBe(page.end - page.start);
          expect(page.rows.length).toBeLessThanOrEqual(50);
          expect(page.rows.every((row) => status === "all" || row.status === status)).toBe(true);
          expect(new Set(page.rows.map((row) => row.id)).size).toBe(page.rows.length);
        }
      }
    }
  });
  it("new submissions stay first, counted and not falsely built", () => {
    const lifecycle = useAppStore.getState().lifecycles[CASES[1].id];
    const pending = { ...lifecycle, state: "submitted" as const };
    expect(queueStatus("operator_review_required", true, pending)).toBe("evidence");
    expect(queueStatus("operator_review_required", false, pending)).toBe("awaiting");
    const list = seeds(true);
    const fresh = { ...list[1], id: "SYN-NEW", fresh: true, pending: true, status: "evidence" as const };
    const page = queueTableWindow(result, [fresh, ...list], true, "evidence", 0);
    expect(page.rows[0]).toBe(fresh);
    expect(page.counts.evidence).toBe(list.filter((row) => row.status === "evidence").length + 1);
  });
  it("Today edits clear projection state just like other assumptions", () => {
    useQueueStore.getState().jump(1000);
    const revision = useQueueStore.getState().revision;
    useAppStore.getState().setTodayMinutes("15");
    expect(useQueueStore.getState()).toMatchObject({ position: 0, revision: revision + 1 });
  });
});
