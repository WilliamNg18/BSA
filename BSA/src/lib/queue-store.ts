import { clampDay, SWEEP_PHASES, type QueueCohort } from "./domain/queue-model";
import { useAppStore } from "./store";

export interface SweepItem { key: string; kind: QueueCohort | "recorded" }
export interface QueueState {
  position: number;
  day: number;
  playing: boolean;
  sweep: readonly SweepItem[];
  phase: number;
  sweeping: boolean;
  revision: number;
  jump: (position: number) => void;
  setDay: (minutes: number) => void;
  play: (playing: boolean) => void;
  tickDay: () => void;
  startSweep: (items: readonly SweepItem[]) => void;
  stepSweep: () => void;
  cancel: () => void;
  reset: () => void;
}

/** Bounded presentation memory only. No records, lifecycle calls or browser persistence. */
export function createQueueState(set: (update: Partial<QueueState> | ((state: QueueState) => Partial<QueueState>)) => void): QueueState {
const initial = { position: 0, day: 0, playing: false, sweep: [] as readonly SweepItem[], phase: -1, sweeping: false };
return {
  ...initial, revision: 0,
  jump: (position) => set({ position: Number.isFinite(position) ? Math.max(0, Math.min(1e9 - 1, Math.floor(position))) : 0 }),
  setDay: (minutes) => set({ day: clampDay(minutes), playing: false }),
  play: (playing) => set((s) => ({ playing: playing && s.day < 540 })),
  tickDay: () => set((s) => s.playing ? { day: clampDay(s.day + 15), playing: s.day + 15 < 540 } : {}),
  startSweep: (items) => set({ sweep: items.slice(0, 32).map((item) => ({ ...item })), phase: items.length ? 0 : -1, sweeping: items.length > 0 }),
  stepSweep: () => set((s) => s.sweeping ? { phase: Math.min(SWEEP_PHASES.length - 1, s.phase + 1), sweeping: s.phase + 1 < SWEEP_PHASES.length - 1 } : {}),
  cancel: () => set({ sweep: [], phase: -1, sweeping: false, playing: false }),
  reset: () => set((s) => ({ ...initial, revision: s.revision + 1 })),
}; }

/** Playback is presentation state inside the same application store. */
export function useQueueStore<T>(selector: (state: QueueState) => T): T {
  return useAppStore((state) => selector(state.queue));
}
useQueueStore.getState = (): QueueState => useAppStore.getState().queue;