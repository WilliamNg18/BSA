import { useState } from "react";
import { useLifecycleCase } from "./use-lifecycle-case";
import { useAppStore } from "@/lib/store";
import { initialisePharmacyDraft, checkPharmacyCorrection, suggestedPharmacyCorrection } from "@/lib/domain/pharmacy-correction";
import type { PharmacyCorrectionDraft } from "@/lib/domain/lifecycle";
import type { PharmacyCheck } from "@/lib/domain/pharmacy-check";
import type { ItemChannel } from "@/lib/domain/types";

export function usePharmacyDraft(caseId: string, channel?: ItemChannel) {
  const c = useLifecycleCase(caseId);
  const revision = useAppStore((s) => s.caseRevisions[caseId]?.at(-1));
  const saved = useAppStore((s) => s.pharmacyDrafts[caseId]);
  const enabled = useAppStore((s) => s.agentEnabled);
  const [error, setError] = useState("");
  const original = c && revision ? initialisePharmacyDraft(c, revision, channel) : null;
  const draft = original && saved?.revision === revision?.number && (!channel || saved.channel === channel) ? saved : original;
  let result: PharmacyCheck | null = null;
  let validationError = "";
  let canApply = false;
  let suggestionError = "";
  if (enabled && c && revision && draft) {
    try { result = checkPharmacyCorrection(c, revision, draft); }
    catch (cause) { validationError = cause instanceof Error ? cause.message : "Draft cannot be checked."; }
    try { suggestedPharmacyCorrection(c, revision, draft); canApply = true; }
    catch (cause) { suggestionError = cause instanceof Error ? cause.message : "No supported correction. Enter the required facts."; }
  }
  function act(action: () => void) {
    try { action(); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Action unavailable. Review this item."); }
  }
  function update(next: PharmacyCorrectionDraft) {
    act(() => useAppStore.getState().setPharmacyDraft(caseId, next));
  }
  return { c, revision, draft, original, enabled, result, canApply, suggestionError, validationError, error, act, update };
}
