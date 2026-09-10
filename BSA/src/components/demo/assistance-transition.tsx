import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAppStore } from "@/lib/store";

/** One presentation clock for every surface. Never writes domain state. */
export function AssistanceTransition({ children }: { children: ReactNode }) {
  const enabled = useAppStore((s) => s.agentEnabled);
  const reduced = useReducedMotion();
  const [settled, setSettled] = useState(enabled);
  const preparing = !reduced && settled !== enabled;
  useEffect(() => {
    if (reduced) {
      setSettled(enabled);
      return;
    }
    if (settled === enabled) return;
    const timer = window.setTimeout(() => setSettled(enabled), 2000);
    return () => window.clearTimeout(timer);
  }, [enabled, reduced, settled]);
  return <div data-assistance-host data-phase={preparing ? "preparing" : enabled ? "assisted" : "manual"}>
    <div className="mx-auto max-w-7xl px-4 pt-2 text-xs text-muted-foreground" role="status" aria-live="polite" aria-atomic="true">
      {preparing ? "Preparing assistance" : enabled ? "Assistance On" : "Assistance Off"} · Simulated presentation, not a model call
    </div>
    <motion.div animate={{ opacity: preparing ? 0.75 : 1 }} transition={{ duration: reduced ? 0 : 0.2 }}>{children}</motion.div>
  </div>;
}