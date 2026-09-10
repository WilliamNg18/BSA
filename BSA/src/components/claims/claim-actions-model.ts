import type { LifecycleState } from "@/lib/domain/lifecycle";

export type ClaimActionKey = "confirm" | "resubmit";

export interface ClaimActionDef {
  key: ClaimActionKey;
  label: string;
  help: string;
  placeholder: string;
}

/**
 * Actions a pharmacy may take from the claims view, by lifecycle state.
 * These never change a lifecycle state themselves; they only record a local,
 * synthetic note against the claim's history until Stream B's store methods
 * exist. No state is reachable here without an action definition below.
 */
const ACTIONS_BY_STATE: Partial<Record<LifecycleState, ClaimActionDef[]>> = {
  information_requested: [
    {
      key: "confirm",
      label: "Send confirmation",
      help: "Confirm the fact NHSBSA asked about.",
      placeholder: "State the fact being confirmed.",
    },
  ],
  referred_back: [
    {
      key: "resubmit",
      label: "Resubmit with correction",
      help: "Send the corrected endorsement back for a re-check.",
      placeholder: "Enter the corrected endorsement.",
    },
  ],
};

export function actionsForState(state: LifecycleState): ClaimActionDef[] {
  return ACTIONS_BY_STATE[state] ?? [];
}
