import { create } from "zustand";
import { clampDay, SWEEP_PHASES, type QueueCohort } from "./domain/queue-model";
import { useAppStore } from "./store";

export interface SweepItem { key: string; kind: QueueCohort | "recorded" }
interface QueueState {
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
const initial = { position: 0, day: 0, playing: false, sweep: [] as readonly SweepItem[], phase: -1, sweeping: false };

/** Bounded presentation memory only. No records, lifecycle calls or browser persistence. */
export const useQueueStore = create<QueueState>((set) => ({
  ...initial, revision: 0,
  jump: (position) => set({ position: Number.isFinite(position) ? Math.max(0, Math.min(1e9 - 1, Math.floor(position))) : 0 }),
  setDay: (minutes) => set({ day: clampDay(minutes), playing: false }),
  play: (playing) => set((s) => ({ playing: playing && s.day < 540 })),
  tickDay: () => set((s) => s.playing ? { day: clampDay(s.day + 15), playing: s.day + 15 < 540 } : {}),
  startSweep: (items) => set({ sweep: items.slice(0, 32).map((item) => ({ ...item })), phase: items.length ? 0 : -1, sweeping: items.length > 0 }),
  stepSweep: () => set((s) => s.sweeping ? { phase: Math.min(SWEEP_PHASES.length - 1, s.phase + 1), sweeping: s.phase + 1 < SWEEP_PHASES.length - 1 } : {}),
  cancel: () => set({ sweep: [], phase: -1, sweeping: false, playing: false }),
  reset: () => set((s) => ({ ...initial, revision: s.revision + 1 })),
}));

// Same three-slice reset adapter as pharmacy. Frozen store/header stay untouched.
useAppStore.subscribe((state, previous) => {
  if (state.records !== previous.records && state.caseStates !== previous.caseStates && state.baselineInputs !== previous.baselineInputs) {
    useQueueStore.getState().reset();
  } else if (state.baselineInputs !== previous.baselineInputs || state.todayMinutes !== previous.todayMinutes) {
    useQueueStore.getState().reset();
  } else if (state.agentEnabled !== previous.agentEnabled) {
    useQueueStore.getState().cancel();
  }
});