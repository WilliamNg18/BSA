/// <reference types="vite/client" />
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
import { createManualLoopDraft } from "@/lib/domain/manual-loop-month-model";
import type { ManualLoopModelSlice } from "@/lib/domain/baseline";
import { baselineDraft, type BaselineDraft, type BaselineField } from "@/lib/domain/baseline";
import { BASELINE_DEFAULTS, MONTH_TIME_ASSUMPTIONS, PHARMACY_ASSUMPTION_DEFAULTS, PROCESS_MONTH_DEFAULTS, type ProcessModelSlice, type ProcessMonthDraft } from "@/lib/domain/baseline";
import type { CaseState, DecisionRecord, HumanDecision, Recommendation } from "@/lib/domain/types";
import { NO_VERIFICATION, type HumanActionSlice, type CaseRevision, type HistoryEvent, type LifecycleDecisionRecord, type LifecycleSlice, type LifecycleState, type PharmacyPrecheckSnapshot, type ProcessSlice, type ProcessSubmission, type ItemProcess } from "@/lib/domain/lifecycle";
import { DEMO_STEPS, type DemoModeSlice } from "@/lib/domain/demo-steps";
import { seededLifecycleSession } from "@/lib/domain/lifecycle-seed";
import { appendHistory, caseForLifecycle, immutable, paperDeclarationFields, requireLifecycle, requireText, validatePrecheck, validateSubmissionSources } from "@/lib/domain/lifecycle-model";
import { runAgent } from "@/lib/domain/agent";
import { checkPharmacy, pharmacyDateCorrection, type PharmacyCheckOptions } from "@/lib/domain/pharmacy-check";
import { validateEpsCorrection, type EpsCorrectionSources } from "@/lib/domain/eps-correction";
import { routeSubmission, routingFactsForCase, RB_CODE_CATALOG } from "@/lib/domain/routing";
import { createPharmacyState, type PharmacyState } from "./pharmacy-store";
import { createQueueState, type QueueState } from "./queue-store";
import { capturedFields, capturedFieldsMatchSources, compatibleCapture, sameDeclaredFields, validateDeclaredFields } from "@/lib/domain/capture-evidence";
import { mandatoryFieldsCheck } from "@/lib/domain/rules";

// Session state for the prototype. Everything is in memory: the preview runs in
// a sandboxed frame, so nothing is written to storage and Reset returns the
// demonstration to its starting point.

function seededRecords(): LifecycleDecisionRecord[] {
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
    {
      id: "DR-000872", caseId: "EX-24088", timestamp: "2026-09-04T09:03:00.000Z",
      tariffVersion: "n/a", agentVersion: "not invoked", inputs: ["Corrected endorsement: NCSO DL 06/08/26"],
      sources: ["Pharmacy correction revision 2"], checks: [], recommendation: "NONE", decision: "ACCEPT",
      isOverride: false, overrideReason: "Human checked the corrected initials and date.",
      reason: "Human checked the corrected initials and date.", revision: 2, operator: "Demo operator", synthetic: true,
    },
  ]);
}

export type Perspective = "pharmacy" | "nhsbsa" | "both";

export interface PharmacyCorrectionEvent {
  readonly epsSources?: EpsCorrectionSources;
  readonly caseId: string;
  readonly pharmacyCode: string;
  readonly at: string;
  /** The next human submission attempt, not a lifecycle transition. */
  readonly revision: number;
  readonly before: PharmacyPrecheckSnapshot;
  readonly after: PharmacyPrecheckSnapshot;
}

