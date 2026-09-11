import { formatBaselineNumber } from "@/lib/domain/baseline";

/** Final value remains available to assistive technology throughout the crossfade. */
export function AnimatedNumber({ value, digits = 1 }: { value: number; digits?: number }) {
  const text = formatBaselineNumber(value, digits);
  return <span className="tabular-nums motion-safe:animate-in motion-safe:fade-in-35 motion-safe:duration-300" key={text}>{text}</span>;
}