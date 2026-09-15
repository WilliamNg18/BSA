import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAppStore } from "@/lib/store";

export function HeaderOutcome() {
  const enabled = useAppStore((state) => state.agentEnabled);
  const reduced = useReducedMotion();
  return <AnimatePresence initial={false}>
    {enabled && <motion.section
      key="agent-outcome"
      aria-label="Agent outcome"
      data-agent-outcome
      className="w-full bg-background px-6 py-2 text-center text-base"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.1 : 0.15 }}
    >
      <p className="inline-block whitespace-nowrap" data-outcome-text>Outcome: the agent gathers evidence and recommends. Deterministic code validates and calculates. A person decides.</p>
    </motion.section>}
  </AnimatePresence>;
}