interface AppState extends LifecycleSlice, ProcessSlice, ProcessModelSlice, ManualLoopModelSlice, DemoModeSlice, HumanActionSlice {
  pharmacy: PharmacyState;
  queue: QueueState;
  caseStates: Record<string, CaseState>;
  records: LifecycleDecisionRecord[];
  agentEnabled: boolean;
  perspective: Perspective;
  setPerspective: (perspective: Perspective) => void;
  baselineInputs: BaselineDraft;
  setBaselineInput: (field: BaselineField, value: string) => void;
  todayMinutes: string;
  setTodayMinutes: (value: string) => void;
  pharmacyCorrections: readonly PharmacyCorrectionEvent[];
  recordPharmacyCorrection: (caseId: string, before: PharmacyPrecheckSnapshot, after: PharmacyPrecheckSnapshot, revision: number, options?: PharmacyCheckOptions, sources?: EpsCorrectionSources) => void;
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

const initialStates = (): Record<string, CaseState> => {
  const { lifecycles } = seededLifecycleSession();
  return Object.fromEntries(Object.keys(lifecycles).map((id) => [id, CASES.find((c) => c.id === id)?.initialState ?? "operator_review_required"]));
};

const processDraft = (): ProcessMonthDraft => Object.fromEntries(Object.entries(PROCESS_MONTH_DEFAULTS).map(([key, value]) => [key, String(value)])) as ProcessMonthDraft;
const seededVerification = (): HumanActionSlice["itemVerification"] =>
  immutable(Object.fromEntries(Object.keys(seededLifecycleSession().lifecycles).map((id) => [id, { ...NO_VERIFICATION }])));

function seededProcesses(): Record<string, ItemProcess> {
  const { lifecycles, caseRevisions } = seededLifecycleSession();
  return immutable(Object.fromEntries(Object.values(lifecycles).map((row) => {
    const c = caseForLifecycle(row.caseId, lifecycles, caseRevisions)!;
    const revision = caseRevisions[row.caseId].at(-1)!;
    const channel = revision.channel!;
    const facts = { ...routingFactsForCase(c, channel) };
    if (row.state === "referred_back") facts.type2Decision = "insufficient";
    if (row.state === "information_requested") facts.type2Decision = "request_information";
    if (row.state === "resubmitted") facts.interpretationRequired = true;
    if (row.state === "paid" && c.scenario === "F") facts.type2Decision = "sufficient";
    return [row.caseId, { revision: revision.number, channel, routing: routeSubmission(facts), capture: null,
      rbCode: row.state === "referred_back" ? row.history.at(-1)?.rbCode ?? null : null }];
  })));
}

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
    const c = caseForLifecycle(caseId, s.lifecycles, s.caseRevisions, s.itemProcesses);
    if (!c) throw new Error("No synthetic evidence for this case.");
    return c;
  };
  const timestamp = (caseId: string) => new Date(Math.max(Date.now(), Date.parse(get().lifecycles[caseId].history.at(-1)!.at) + 1)).toISOString();
  const requireState = (caseId: string, states: LifecycleState[]) => {
    const row = requireLifecycle(caseId, get().lifecycles);
    if (!states.includes(row.state)) throw new Error(`Cannot act on ${caseId} while ${row.state}; expected ${states.join(" or ")}.`);
    return row;
  };
  const legacySubmission = (caseId: string, text: string, precheck?: PharmacyPrecheckSnapshot): ProcessSubmission => {
    const previous = get().caseRevisions[caseId]?.at(-1);
    const channel = previous?.channel ?? (currentCase(caseId).scenario === "D" ? "paper" : "eps");
    return { caseId, channel, endorsementText: text, precheck,
      ...(channel === "paper" && previous?.paperDeclaration ? { paperDeclaration: { ...previous.paperDeclaration, endorsementText: text } } : {}),
      ...(channel === "paper" && previous?.declaration ? { declaration: {
        ...previous.declaration, fields: { ...previous.declaration.fields, endorsementText: text },
      } } : {}) };
  };
  const pharmacyAction = (caseId: string, text: string, kind: CaseRevision["kind"], precheck?: Parameters<LifecycleSlice["submitFromPharmacy"]>[2], submission?: ProcessSubmission) => {
    const c = currentCase(caseId);
    if (typeof text !== "string" || !submission && c.scenario !== "E" && !text.trim() || kind === "confirmation" && !text.trim()) throw new Error("Pharmacy text is required.");
    const s = get();
    const current = kind === "submission" ? s.lifecycles[caseId] : requireState(caseId, [kind === "confirmation" ? "information_requested" : "referred_back"]);
    const previous = s.caseRevisions[caseId].at(-1)!;
    const channel = submission?.channel ?? previous.channel ?? (c.channel === "Electronic (EPS)" ? "eps" : "paper");
    if (!["eps", "paper"].includes(channel)) throw new Error("Invalid item channel.");
    const epsPrescription = submission?.epsPrescription ?? (channel === "eps" && previous.epsPrescription
      ? { ...previous.epsPrescription, dispenserEndorsement: kind === "confirmation" ? previous.endorsementText : text, claimMessageState: "submitted" as const } : undefined);
    const paperDeclaration = submission?.paperDeclaration ?? (kind === "confirmation" ? previous.paperDeclaration :
      channel === "paper" && submission?.declaration && previous.paperDeclaration ? {
        ...previous.paperDeclaration, typedProduct: submission.declaration.fields.productCode === previous.declaration?.fields.productCode
          ? previous.paperDeclaration.typedProduct : submission.declaration.fields.productCode ?? "",
        quantity: submission.declaration.fields.quantity, endorsementText: submission.declaration.fields.endorsementText,
      } : undefined);
    const at = timestamp(caseId);
    const declaration = submission?.declaration ?? (paperDeclaration ? {
      fields: paperDeclarationFields(paperDeclaration), declaredAt: at, provenance: "pharmacy_declaration" as const,
    } : undefined);
    const submittedText = kind === "confirmation" ? previous.endorsementText : text;
    validateSubmissionSources({ ...submission, caseId, channel, endorsementText: submittedText, epsPrescription, paperDeclaration, declaration }, previous.number);
    validatePrecheck(precheck, submittedText, epsPrescription?.dispensingDate ?? paperDeclaration?.dispensingDate ?? c.extracted.dispensingDate);
    if (declaration) validateDeclaredFields(declaration.fields);
    if (declaration && (channel !== "paper" || declaration.provenance !== "pharmacy_declaration" || !Number.isFinite(Date.parse(declaration.declaredAt)) ||
      declaration.fields.endorsementText !== submittedText || declaration.fields.productCode !== null && !declaration.fields.productCode.startsWith("SYN-"))) throw new Error("Invalid pharmacy declaration.");
    const revision: CaseRevision = { number: previous.number + 1, at, kind, templateCaseId: previous.templateCaseId,
      endorsementText: submittedText, precheck: precheck ?? null, confirmation: kind === "confirmation" ? text : null,
      channel, ...(declaration ? { declaration } : {}), ...(epsPrescription ? { epsPrescription } : {}), ...(paperDeclaration ? { paperDeclaration } : {}) };
    const event: HistoryEvent = { at, actor: "pharmacy", from: current.state, to: kind === "submission" ? "submitted" : "resubmitted",
      message: kind === "submission" ? "Explicit demo submission; previous revisions retained." : kind === "confirmation" ? "Pharmacy confirmation received; human re-check required." : "Pharmacy correction resubmitted for re-check.",
      revision: revision.number, channel, processStep: kind === "submission" ? "submission" : "resubmission" };
    const revisions = immutable({ ...s.caseRevisions, [caseId]: [...s.caseRevisions[caseId], revision] });
    const projected = caseForLifecycle(caseId, s.lifecycles, revisions)!;
    const facts = routingFactsForCase(projected, channel);
    const routing = routeSubmission({ ...facts, interpretationRequired: facts.interpretationRequired || kind !== "submission" });
    let row = appendHistory(current, event);
    if (routing.outcome === "auto_priced") row = appendHistory(row, { at, actor: "code", from: row.state, to: "paid", message: routing.reason, revision: revision.number, channel, processStep: "automatic_pricing" });
    set({ lifecycles: immutable({ ...s.lifecycles, [caseId]: row }),
      caseRevisions: revisions,
      itemVerification: immutable({ ...s.itemVerification, [caseId]: { ...NO_VERIFICATION } }),
      itemProcesses: immutable({ ...s.itemProcesses, [caseId]: { revision: revision.number, channel, routing, capture: null, rbCode: null } }),
      caseStates: { ...s.caseStates, [caseId]: routing.outcome === "auto_priced" ? "cleared_by_rules" : "operator_review_required" } });
  };

  /** Both public decision APIs commit exactly one linked operator event atomically. */
  const decide = (input: Omit<Parameters<AppState["recordDecision"]>[0], "approvedDraft">, legacy: boolean, draft?: string, rbCode?: string): LifecycleDecisionRecord => {
    const c = currentCase(input.caseId);
    const current = requireState(c.id, ["in_review", "escalated"]);
    const process = get().itemProcesses[c.id];
    if (process.routing.outcome === "auto_priced" || process.routing.outcome === "type1_capture") throw new Error("Type 2 judgement requires completed capture and an operator item.");
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
    if (to === "referred_back" && !RB_CODE_CATALOG.some((entry) => entry.code === rbCode)) throw new Error("Select a known or explicitly synthetic RB code.");
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
    const record = immutable<LifecycleDecisionRecord>({ ...input, id: `DR-${String(Math.max(...s.records.map((entry) => Number(entry.id.slice(3)))) + 1).padStart(6, "0")}`,
      timestamp: at, operator: "Demo operator", synthetic: true, isOverride, overrideReason: reason.trim() || null,
      reason: reason.trim(), revision, clauseId, ...(rbCode ? { rbCode } : {}), ...(approvedDraft ? { approvedDraft } : {}) });
    const event: HistoryEvent = { at, actor: "operator", from: current.state, to, message: "Human decision recorded (synthetic).",
      decision: input.decision, recommendation: input.recommendation, reason: record.reason, recordId: record.id, revision,
      tariffVersion: input.tariffVersion, clauseId, channel: process.channel, processStep: to === "referred_back" ? "referral" : "type2_judgement",
      ...(rbCode ? { rbCode } : {}), ...(approvedDraft ? { approvedDraft, exactFix: approvedDraft.text } : {}) };
    const routing = routeSubmission({ ...routingFactsForCase({ ...c, extracted: capturedFields(c) }, process.channel, true),
      type2Decision: to === "referred_back" ? "insufficient" : to === "paid" ? "sufficient" : "request_information" });
    if (to === "paid" && routing.requiresHuman) throw new Error("Mandatory evidence is still missing; pricing cannot proceed.");
    let decidedRow = appendHistory(current, event);
    if (to === "paid") decidedRow = appendHistory(decidedRow, { at, actor: "code", from: "paid", to: "paid",
      revision, channel: process.channel, processStep: "existing_pricing",
      message: "Priced by NHSBSA's existing rules engine after human judgement; normal payment schedule (synthetic)." });
    set({ records: immutable([...s.records, record]), caseStates: { ...s.caseStates, [c.id]: "human_decision_recorded" },
      itemProcesses: immutable({ ...s.itemProcesses, [c.id]: { ...process, routing, rbCode: rbCode ?? null } }),
      lifecycles: immutable({ ...s.lifecycles, [c.id]: decidedRow }) });
    return record;
  };

  return {
    demoStep: null,
    setDemoStep: (step) => {
      if (step !== null && (!Number.isInteger(step) || !DEMO_STEPS.some((entry) => entry.number === step))) throw new Error("Choose a supported demonstration step.");
      set({ demoStep: step });
    },
    itemVerification: seededVerification(),
    operatorDrafts: {},
    pharmacyDrafts: {},
    setOperatorDraft: (caseId, draft) => {
      const row = requireState(caseId, ["in_review", "escalated"]);
      if (draft.outcome !== null && !Object.hasOwn(targets, draft.outcome)) throw new Error("Choose a supported human outcome.");
      if (typeof draft.rbCode !== "string" || typeof draft.note !== "string") throw new Error("Decision fields must contain text.");
      const s = get();
      if (draft.revision !== s.caseRevisions[caseId].at(-1)!.number) throw new Error("Decision draft is stale; review the current item.");
      set({ operatorDrafts: immutable({ ...s.operatorDrafts, [row.caseId]: {
        ...draft, revision: s.caseRevisions[caseId].at(-1)!.number, appliedSuggestion: false,
      } }) });
    },
    setPharmacyDraft: (caseId, draft) => {
      requireState(caseId, ["referred_back"]);
      if (typeof draft.endorsementText !== "string") throw new Error("Correction endorsement must contain text.");
      const s = get(), revision = s.caseRevisions[caseId].at(-1)!;
      if (draft.revision !== revision.number) throw new Error("Pharmacy correction draft is stale; reopen the current item.");
      set({ pharmacyDrafts: immutable({ ...s.pharmacyDrafts, [caseId]: {
        ...draft, revision: revision.number, appliedSuggestion: false,
      } }) });
    },
    applySuggestionToDecision: (caseId) => {
      const row = requireState(caseId, ["in_review", "escalated"]), s = get();
      if (!s.agentEnabled) throw new Error("Agent assistance is off; enter your own decision.");
      const c = currentCase(caseId), pack = runAgent(c, { agentEnabled: true });
      const outcome = pack.recommendation === "SUFFICIENT" ? "ACCEPT"
        : pack.recommendation === "REFER_BACK" ? "REFER_BACK"
          : pack.recommendation === "REQUEST_INFORMATION" ? "REQUEST_INFORMATION" : null;
      if (!outcome || pack.gate.result !== "PASS") throw new Error("No validated suggestion is available to apply.");
      const revision = s.caseRevisions[caseId].at(-1)!.number;
      const rbCode = outcome === "REFER_BACK" ? c.scenario === "D" ? "RB2B" : c.scenario === "B" ? "SYN-NCSO" : "" : "";
      const event: HistoryEvent = { at: timestamp(caseId), actor: "operator", from: row.state, to: row.state,
        revision, processStep: "suggestion_applied", recommendation: pack.recommendation,
        message: "Applied by the operator from the agent's suggestion." };
      set({
        operatorDrafts: immutable({ ...s.operatorDrafts, [caseId]: {
          revision, outcome, rbCode, note: pack.draftToPharmacy ?? "", appliedSuggestion: true,
        } }),
        lifecycles: immutable({ ...s.lifecycles, [caseId]: appendHistory(row, event) }),
      });
    },
    releaseToPricing: (caseId, reason) => {
      const s = get(), row = requireState(caseId, ["in_review", "escalated"]);
      const verification = s.itemVerification[caseId], process = s.itemProcesses[caseId];
      if (!verification || verification.gate1 !== "pass" || verification.gate2 !== "pass" || !verification.reconciled || verification.released) {
        throw new Error("Both verification gates must pass and evidence must reconcile before release.");
      }
      const draft = s.operatorDrafts[caseId], revision = s.caseRevisions[caseId].at(-1)!.number;
      if (draft && draft.revision !== revision) throw new Error("Decision draft is stale; review the current item.");
      const note = reason ?? draft?.note ?? "";
      requireText(note, "Release reason", 8);
      const c = currentCase(caseId), facts = routingFactsForCase({ ...c, extracted: capturedFields(c) }, process.channel, Boolean(process.capture));
      if (!facts.mandatoryFieldsComplete || facts.hasConflict || facts.endorsementRequired && !facts.endorsementComplete ||
        process.routing.outcome === "type1_capture" && process.routing.requiresHuman) throw new Error("Current evidence does not satisfy the release gate.");
      const released = { ...verification, released: true };
      const event: HistoryEvent = { at: timestamp(caseId), actor: "operator", from: row.state, to: "released_to_pricing",
        revision, processStep: "release_to_pricing", verification: released, releaseOrigin: "human_decision", reason: note,
        message: "Human review complete; released to existing pricing. No payment calculated." };
      set({
        itemVerification: immutable({ ...s.itemVerification, [caseId]: released }),
        lifecycles: immutable({ ...s.lifecycles, [caseId]: appendHistory(row, event) }),
        itemProcesses: immutable({ ...s.itemProcesses, [caseId]: { ...process, releaseOrigin: "human_decision", routing: {
          ...process.routing, requiresHuman: false, pricingAuthority: "existing_rules_engine",
        } } }),
        caseStates: { ...s.caseStates, [caseId]: "human_decision_recorded" },
      });
    },
    referBack: (caseId, rbCode, note) => get().recordType2Decision({ caseId, decision: "REFER_BACK", rbCode, reason: note }),
    requestInformation: (caseId, question) => get().recordType2Decision({ caseId, decision: "REQUEST_INFORMATION", reason: question }),
    applySuggestedCorrection: (caseId) => {
      const s = get(), row = requireState(caseId, ["referred_back"]), revision = s.caseRevisions[caseId].at(-1)!;
      if (!s.agentEnabled) throw new Error("Agent assistance is off; enter your correction manually.");
      const approval = s.records.filter((record) => record.caseId === caseId && (record.revision ?? 1) === revision.number).at(-1)?.approvedDraft;
      if (!approval) throw new Error("No operator-approved correction is available for this revision.");
      const c = currentCase(caseId), correction = pharmacyDateCorrection(c, revision.endorsementText);
      if (correction === revision.endorsementText) throw new Error("No applicable date correction is available; edit the required fields.");
      const source = legacySubmission(caseId, correction);
      const event: HistoryEvent = { at: timestamp(caseId), actor: "pharmacy", from: row.state, to: row.state,
        revision: revision.number, processStep: "correction_applied", message: "Suggested correction applied by the pharmacy; not resubmitted." };
      set({
        pharmacyDrafts: immutable({ ...s.pharmacyDrafts, [caseId]: {
          revision: revision.number, endorsementText: correction,
          ...(source.declaration ? { declaration: source.declaration } : {}),
          ...(source.paperDeclaration ? { paperDeclaration: source.paperDeclaration } : {}),
          ...(revision.epsPrescription ? { epsPrescription: { ...revision.epsPrescription, dispenserEndorsement: correction } } : {}),
          appliedSuggestion: true,
        } }),
        lifecycles: immutable({ ...s.lifecycles, [caseId]: appendHistory(row, event) }),
      });
    },
    resubmit: (caseId) => {
      const s = get(), revision = s.caseRevisions[caseId]?.at(-1), draft = s.pharmacyDrafts[caseId];
      if (!revision || !draft || draft.revision !== revision.number) throw new Error("A current pharmacy correction draft is required.");
      get().resubmitItem({ ...draft, caseId, revision: revision.number, channel: revision.channel ?? s.itemProcesses[caseId].channel });
    },
    pharmacy: createPharmacyState((update) => set((s) => ({ pharmacy: { ...s.pharmacy, ...(typeof update === "function" ? update(s.pharmacy) : update) } })), () => get().pharmacy),
    queue: createQueueState((update) => set((s) => ({ queue: { ...s.queue, ...(typeof update === "function" ? update(s.queue) : update) } }))),
    processInputs: processDraft(),
    manualLoopInputs: createManualLoopDraft(),
    setManualLoopInput: (field, value) => set((s) => ({ manualLoopInputs: { ...s.manualLoopInputs, [field]: value } })),
    setProcessInput: (field, value) => set((s) => ({ processInputs: { ...s.processInputs, [field]: value } })),
    itemProcesses: seededProcesses(),
    submitItem: (input) => pharmacyAction(input.caseId, input.endorsementText, "submission", input.precheck, input),
    resubmitItem: (input) => pharmacyAction(input.caseId, input.endorsementText, "resubmission", input.precheck, input),
    confirmType1: (input) => {
      const s = get(), c = currentCase(input.caseId), process = s.itemProcesses[input.caseId], row = requireLifecycle(input.caseId, s.lifecycles);
      const revision = s.caseRevisions[input.caseId].at(-1)!;
      if (input.revision !== revision.number || process.routing.outcome !== "type1_capture" || process.capture) throw new Error("Capture requires the current awaiting Type 1 revision.");
      if (!["human_capture", "pharmacy_declaration"].includes(input.provenance) || typeof input.declarationReconciled !== "boolean") throw new Error("Invalid capture provenance.");
      const fields = input.fields;
      validateDeclaredFields(fields);
      if (fields.productCode !== null && !fields.productCode.startsWith("SYN-")) throw new Error("Only synthetic product codes may be captured.");
      if (input.provenance === "pharmacy_declaration" && !revision.declaration) throw new Error("No pharmacy declaration on this revision.");
      if (input.provenance === "pharmacy_declaration" && !sameDeclaredFields(fields, revision.declaration!.fields)) throw new Error("Corrected fields require human_capture provenance.");
      const at = timestamp(c.id);
      const capture = { revision: revision.number, confirmedAt: at, operator: "Demo operator", fields, provenance: input.provenance, declarationReconciled: input.declarationReconciled };
      const confirmedCase = { ...c, capturedEvidence: { fields, provenance: input.provenance, declarationReconciled: input.declarationReconciled, revision: revision.number } };
      const facts = routingFactsForCase({ ...confirmedCase, extracted: capturedFields(confirmedCase) }, process.channel, true);
      const captureCompatible = input.provenance === "human_capture" && c.scenario !== "D"
        ? capturedFieldsMatchSources(confirmedCase) : compatibleCapture(confirmedCase);
      const routing = routeSubmission({ ...facts, interpretationRequired: facts.interpretationRequired || !captureCompatible ||
        revision.kind === "resubmission" || !mandatoryFieldsCheck(capturedFields(confirmedCase)).every((check) => check.pass) });
      let capturedRow = appendHistory(row, { at, actor: "operator", from: row.state, to: "in_review",
        revision: revision.number, channel: process.channel, processStep: "type1_capture", capture, message: "Human capture confirmed; code routed the captured fields." });
      if (!routing.requiresHuman && routing.pricingAuthority) capturedRow = appendHistory(capturedRow, { at, actor: "code", from: "in_review", to: "paid",
        revision: revision.number, channel: process.channel, processStep: "existing_pricing", message: routing.reason });
      set({ itemProcesses: immutable({ ...s.itemProcesses, [c.id]: { ...process, capture, routing } }),
        caseStates: { ...s.caseStates, [c.id]: routing.requiresHuman ? "operator_review_required" : "cleared_by_rules" },
        lifecycles: immutable({ ...s.lifecycles, [c.id]: capturedRow }) });
    },
    recordType2Decision: ({ caseId, decision, reason, approvedDraft, rbCode }) => {
      requireText(reason, "Decision reason", 8);
      const c = currentCase(caseId), pack = runAgent(c, { agentEnabled: get().agentEnabled });
      decide({ caseId, decision, overrideReason: reason, recommendation: pack.recommendation,
        tariffVersion: get().agentEnabled ? pack.tariffVersion : "n/a", agentVersion: get().agentEnabled ? pack.agentVersion : "not invoked",
        inputs: pack.evidence.map((e) => e.value), sources: [...new Set(pack.evidence.map((e) => e.origin))], checks: pack.gate.checks }, false, approvedDraft, rbCode);
    },
    ...seededLifecycleSession(), followedCaseId: null,
    submitFromPharmacy: (id, text, precheck) => pharmacyAction(id, text, "submission", precheck, legacySubmission(id, text, precheck)),
    resubmitFromPharmacy: (id, text, precheck) => pharmacyAction(id, text, "resubmission", precheck, legacySubmission(id, text, precheck)),
    sendConfirmation: (id, text) => pharmacyAction(id, text, "confirmation"),
    arriveInQueue: (id) => {
      if (get().itemProcesses[id]?.routing.outcome === "auto_priced") return;
      const current = requireState(id, ["submitted", "resubmitted"]);
      const s = get(), c = currentCase(id), pack = runAgent(c, { agentEnabled: s.agentEnabled });
      const at = timestamp(id), revision = s.caseRevisions[id].at(-1)!.number;
      let row = appendHistory(current, { at, actor: "code", from: current.state, to: "in_review", message: "Arrived for review.", revision });
      if (pack.agentInvoked) {
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
        inputs: pack.evidence.map((e) => e.value), sources: [...new Set(pack.evidence.map((e) => e.origin))], checks: pack.gate.checks }, false, draft,
      decision === "REFER_BACK" ? c.scenario === "D" ? "RB2B" : "SYN-NCSO" : undefined);
    },
    followCase: (id) => { if (id !== null) requireLifecycle(id, get().lifecycles); set({ followedCaseId: id }); },
    caseStates: initialStates(), records: seededRecords(), agentEnabled: false,
    perspective: "both",
    setPerspective: (perspective) => set({ perspective }),
    baselineInputs: baselineDraft(BASELINE_DEFAULTS),
    setBaselineInput: (field, value) => { set((s) => ({ baselineInputs: { ...s.baselineInputs, [field]: value } })); get().queue.reset(); },
    todayMinutes: String(MONTH_TIME_ASSUMPTIONS.todayMinutes),
    setTodayMinutes: (todayMinutes) => { set({ todayMinutes }); get().queue.reset(); },
    pharmacyCorrections: immutable([]),
    recordPharmacyCorrection: (caseId, before, after, revision, options, sources) => {
      const s = get(), c = currentCase(caseId);
      if (sources) {
        if (options?.channel !== "eps") throw new Error("EPS correction requires the EPS channel.");
        validateEpsCorrection(caseId, sources, before, after, s.lifecycles, s.caseRevisions);
      } else {
        validatePrecheck(before, before.typedText, c.extracted.dispensingDate);
        validatePrecheck(after, after.typedText, c.extracted.dispensingDate);
      }
      if (!s.agentEnabled || before.status !== "missing" || after.status !== "ready" ||
        !sources && before.typedText === after.typedText || !before.checkedAt || !after.checkedAt ||
        Date.parse(after.checkedAt) < Date.parse(before.checkedAt) ||
        revision !== s.caseRevisions[caseId].at(-1)!.number + 1 ||
        !sources && (checkPharmacy(c, before.typedText, options).status !== "missing" || checkPharmacy(c, after.typedText, options).status !== "ready")) {
        throw new Error("A current human-applied correction with completed before and after checks is required.");
      }
      // A repeated ready render is the same caught item, not another correction.
      if (s.pharmacyCorrections.some((event) => event.caseId === caseId && event.revision === revision)) return;
      set({ pharmacyCorrections: immutable([...s.pharmacyCorrections, {
        caseId, pharmacyCode: s.lifecycles[caseId].pharmacyCode, at: new Date().toISOString(), revision, before, after,
        ...(sources ? { epsSources: sources } : {}),
      }]) });
    },
    recordDecision: ({ approvedDraft, ...input }) => decide(input, true, approvedDraft,
      input.decision === "REFER_BACK" || input.decision === "ACCEPT" && input.recommendation === "REFER_BACK" ? currentCase(input.caseId).scenario === "D" ? "RB2B" : "SYN-NCSO" : undefined),
    setAgentEnabled: (agentEnabled) => set((s) => ({ agentEnabled, queue: { ...s.queue, sweep: [], phase: -1, sweeping: false, playing: false } })),
    // Preserve all three replacement identities used by existing reset subscribers.
    resetDemo: () => {
      set((s) => ({ ...seededLifecycleSession(), itemProcesses: seededProcesses(), itemVerification: seededVerification(), operatorDrafts: {}, pharmacyDrafts: {}, demoStep: null, processInputs: processDraft(), manualLoopInputs: createManualLoopDraft(), followedCaseId: null, caseStates: initialStates(), records: seededRecords(), agentEnabled: false, baselineInputs: baselineDraft(BASELINE_DEFAULTS), todayMinutes: String(MONTH_TIME_ASSUMPTIONS.todayMinutes), pharmacyCorrections: immutable([]),
        pharmacy: { ...s.pharmacy, assumptions: { ...PHARMACY_ASSUMPTION_DEFAULTS }, receipts: [] },
        queue: { ...s.queue, position: 0, day: 0, playing: false, sweep: [], phase: -1, sweeping: false, revision: s.queue.revision + 1 },
      }));
    },
  };
});

