import { performance } from "node:perf_hooks";

export class TransitionDeadline {
  private readonly startedAt: number;
  constructor(private readonly now: () => number = () => performance.now()) {
    this.startedAt = now();
  }
  elapsedMs() {
    return this.now() - this.startedAt;
  }
  remainingMs() {
    const remaining = 1000 - this.elapsedMs();
    if (remaining <= 0) throw new Error("The actual cross-side transition exceeded its one-second deadline.");
    return remaining;
  }
  finish() {
    const elapsedMs = this.elapsedMs();
    if (elapsedMs > 1000) throw new Error(`The actual cross-side transition took ${elapsedMs.toFixed(2)} ms; maximum 1000 ms.`);
    return elapsedMs;
  }
}
