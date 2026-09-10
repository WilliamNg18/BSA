import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatBaselineNumber } from "@/lib/domain/baseline";

/** Final value remains available to assistive technology throughout the crossfade. */
export function AnimatedNumber({ value, digits = 1 }: { value: number; digits?: number }) {
  const reduced = useReducedMotion();
  const text = formatBaselineNumber(value, digits);
  return <motion.span className="tabular-nums" key={text} initial={{ opacity: reduced ? 1 : 0.35 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.3 }}>{text}</motion.span>;
}