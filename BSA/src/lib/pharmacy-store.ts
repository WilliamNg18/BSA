import { PHARMACY_ASSUMPTION_DEFAULTS, validPharmacyDays, type PharmacyAssumptions } from "./domain/baseline";
import { immutableReceipt, type PharmacyReceipt } from "./domain/pharmacy-timeline";
import { useAppStore } from "./store";

export interface PharmacyState {
  assumptions: PharmacyAssumptions;
  receipts: readonly PharmacyReceipt[];
  setAssumption: (key: keyof PharmacyAssumptions, raw: string) => boolean;
  submit: (input: Omit<PharmacyReceipt, "id">) => PharmacyReceipt;
  reset: () => void;
}

/** Receipt/timeline compatibility adapter. Lifecycle revisions are authoritative. */
export function createPharmacyState(set: (update: Partial<PharmacyState> | ((state: PharmacyState) => Partial<PharmacyState>)) => void, get: () => PharmacyState): PharmacyState { return {
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
}; }

/** Legacy selector API over the one application store, not another Zustand store. */
export function usePharmacyStore<T>(selector: (state: PharmacyState) => T): T {
  return useAppStore((state) => selector(state.pharmacy));
}
usePharmacyStore.getState = (): PharmacyState => useAppStore.getState().pharmacy;