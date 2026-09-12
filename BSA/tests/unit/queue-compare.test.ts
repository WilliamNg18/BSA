import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueueCompare, QueueComparison } from "../../src/components/demo/queue-compare";
import { BASELINE_DEFAULTS, calculateBaseline, formatBaselineNumber as n } from "../../src/lib/domain/baseline";
import { dayClock, projectQueueDay } from "../../src/lib/domain/queue-model";
import { CASES } from "../../src/lib/domain/cases";
import { useAppStore } from "../../src/lib/store";
import { useQueueStore } from "../../src/lib/queue-store";

afterEach(() => useAppStore.getState().resetDemo());

describe("queue Compare presentation", () => {
  it.each([0, 15, 270, 540])("renders the current scenario and shared time %s without extra arithmetic", (day) => {
    const input = { ...BASELINE_DEFAULTS, volume: 1234, judgingMinutes: 3, builtReviewMinutes: 0.75 };
    const result = calculateBaseline(input), projected = projectQueueDay(input, day);
    const html = renderToStaticMarkup(createElement(QueueComparison, { input, result, day }));
    expect(html).toContain(dayClock(day));
    expect(html).toContain("1,234 items; pinned examples add no volume.");
    for (const [today, assisted] of [
      [projected.today.processed, projected.assisted.processed],
      [projected.today.gathering, projected.assisted.gathering],
      [projected.today.judging, projected.assisted.judging],
    ]) expect(html).toContain(`>${n(today)}</td><td class="p-2 tabular-nums">${n(assisted)}</td>`);
    expect(html).toContain(`${n(result.built)} built + ${n(result.abstained)} abstained`);
    expect(html).toContain("no additional savings");
    expect(html).toContain("Compare changes no state");
  });

  it.each([0, 1, 5, 1e9])("keeps source volume %s honest, including tiny and empty cohorts", (volume) => {
    const input = { ...BASELINE_DEFAULTS, volume }, result = calculateBaseline(input);
    const html = renderToStaticMarkup(createElement(QueueComparison, { input, result, day: 540 }));
    expect(html).toContain(`${n(volume)} items; pinned examples add no volume.`);
    expect(html).not.toMatch(/NaN|Infinity/);
    expect(html).toContain("handled manually");
  });

  it.each([false, true])("is initially closed and causes no store, fixture or decision writes with Agent %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    useQueueStore.getState().setDay(270);
    const app = useAppStore.getState(), queue = useQueueStore.getState(), fixtures = structuredClone(CASES);
    const appWrites = vi.fn(), queueWrites = vi.fn();
    const unsubscribeApp = useAppStore.subscribe(appWrites), unsubscribeQueue = useQueueStore.subscribe(queueWrites);
    try {
      const props = { input: BASELINE_DEFAULTS, result: calculateBaseline(BASELINE_DEFAULTS) };
      const control = renderToStaticMarkup(createElement(QueueCompare, props));
      expect(control).toContain('aria-expanded="false"');
      expect(control).toContain(">Compare</button>");
      expect(control).not.toContain("Assumed day projections");
      renderToStaticMarkup(createElement(QueueComparison, { ...props, day: queue.day }));
      expect(appWrites).not.toHaveBeenCalled();
      expect(queueWrites).not.toHaveBeenCalled();
      expect(useAppStore.getState()).toBe(app);
      expect(useQueueStore.getState()).toBe(queue);
      expect(CASES).toEqual(fixtures);
    } finally {
      unsubscribeApp(); unsubscribeQueue();
    }
  });
});
