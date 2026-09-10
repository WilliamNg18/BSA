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

import { CASES, caseById } from "@/lib/domain/cases";
import { baselineDraft, type BaselineDraft, type BaselineField } from "@/lib/domain/baseline";
import { BASELINE_DEFAULTS } from "@/lib/domain/baseline";
import type { CaseState, DecisionRecord, HumanDecision, Recommendation } from "@/lib/domain/types";
import type { Actor, CaseLifecycle, HistoryEvent, LifecycleSlice, LifecycleState, PharmacyPrecheckSnapshot } from "@/lib/domain/lifecycle";
import { seededLifecycles } from "@/lib/domain/lifecycle-seed";

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

interface AppState extends LifecycleSlice {
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

// Shared case lifecycle. Transitions are validated deterministic code; only a
// pharmacy, an operator or code changes a state. The agent never does, and paid
// is a synthetic state attributed to existing pricing, not a payment approval.

const ALLOWED_TRANSITIONS: Record<LifecycleState, readonly LifecycleState[]> = {
  submitted: ["in_review"],
  in_review: ["information_requested", "referred_back", "paid", "escalated"],
  information_requested: ["resubmitted"],
  referred_back: ["resubmitted"],
  resubmitted: ["in_review"],
  paid: [],
  escalated: ["information_requested", "referred_back", "paid"],
};

const DECISION_TARGETS: Record<HumanDecision, LifecycleState> = {
  ACCEPT: "paid",
  AMEND: "paid",
  REQUEST_INFORMATION: "information_requested",
  REFER_BACK: "referred_back",
  ESCALATE: "escalated",
};

/** Minimum reason length, matching the recorded-decision rule. */
const MIN_REASON = 8;

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Immutable copy so a caller cannot change a stored snapshot after the event. */
function copyPrecheck(precheck: PharmacyPrecheckSnapshot | undefined): PharmacyPrecheckSnapshot | null {
  if (!precheck) return null;
  return Object.freeze({
    ...precheck,
    facts: precheck.facts ? Object.freeze({ ...precheck.facts }) : null,
    checks: Object.freeze(precheck.checks.map((check) => Object.freeze({ ...check }))),
  });
}

function appendEvent(lifecycle: CaseLifecycle, event: HistoryEvent): CaseLifecycle {
  return Object.freeze({
    ...lifecycle,
    state: event.to,
    history: Object.freeze([...lifecycle.history, Object.freeze(event)]) as HistoryEvent[],
  });
}

interface TransitionInput {
  caseId: string;
  from: readonly LifecycleState[];
  to: LifecycleState;
  actor: Actor;
  message: string;
  precheck?: PharmacyPrecheckSnapshot;
  exactFix?: string;
}

function lifecycleEvent(
  from: LifecycleState | null,
  to: LifecycleState,
  actor: Actor,
  message: string,
  snapshot: PharmacyPrecheckSnapshot | null,
  exactFix?: string,
): HistoryEvent {
  return {
    at: new Date().toISOString(),
    actor,
    from,
    to,
    message,
    ...(snapshot?.clauseId ? { clauseId: snapshot.clauseId } : {}),
    ...(snapshot?.tariffVersion ? { tariffVersion: snapshot.tariffVersion } : {}),
    ...(exactFix ? { exactFix } : {}),
  };
}

export const useAppStore = create<AppState>((set, get) => {
  /** Applies a validated transition, or rejects it and leaves history untouched. */
  const transition = (input: TransitionInput): void => {
    const current = get().lifecycles[input.caseId];
    if (!current) return;
    if (!input.from.includes(current.state)) return;
    if (!ALLOWED_TRANSITIONS[current.state].includes(input.to)) return;
    const event = lifecycleEvent(current.state, input.to, input.actor, input.message, copyPrecheck(input.precheck), input.exactFix);
    set((s) => ({ lifecycles: { ...s.lifecycles, [input.caseId]: appendEvent(current, event) } }));
  };

  return {
  lifecycles: seededLifecycles(),
  followedCaseId: null,
  submitFromPharmacy: (caseId, endorsementText, precheck) => {
    const id = cleanText(caseId);
    const text = cleanText(endorsementText);
    if (!id || !text) return;
    if (get().lifecycles[id]) return;
    const pharmacyCode = caseById(id)?.pharmacy.contractorCode;
    if (!pharmacyCode) return;
    const event = lifecycleEvent(null, "submitted", "pharmacy", `Claim submitted with endorsement ${text}`, copyPrecheck(precheck));
    const lifecycle: CaseLifecycle = Object.freeze({
      caseId: id,
      pharmacyCode,
      state: "submitted",
      history: Object.freeze([Object.freeze(event)]) as HistoryEvent[],
    });
    set((s) => ({ lifecycles: { ...s.lifecycles, [id]: lifecycle } }));
  },
  arriveInQueue: (caseId) => {
    const id = cleanText(caseId);
    if (!id) return;
    transition({ caseId: id, from: ["submitted", "resubmitted"], to: "in_review", actor: "code", message: "Routed to the exception queue for operator review." });
  },
  recordOperatorDecision: (caseId, decision, reason, draft) => {
    const id = cleanText(caseId);
    const why = cleanText(reason);
    const to = DECISION_TARGETS[decision];
    if (!id || !to || !why || why.length < MIN_REASON) return;
    transition({
      caseId: id,
      from: ["in_review", "escalated"],
      to,
      actor: "operator",
      message: `Operator recorded ${decision}: ${why}`,
      exactFix: cleanText(draft) ?? undefined,
    });
  },
  resubmitFromPharmacy: (caseId, endorsementText, precheck) => {
    const id = cleanText(caseId);
    const text = cleanText(endorsementText);
    if (!id || !text) return;
    transition({ caseId: id, from: ["referred_back"], to: "resubmitted", actor: "pharmacy", message: `Corrected and resubmitted with endorsement ${text}`, precheck });
  },
  sendConfirmation: (caseId, text) => {
    const id = cleanText(caseId);
    const confirmation = cleanText(text);
    if (!id || !confirmation) return;
    transition({ caseId: id, from: ["information_requested"], to: "resubmitted", actor: "pharmacy", message: `Confirmation sent: ${confirmation}` });
  },
  followCase: (caseId) => {
    if (caseId === null) {
      set({ followedCaseId: null });
      return;
    }
    const id = cleanText(caseId);
    if (!id || !get().lifecycles[id]) return;
    set({ followedCaseId: id });
  },
  caseStates: initialStates(),
  records: seededRecords(),
  agentEnabled: false,
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
  resetDemo: () => set({ caseStates: initialStates(), records: seededRecords(), agentEnabled: false, baselineInputs: baselineDraft(BASELINE_DEFAULTS), lifecycles: seededLifecycles(), followedCaseId: null }),
  };
});
