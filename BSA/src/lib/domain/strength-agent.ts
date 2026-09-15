import type { CasePack, Conflict, ExceptionCase, Recommendation, TraceStep } from "./types";
import { evaluateEpsStrength } from "./eps-strength";
import { EPS_ERROR_EVIDENCE, EPS_STRENGTH_COPY } from "./eps-error-evidence";
import { productByCode } from "./reference";
import { buildReferralNote } from "./referral-wording";
import { AGENT_VERSION } from "./tools";
import { immutable } from "./lifecycle-model";

/** Structured cross-record orchestration, not a fabricated monthly Tariff provision. */
export function runStrengthAgent(c: ExceptionCase, enabled: boolean): CasePack {
  const eps = c.epsPrescription;
  if (!eps?.supplyRecord) throw new Error("Strength assessment requires the independent pharmacy supply record.");
  const item = eps.items[0], selected = productByCode(item.dispensedCode);
  const assessment = enabled ? evaluateEpsStrength(eps) : null;
  const known = Boolean(assessment?.checks.slice(0, 4).every((entry) => entry.pass));
  const complete = assessment?.complete === true;
  const automatic = complete && !c.requiresHumanRecheck && !c.humanPricingConfirmed;
  const invoked = enabled && !automatic && !c.humanPricingConfirmed;
  const recommendation: Recommendation = !invoked ? "NONE" : !known ? "ABSTAIN" : complete ? "SUFFICIENT" : "REFER_BACK";
  const conflicts: Conflict[] = assessment && !complete ? [{
    field: "Selected product and strength",
    values: [
      { origin: "Prescription", value: assessment.prescribed?.name ?? "Unknown" },
      { origin: "Selected claim", value: assessment.selected?.name ?? "Unknown" },
      { origin: "Pharmacy supply record", value: assessment.supplied?.name ?? "Unknown" },
    ],
    material: true, note: assessment.gap,
  }] : [];
  const note = recommendation === "REFER_BACK" ? buildReferralNote([{ rule: "strength_matches_prescription" }]) : null;
  const checks = assessment ? [...assessment.checks] : [];
  const gate = recommendation === "NONE" || recommendation === "ABSTAIN" ? { result: "NOT_RUN" as const, checks: [] } : {
    result: "PASS" as const,
    checks: [
      { name: "Independent prescription and supply evidence available", pass: known, detail: "Source records agree independently of the selected claim." },
      { name: "Recommendation follows the cross-record findings", pass: recommendation === "SUFFICIENT" ? complete : !complete,
        detail: complete ? "All matching checks pass." : "The selected claim disagrees with the source records." },
      { name: "No pricing or disposition performed by advice", pass: true, detail: "A separate code route or human action controls the item." },
    ],
  };
  const evidence = [
    { id: "strength-prescribed", origin: "Prescription", field: "Prescribed product", value: `${item.product}, ${item.quantity}`,
      provenance: "Immutable submitted prescription fields", cls: "existing" as const },
    { id: "strength-selected", origin: "Submitted claim", field: "Selected product", value: `${item.dispensedName}, ${item.quantity}`,
      provenance: item.dispensedCode, cls: "existing" as const },
    { id: "strength-supplied", origin: "Pharmacy supply record", field: "Supplied product",
      value: `${productByCode(eps.supplyRecord.productCode)?.name ?? "Unknown"}, ${eps.supplyRecord.quantity}`,
      provenance: "Independent retained supply record", cls: "existing" as const },
    { id: "strength-guidance", origin: EPS_ERROR_EVIDENCE.nhsbsa.label, field: "Matching-check authority",
      value: EPS_STRENGTH_COPY.rule, provenance: EPS_ERROR_EVIDENCE.nhsbsa.url, cls: "existing" as const },
  ];
  const sourceSummary = assessment?.gap ?? "No proposed matching check performed.";
  const trace: TraceStep[] = !invoked ? [
    { phase: "PLAN", title: "Existing EPS processing", cls: "existing", summary: c.humanPricingConfirmed
      ? "Human review is complete; previous decisions remain recorded."
      : "Existing processing uses the selected endorsed pack.", items: [item.dispensedName], toolCalls: [], status: "ok" },
    { phase: "CHECK", title: automatic ? "Deterministic matching complete" : "Agent not invoked", cls: "deterministic",
      summary: automatic ? "Source matching complete; explicit submission remains separate." : "No new agent recommendation.",
      items: [], toolCalls: [], status: "ok" },
  ] : [
    { phase: "PLAN", title: "Compare separate EPS records", cls: "agent", summary: "Inspect prescription, claim selection and actual supply.",
      items: [EPS_STRENGTH_COPY.authorityLabel], toolCalls: [], status: "ok" },
    { phase: "GATHER", title: "Gather submitted and retained source facts", cls: "agent", summary: "The claim selection cannot corroborate itself.",
      items: evidence.map((entry) => `${entry.origin}: ${entry.value}`), toolCalls: [], status: known ? "ok" : "warn" },
    { phase: "ASSESS", title: "Identify product and strength", cls: "deterministic", summary: sourceSummary,
      items: checks.slice(0, 4).map((entry) => entry.detail), toolCalls: [], status: known ? "ok" : "fail" },
    { phase: "RETRIEVE", title: "Public guidance for the proposed matching check", cls: "agent",
      summary: EPS_STRENGTH_COPY.ruleLabel, items: [EPS_ERROR_EVIDENCE.nhsbsa.label, EPS_ERROR_EVIDENCE.nhsbsa.url, EPS_STRENGTH_COPY.rule],
      toolCalls: [], status: "ok" },
    { phase: "RECONCILE", title: "Reconcile source records with the claim", cls: "deterministic", summary: sourceSummary,
      items: conflicts.length ? conflicts.flatMap((conflict) => conflict.values.map((value) => `${value.origin}: ${value.value}`)) : ["All supplied records agree."],
      toolCalls: [], status: complete ? "ok" : "fail" },
    { phase: "ASSESS", title: "Structural evidence signals", cls: "deterministic", summary: "No image or repeated free-text readings apply to these structured records.",
      items: checks.map((entry) => `${entry.pass ? "Met" : "Not met"}: ${entry.name}`), toolCalls: [], status: known ? "ok" : "warn" },
    { phase: "CHECK", title: "Validate the proposed response", cls: "deterministic", summary: gate.result,
      items: gate.checks.map((entry) => entry.detail), toolCalls: [], status: known ? "ok" : "skipped" },
    { phase: recommendation === "ABSTAIN" ? "ABSTAIN" : "RECOMMEND", title: "Present findings, not an approval", cls: "agent",
      summary: note ?? (complete ? "Cross-record matching is complete." : "Source evidence is not established."),
      items: [], toolCalls: [], status: known ? "ok" : "warn" },
    { phase: "HAND_OFF", title: "A person decides", cls: "human", summary: "Advice has not changed the item or created a decision record.",
      items: [], toolCalls: [], status: "ok" },
  ];
  return immutable({
    caseId: c.id, ruleAuthority: "proposed_cross_record_check",
    tariffVersion: "not_applicable", tariffLabel: EPS_STRENGTH_COPY.ruleLabel, clause: null, citationValid: null,
    product: selected, concession: null, endorsementRequired: false, facts: null,
    requirementResults: assessment ? [{ requirement: { id: "selected_pack_matches", label: "Selected pack matches prescription and supply" }, met: complete }] : [],
    conflicts, evidence, signals: { provisionFound: false, provisionStatus: "not_applicable", readingStatus: "not_applicable",
      imageStatus: "not_applicable", sampleAgreement: { agree: 0, total: 0 },
      reconciliation: !enabled ? "not_applicable" : complete ? "agree" : known ? "conflict" : "not_established",
      imageQuality: 0, inCoverage: known },
    composite: { level: !enabled ? "low" : complete ? "high" : known ? "medium" : "abstain",
      reasons: [!enabled ? "Proposed matching check not run." : complete ? "Independent structured records agree." : sourceSummary] },
    recommendation, alternative: null, reasons: [sourceSummary], gate, draftToPharmacy: note,
    abstainReasons: recommendation === "ABSTAIN" ? [sourceSummary] : [], trace,
    state: c.humanPricingConfirmed ? "human_decision_recorded" : automatic ? "cleared_by_rules" :
      recommendation === "ABSTAIN" ? "agent_abstained" : "operator_review_required",
    agentVersion: AGENT_VERSION, agentInvoked: invoked, assemblySeconds: invoked ? 0.1 : 0,
  });
}
