import { create } from "zustand";
import { PHARMACY_ASSUMPTION_DEFAULTS, validPharmacyDays, type PharmacyAssumptions } from "./domain/baseline";
import { immutableReceipt, type PharmacyReceipt } from "./domain/pharmacy-timeline";
import { useAppStore } from "./store";

interface PharmacyState {
  assumptions: PharmacyAssumptions;
  receipts: readonly PharmacyReceipt[];
  setAssumption: (key: keyof PharmacyAssumptions, raw: string) => boolean;
  submit: (input: Omit<PharmacyReceipt, "id">) => PharmacyReceipt;
  reset: () => void;
}

/** Receipt/timeline compatibility adapter. Lifecycle revisions are authoritative. */
export const usePharmacyStore = create<PharmacyState>((set, get) => ({
  assumptions: { ...PHARMACY_ASSUMPTION_DEFAULTS },
  receipts: [],
  setAssumption: (key, raw) => {
    const value = validPharmacyDays(raw);
    if (value === null) return false;
    set((state) => ({ assumptions: { ...state.assumptions, [key]: value } }));
    return true;
  },
  submit: (input) => {
    const receipt = immutableReceipt({ ...input, id: `PH-${String(get().receipts.length + 1).padStart(4, "0")}` });
    useAppStore.getState().submitFromPharmacy(input.caseId, input.precheck.typedText, input.precheck);
    set((state) => ({ receipts: Object.freeze([...state.receipts, receipt]) }));
    return receipt;
  },
  reset: () => set({ assumptions: { ...PHARMACY_ASSUMPTION_DEFAULTS }, receipts: [] }),
}));

// Existing reset replaces these three slices atomically; edits/decisions do not.
// This adapter avoids modifying Stream B's frozen store or Stream D's header.
useAppStore.subscribe((state, previous) => {
  if (state.records !== previous.records && state.caseStates !== previous.caseStates && state.baselineInputs !== previous.baselineInputs) usePharmacyStore.getState().reset();
});