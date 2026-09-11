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
import type { CaseRevision, HistoryEvent, LifecycleDecisionRecord, LifecycleSlice, LifecycleState } from "@/lib/domain/lifecycle";
import { seededLifecycleSession } from "@/lib/domain/lifecycle-seed";
import { appendHistory, caseForLifecycle, immutable, requireLifecycle, requireText, validatePrecheck } from "@/lib/domain/lifecycle-model";
import { runAgent } from "@/lib/domain/agent";

// Session state for the prototype. Everything is in memory: the preview runs in
// a sandboxed frame, so nothing is written to storage and Reset returns the
// demonstration to its starting point.

function seededRecords(): DecisionRecord[] {
  return immutable([
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
  ]);
}

interface AppState extends LifecycleSlice {
  caseStates: Record<string, CaseState>;
  records: LifecycleDecisionRecord[];
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
    approvedDraft?: string;
  }) => DecisionRecord;
  setAgentEnabled: (on: boolean) => void;
  resetDemo: () => void;
}

const initialStates = () =>
  Object.fromEntries(CASES.map((c) => [c.id, c.initialState])) as Record<string, CaseState>;

const targets: Record<HumanDecision, LifecycleState> = {
  ACCEPT: "paid", AMEND: "paid", REFER_BACK: "referred_back", REQUEST_INFORMATION: "information_requested", ESCALATE: "escalated",
};
const recommendations: Partial<Record<Recommendation, LifecycleState>> = {
  SUFFICIENT: "paid", REFER_BACK: "referred_back", REQUEST_INFORMATION: "information_requested",
};

