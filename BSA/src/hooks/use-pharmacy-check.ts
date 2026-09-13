import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { PharmacyCheckRunner, type PharmacyCheckOptions, type checkPharmacy } from "@/lib/domain/pharmacy-check";
import type { ExceptionCase } from "@/lib/domain/types";
import { useReducedMotion } from "./use-reduced-motion";

export function usePharmacyCheck(c: ExceptionCase, text: string, enabled: boolean, options?: PharmacyCheckOptions, evaluate?: typeof checkPharmacy) {
  const reduced = useReducedMotion();
  const [runner] = useState(() => new PharmacyCheckRunner());
  const current = useSyncExternalStore(runner.subscribe, runner.getSnapshot, runner.getSnapshot);
  const optionsKey = JSON.stringify(options ?? {});
  const stableOptions = useMemo<PharmacyCheckOptions>(() => JSON.parse(optionsKey), [optionsKey]);
  const key = JSON.stringify([c, text, enabled, reduced, optionsKey]);
  useEffect(() => {
    runner.start(key, c, text, enabled, reduced, stableOptions, evaluate);
    return runner.cancel;
  }, [runner, key, c, text, enabled, reduced, stableOptions, evaluate]);
  // Never expose a previous revision, even in the render before effect cleanup.
  return current.key === key && enabled ? current : { key, phase: 0, result: null, checkedAt: null };
}