import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startSceneCountIn } from "../../src/components/demo/scene-count-in";
import { ASSISTANCE_DURATION_MS } from "../../src/hooks/use-assistance-presentation";
import { BASELINE_DEFAULTS, calculateBaseline, formatBaselineNumber } from "../../src/lib/domain/baseline";
import { useAppStore } from "../../src/lib/store";

let frames: Map<number, FrameRequestCallback>;
let listeners: Set<() => void>;
let reduced: boolean;
let nextId: number;

beforeEach(() => {
  frames = new Map();
  listeners = new Set();
  reduced = false;
  nextId = 0;
  vi.spyOn(performance, "now").mockReturnValue(100);
  vi.stubGlobal("window", {
    matchMedia: () => ({
      get matches() { return reduced; },
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    }),
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++nextId, callback);
      return nextId;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function advance(elapsed: number) {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(100 + elapsed));
}

describe("scene estimate count-in", () => {
  const result = calculateBaseline(BASELINE_DEFAULTS);
  for (const [name, value, digits] of [
    ["volume", result.volume, 0],
    ["today gathering", result.today.gatheringMinutes / 60, 1],
    ["judging", result.today.judgingMinutes / 60, 1],
    ["assisted gathering", result.withAgent.gatheringMinutes / 60, 1],
    ["assumed referrals", result.referrals.withAgent, 0],
  ] as const) {
    it(`${name}: shows an intermediate then the exact UK-formatted derived final value`, () => {
      const display = vi.fn();
      startSceneCountIn(value, display);
      expect(display).toHaveBeenLastCalledWith(0);
      advance(ASSISTANCE_DURATION_MS / 2);
      expect(display).toHaveBeenLastCalledWith(value / 2);
      expect(display.mock.lastCall?.[0]).toBeGreaterThan(0);
      expect(display.mock.lastCall?.[0]).toBeLessThan(value);
      advance(ASSISTANCE_DURATION_MS);
      expect(display).toHaveBeenLastCalledWith(value);
      expect(formatBaselineNumber(display.mock.lastCall?.[0], digits)).toBe(formatBaselineNumber(value, digits));
      expect(frames.size).toBe(0);
      expect(listeners.size).toBe(0);
    });
  }

  it("reduced motion shows only the final value and schedules no work", () => {
    reduced = true;
    const display = vi.fn();
    startSceneCountIn(85000, display)();
    expect(display.mock.calls).toEqual([[85000]]);
    expect(frames.size).toBe(0);
    expect(listeners.size).toBe(0);
  });

  it("live reduced motion settles immediately and cancels outstanding frames", () => {
    const display = vi.fn();
    startSceneCountIn(85000, display);
    advance(500);
    reduced = true;
    listeners.forEach((listener) => listener());
    expect(display).toHaveBeenLastCalledWith(85000);
    expect(frames.size).toBe(0);
    expect(listeners.size).toBe(0);
  });

  it("a frame observes reduced motion even before its change event arrives", () => {
    const display = vi.fn();
    startSceneCountIn(85000, display);
    reduced = true;
    advance(16);
    expect(display.mock.calls).toEqual([[0], [85000]]);
    expect(frames.size).toBe(0);
  });

  it("cleanup cancels stale callbacks, including callbacks already queued for delivery", () => {
    const display = vi.fn();
    const cancel = startSceneCountIn(85000, display);
    const pending = [...frames.values()];
    cancel();
    cancel();
    pending.forEach((callback) => callback(1100));
    expect(display.mock.calls).toEqual([[0]]);
    expect(frames.size).toBe(0);
    expect(listeners.size).toBe(0);
  });

  it("input replacement cancels the old target before a new count-in", () => {
    const display = vi.fn();
    const cancel = startSceneCountIn(85000, display);
    advance(500);
    cancel();
    startSceneCountIn(120, display);
    advance(1000);
    expect(display).toHaveBeenLastCalledWith(60);
    advance(2000);
    expect(display).toHaveBeenLastCalledWith(120);
    expect(frames.size).toBe(0);
  });

  it("zero is immediate and delayed frames settle exactly without overshooting", () => {
    const zero = vi.fn();
    startSceneCountIn(0, zero);
    expect(zero.mock.calls).toEqual([[0]]);
    expect(frames.size).toBe(0);
    const display = vi.fn();
    startSceneCountIn(1_000_000_000, display);
    advance(60000);
    expect(display).toHaveBeenLastCalledWith(1_000_000_000);
    expect(frames.size).toBe(0);
  });

  it("presentation never changes shared inputs, lifecycle or decision state", () => {
    const before = useAppStore.getState();
    startSceneCountIn(result.volume, () => {});
    advance(ASSISTANCE_DURATION_MS);
    expect(useAppStore.getState()).toBe(before);
  });
});
