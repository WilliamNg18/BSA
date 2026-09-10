import { create } from "zustand";

// Global client state shared across components/routes. ONE module-scoped store,
// no Provider needed — import `useAppStore` anywhere. Use `useState` for
// component-local state; let TanStack Query own server/connector data (don't
// mirror it here). NEVER use raw React Context for mutable shared state.
//
// Rules:
//   • Put actions INSIDE the store (set-based, immutable updates); components call them.
//   • Read with a NARROW selector — `useAppStore((s) => s.items)`, never
//     `useAppStore()` with no selector. Don't return a fresh object/array from a
//     selector (it re-renders on every change); group with `useShallow`:
//     `import { useShallow } from "zustand/react/shallow"`
//     `const { a, b } = useAppStore(useShallow((s) => ({ a: s.a, b: s.b })));`
//
// Example (replace `AppState` with the app's real state + actions):
//   interface AppState {
//     items: Item[];
//     addItem: (text: string) => void;
//     toggleItem: (id: string) => void;
//   }
//   export const useAppStore = create<AppState>((set) => ({
//     items: [],
//     addItem: (text) =>
//       set((s) => ({ items: [...s.items, { id: crypto.randomUUID(), text, done: false }] })),
//     toggleItem: (id) =>
//       set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),
//   }));
//
// In components:
//   const items = useAppStore((s) => s.items);      // read (targeted re-render)
//   const addItem = useAppStore((s) => s.addItem);  // action (stable reference)

import { CASES } from "@/lib/domain/cases";
import { baselineDraft, type BaselineDraft, type BaselineField } from "@/lib/domain/baseline";
import { BASELINE_DEFAULTS } from "@/lib/domain/baseline";
import type { CaseState, DecisionRecord, HumanDecision, Recommendation } from "@/lib/domain/types";

// Session state for the prototype. Everything is in memory: the preview runs in
// a sandboxed frame, so nothing is written to storage and Reset returns the
// demonstration to its starting point.

function seededRecords(): DecisionRecord[] {
  return [
    {
      id: "DR-000871",
      caseId: "EX-24088",
      timestamp: "2026-09-03T15:02:11",
      tariffVersion: "2026-08",
      agentVersion: "prototype-0.5 (interpretation step mocked; production: constrained Azure OpenAI call)",
      inputs: ["Extracted fields (product, quantity 28, endorsement \"NCSO  DL\")", "Claim: qty 28, £3.41, EPS claim message", "Image EX-24088.tif, endorsement region, read confidence 0.84"],
      sources: ["Existing capture", "Claim ledger", "Product master data", "Drug Tariff corpus 2026-08 (Part II, Clause 9)", "Case history FQ123"],
      checks: [
        { name: "Recommendation cites a validated provision", pass: true, detail: "Part II Clause 9, August 2026" },
        { name: "Mandatory fields present", pass: true, detail: "All mandatory fields read" },
        { name: "Agent has not priced or disposed", pass: true, detail: "Recommendation only" },
        { name: "At least one requirement is unmet", pass: true, detail: "Dated: not met" },
      ],
      recommendation: "REFER_BACK",
      decision: "REFER_BACK",
      isOverride: false,
      overrideReason: null,
      operator: "Operator P (synthetic)",
      synthetic: true,
    },
  ];
}

interface AppState {
  caseStates: Record<string, CaseState>;
  records: DecisionRecord[];
  agentEnabled: boolean;
  baselineInputs: BaselineDraft;
  setBaselineInput: (field: BaselineField, value: string) => void;
  recordDecision: (input: {
    caseId: string;
    tariffVersion: string;
    agentVersion: string;
    inputs: string[];
    sources: string[];
    checks: DecisionRecord["checks"];
    recommendation: Recommendation;
    decision: HumanDecision;
    overrideReason: string | null;
  }) => DecisionRecord;
  setAgentEnabled: (on: boolean) => void;
  resetDemo: () => void;
}

const initialStates = () =>
  Object.fromEntries(CASES.map((c) => [c.id, c.initialState])) as Record<string, CaseState>;

function decisionMatches(recommendation: Recommendation, decision: HumanDecision): boolean {
  if (recommendation === "SUFFICIENT") return decision === "ACCEPT";
  if (recommendation === "REFER_BACK") return decision === "REFER_BACK" || decision === "ACCEPT";
  if (recommendation === "REQUEST_INFORMATION") return decision === "REQUEST_INFORMATION" || decision === "ACCEPT";
  return false;
}

export const useAppStore = create<AppState>((set, get) => ({
  caseStates: initialStates(),
  records: seededRecords(),
  agentEnabled: true,
  baselineInputs: baselineDraft(BASELINE_DEFAULTS),
  setBaselineInput: (field, value) => set((s) => ({ baselineInputs: { ...s.baselineInputs, [field]: value } })),
  recordDecision: (input) => {
    const n = get().records.length + 872;
    const record: DecisionRecord = {
      id: `DR-${String(n).padStart(6, "0")}`,
      caseId: input.caseId,
      timestamp: new Date().toISOString().slice(0, 19),
      tariffVersion: input.tariffVersion,
      agentVersion: input.agentVersion,
      inputs: input.inputs,
      sources: input.sources,
      checks: input.checks,
      recommendation: input.recommendation,
      decision: input.decision,
      isOverride: !decisionMatches(input.recommendation, input.decision),
      overrideReason: input.overrideReason,
      operator: "Demo operator",
      synthetic: true,
    };
    set((s) => ({
      records: [...s.records, record],
      caseStates: { ...s.caseStates, [input.caseId]: "human_decision_recorded" },
    }));
    return record;
  },
  setAgentEnabled: (agentEnabled) => set({ agentEnabled }),
  resetDemo: () => set({ caseStates: initialStates(), records: seededRecords(), agentEnabled: true, baselineInputs: baselineDraft(BASELINE_DEFAULTS) }),
}));
