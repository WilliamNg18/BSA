import { useEffect, useState, useSyncExternalStore } from "react";
import { PharmacyCheckRunner } from "@/lib/domain/pharmacy-check";
import type { ExceptionCase } from "@/lib/domain/types";
import { useReducedMotion } from "./use-reduced-motion";

export function usePharmacyCheck(c: ExceptionCase, text: string, enabled: boolean) {
  const reduced = useReducedMotion();
  const [runner] = useState(() => new PharmacyCheckRunner());
  const current = useSyncExternalStore(runner.subscribe, runner.getSnapshot, runner.getSnapshot);
  const key = JSON.stringify([c.id, text, enabled, reduced]);
  useEffect(() => {
    runner.start(key, c, text, enabled, reduced);
    return runner.cancel;
  }, [runner, key, c, text, enabled, reduced]);
  // Never expose a previous revision, even in the render before effect cleanup.
  return current.key === key && enabled ? current : { key, phase: 0, result: null, checkedAt: null };
}