export const useAppStore = create<AppState>((set, get) => {
  const currentCase = (caseId: string) => {
    const s = get();
    requireLifecycle(caseId, s.lifecycles);
    const c = caseForLifecycle(caseId, s.lifecycles, s.caseRevisions);
    if (!c) throw new Error("No synthetic evidence for this case.");
    return c;
  };
  const timestamp = (caseId: string) => new Date(Math.max(Date.now(), Date.parse(get().lifecycles[caseId].history.at(-1)!.at) + 1)).toISOString();
  const requireState = (caseId: string, states: LifecycleState[]) => {
    const row = requireLifecycle(caseId, get().lifecycles);
    if (!states.includes(row.state)) throw new Error(`Cannot act on ${caseId} while ${row.state}; expected ${states.join(" or ")}.`);
    return row;
  };
  const pharmacyAction = (caseId: string, text: string, kind: CaseRevision["kind"], precheck?: Parameters<LifecycleSlice["submitFromPharmacy"]>[2]) => {
    const c = currentCase(caseId);
    if (typeof text !== "string" || (c.scenario !== "E" && !text.trim()) || kind === "confirmation" && !text.trim()) throw new Error("Pharmacy text is required.");
    const s = get();
    const current = kind === "submission" ? s.lifecycles[caseId] : requireState(caseId, [kind === "confirmation" ? "information_requested" : "referred_back"]);
    validatePrecheck(precheck, text, c.extracted.dispensingDate);
    const previous = s.caseRevisions[caseId].at(-1)!;
    const at = timestamp(caseId);
    const revision: CaseRevision = { number: previous.number + 1, at, kind, templateCaseId: previous.templateCaseId,
      endorsementText: kind === "confirmation" ? previous.endorsementText : text, precheck: precheck ?? null, confirmation: kind === "confirmation" ? text : null };
    const event: HistoryEvent = { at, actor: "pharmacy", from: current.state, to: kind === "submission" ? "submitted" : "resubmitted",
      message: kind === "submission" ? "Explicit demo submission; previous revisions retained." : kind === "confirmation" ? "Pharmacy confirmation received; human re-check required." : "Pharmacy correction resubmitted for re-check.",
      revision: revision.number };
    set({ lifecycles: immutable({ ...s.lifecycles, [caseId]: appendHistory(current, event) }),
      caseRevisions: immutable({ ...s.caseRevisions, [caseId]: [...s.caseRevisions[caseId], revision] }),
      caseStates: { ...s.caseStates, [caseId]: c.initialState === "human_decision_recorded" ? "operator_review_required" : c.initialState } });
  };

  /** Both public decision APIs commit exactly one linked operator event atomically. */
  const decide = (input: Omit<Parameters<AppState["recordDecision"]>[0], "approvedDraft">, legacy: boolean, draft?: string): LifecycleDecisionRecord => {
    const c = currentCase(input.caseId);
    const current = requireState(c.id, ["in_review", "escalated"]);
    if (!Object.hasOwn(targets, input.decision) || !["SUFFICIENT", "REFER_BACK", "REQUEST_INFORMATION", "ABSTAIN", "NONE"].includes(input.recommendation)) throw new Error("Unknown decision or recommendation.");
    requireText(input.tariffVersion, "Tariff version");
    requireText(input.agentVersion, "Agent version");
    if (![input.inputs, input.sources].every((items) => Array.isArray(items) && items.every((item) => typeof item === "string")) ||
      !Array.isArray(input.checks) || input.checks.some((check) => !check || typeof check.name !== "string" || typeof check.detail !== "string" || typeof check.pass !== "boolean")) throw new Error("Invalid decision evidence.");
    // A manual NONE decision must not invoke interpretation behind the Off UI.
    const pack = runAgent(c, { agentEnabled: input.recommendation !== "NONE" });
    const proposed = recommendations[input.recommendation];
    if (input.recommendation !== "NONE" && (pack.recommendation !== input.recommendation || input.tariffVersion !== pack.tariffVersion)) throw new Error("Recommendation is stale or does not match current evidence.");
    if (proposed && (pack.gate.result !== "PASS" || JSON.stringify(input.checks) !== JSON.stringify(pack.gate.checks))) throw new Error("Cannot accept advice without the current validated gate checks.");
    if (input.decision === "AMEND" && !proposed) throw new Error("No validated recommendation to amend; choose a manual decision.");
    const to = legacy && input.decision === "ACCEPT" && proposed ? proposed : targets[input.decision];
    const isOverride = Boolean(proposed && (to !== proposed || input.decision === "AMEND"));
    const reason = input.overrideReason ?? "";
    if (typeof reason !== "string") throw new Error("Decision reason must be text.");
    if (!proposed || isOverride || to !== "paid") requireText(reason, "Decision reason", 8);
    if (draft !== undefined) {
      requireText(draft, "Approved draft");
      if (!get().agentEnabled || !proposed || pack.gate.result !== "PASS" || !pack.clause || !pack.draftToPharmacy ||
        (to !== "referred_back" && to !== "information_requested")) throw new Error("No validated pharmacy draft available for approval.");
    }
    const s = get(), at = timestamp(c.id), revision = s.caseRevisions[c.id].at(-1)!.number;
    const clauseId = input.tariffVersion === pack.tariffVersion && input.recommendation !== "NONE" ? pack.clause?.id : undefined;
    const approvedDraft = draft === undefined ? undefined : { text: draft, approvedAt: at, approvedBy: "Demo operator", decision: input.decision, tariffVersion: pack.tariffVersion, clauseId: pack.clause!.id };
    const record = immutable<LifecycleDecisionRecord>({ ...input, id: `DR-${String(s.records.length + 872).padStart(6, "0")}`,
      timestamp: at, operator: "Demo operator", synthetic: true, isOverride, overrideReason: reason.trim() || null,
      reason: reason.trim(), revision, clauseId, ...(approvedDraft ? { approvedDraft } : {}) });
    const event: HistoryEvent = { at, actor: "operator", from: current.state, to, message: "Human decision recorded (synthetic).",
      decision: input.decision, recommendation: input.recommendation, reason: record.reason, recordId: record.id, revision,
      tariffVersion: input.tariffVersion, clauseId, ...(approvedDraft ? { approvedDraft, exactFix: approvedDraft.text } : {}) };
    set({ records: immutable([...s.records, record]), caseStates: { ...s.caseStates, [c.id]: "human_decision_recorded" },
      lifecycles: immutable({ ...s.lifecycles, [c.id]: appendHistory(current, event) }) });
    return record;
  };

  return {
    ...seededLifecycleSession(), followedCaseId: null,
    submitFromPharmacy: (id, text, precheck) => pharmacyAction(id, text, "submission", precheck),
    resubmitFromPharmacy: (id, text, precheck) => pharmacyAction(id, text, "resubmission", precheck),
    sendConfirmation: (id, text) => pharmacyAction(id, text, "confirmation"),
    arriveInQueue: (id) => {
      const current = requireState(id, ["submitted", "resubmitted"]);
      const s = get(), c = currentCase(id), pack = runAgent(c, { agentEnabled: s.agentEnabled });
      const at = timestamp(id), revision = s.caseRevisions[id].at(-1)!.number;
      let row = appendHistory(current, { at, actor: "code", from: current.state, to: "in_review", message: "Arrived for review.", revision });
      if (pack.state === "cleared_by_rules" || pack.agentInvoked) {
        const cleared = pack.state === "cleared_by_rules";
        row = appendHistory(row, { at, actor: cleared ? "code" : "agent", from: "in_review", to: cleared ? "paid" : "in_review", revision,
          message: cleared ? "Released to existing pricing without an agent call (synthetic)." : pack.recommendation === "ABSTAIN" ? "Scripted agent abstained; manual evidence review required." : pack.gate.result === "FAIL" ? "Gate withheld recommendation; evidence only." : "Scripted case built; human decision required.",
          recommendation: pack.recommendation });
      }
      // F's historical decision remains in records, not as the new revision's decision.
      set({ lifecycles: immutable({ ...s.lifecycles, [id]: row }), caseStates: { ...s.caseStates, [id]: pack.state === "human_decision_recorded" ? "operator_review_required" : pack.state } });
    },
    recordOperatorDecision: (id, decision, reason, draft) => {
      const c = currentCase(id), pack = runAgent(c, { agentEnabled: get().agentEnabled });
      decide({ caseId: id, decision, overrideReason: reason, recommendation: pack.recommendation,
        tariffVersion: get().agentEnabled ? pack.tariffVersion : "n/a", agentVersion: get().agentEnabled ? pack.agentVersion : "not invoked",
        inputs: pack.evidence.map((e) => e.value), sources: [...new Set(pack.evidence.map((e) => e.origin))], checks: pack.gate.checks }, false, draft);
    },
    followCase: (id) => { if (id !== null) requireLifecycle(id, get().lifecycles); set({ followedCaseId: id }); },
    caseStates: initialStates(), records: seededRecords(), agentEnabled: false,
    baselineInputs: baselineDraft(BASELINE_DEFAULTS),
    setBaselineInput: (field, value) => set((s) => ({ baselineInputs: { ...s.baselineInputs, [field]: value } })),
    recordDecision: ({ approvedDraft, ...input }) => decide(input, true, approvedDraft),
    setAgentEnabled: (agentEnabled) => set({ agentEnabled }),
    // Preserve all three replacement identities used by existing reset subscribers.
    resetDemo: () => set({ ...seededLifecycleSession(), followedCaseId: null, caseStates: initialStates(), records: seededRecords(), agentEnabled: false, baselineInputs: baselineDraft(BASELINE_DEFAULTS) }),
  };
});

/** Imperative convenience. React consumers memoise the pure helper on both slices. */
export function sessionCase(caseId: string) {
  const { lifecycles, caseRevisions } = useAppStore.getState();
  return caseForLifecycle(caseId, lifecycles, caseRevisions);
}
