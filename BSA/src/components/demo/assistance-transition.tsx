import { useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ASSISTANCE_DURATION_MS, ASSISTANCE_PHASES, AssistancePresentationContext } from "@/hooks/use-assistance-presentation";
import { useAppStore } from "@/lib/store";

/** One presentation clock for every surface. Never writes domain state. */
export function AssistanceTransition({ children }: { children: ReactNode }) {
  const enabled = useAppStore((s) => s.agentEnabled);
  const reduced = useReducedMotion();
  const [settled, setSettled] = useState(enabled);
  const [phase, setPhase] = useState(0);
  const preparing = !reduced && settled !== enabled;
  useEffect(() => {
    if (reduced) {
      setSettled(enabled);
      return;
    }
    if (settled === enabled) return;
    setPhase(0);
    const timers = ASSISTANCE_PHASES.map((_, index) => window.setTimeout(() => {
      setPhase(index + 1);
      if (index === ASSISTANCE_PHASES.length - 1) setSettled(enabled);
    }, ASSISTANCE_DURATION_MS * (index + 1) / ASSISTANCE_PHASES.length));
    return () => timers.forEach(window.clearTimeout);
  }, [enabled, reduced, settled]);
  return <AssistancePresentationContext value={{ preparing, phase: preparing ? phase : ASSISTANCE_PHASES.length }}><div data-assistance-host data-phase={preparing ? "preparing" : enabled ? "assisted" : "manual"}>
    <div className="mx-auto max-w-7xl px-4 pt-2 text-xs text-muted-foreground" role="status" aria-live="polite" aria-atomic="true">
      {preparing ? "Preparing assistance" : enabled ? "Assistance On" : "Assistance Off"} · Simulated presentation, not a model call
    </div>
    <div>{children}</div>
  </div></AssistancePresentationContext>;
}