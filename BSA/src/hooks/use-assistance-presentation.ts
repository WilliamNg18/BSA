import { createContext, useContext } from "react";

export const ASSISTANCE_DURATION_MS = 2000;
export const ASSISTANCE_PHASES = ["Plan", "Gather evidence", "Retrieve rule", "Reconcile and assess", "Propose reason"] as const;
export const AssistancePresentationContext = createContext<{ preparing: boolean; phase: number }>({ preparing: false, phase: ASSISTANCE_PHASES.length });
export const useAssistancePresentation = () => useContext(AssistancePresentationContext);