/** Imperative convenience. React consumers memoise the pure helper on both slices. */
export function sessionCase(caseId: string) {
  const { lifecycles, caseRevisions, itemProcesses } = useAppStore.getState();
  return caseForLifecycle(caseId, lifecycles, caseRevisions, itemProcesses);
}

/** Read-only test observation; excludes presentation and action functions only. */
export function getDomainSnapshot() {
  const s = useAppStore.getState();
  return immutable({ lifecycles: s.lifecycles, caseRevisions: s.caseRevisions, itemProcesses: s.itemProcesses, records: s.records,
    itemVerification: s.itemVerification, operatorDrafts: s.operatorDrafts, pharmacyDrafts: s.pharmacyDrafts,
    caseStates: s.caseStates, processInputs: s.processInputs, manualLoopInputs: s.manualLoopInputs, baselineInputs: s.baselineInputs, todayMinutes: s.todayMinutes,
    pharmacyCorrections: s.pharmacyCorrections, pharmacy: { assumptions: s.pharmacy.assumptions, receipts: s.pharmacy.receipts } });
}

if (import.meta.env.VITE_E2E_STATE_OBSERVER === "true" && typeof window !== "undefined") {
  Object.defineProperty(window, "__BSA_READ_DOMAIN_STATE__", { value: getDomainSnapshot, writable: false, configurable: false });
}
