import {
  complianceGate,
  compositeFrom,
  endorsementRequired,
  evaluateRequirements,
  mandatoryFieldsCheck,
  reconcile,
  sampleAgreement,
  validateCitation,
} from "./rules";
import {
  AGENT_VERSION,
  toolCheckHistory,
  toolLookupClaim,
  toolLookupProduct,
  toolReadImageRegion,
  toolRetrieveTariff,
} from "./tools";
import { versionForDate } from "./tariff";
import type {
  CasePack,
  CaseState,
  EndorsementFacts,
  EndorsementType,
  EvidenceItem,
  ExceptionCase,
  Recommendation,
  Signals,
  TraceStep,
} from "./types";

// The orchestration. In the prototype it runs entirely offline and
// deterministically, so the demonstration cannot fail live. The one step that
// would call a model in production (reading the free-text endorsement into
// structured facts) is MOCKED with three scripted readings per case, and the
// interface says so wherever the result appears.
//
// The agent gathers evidence and recommends. Deterministic code validates and
// calculates. A human decides.

export interface RunOptions {
  tariffVersion?: string;
  agentEnabled?: boolean;
}

function requiredTypeFromReadings(readings: EndorsementFacts[]): EndorsementType {
  const { agree, consensus } = sampleAgreement(readings);
  // No consensus on what the note even is means no provision can be chosen for it.
  return agree >= 2 && consensus ? consensus.type : "UNKNOWN";
}

export function runAgent(c: ExceptionCase, opts: RunOptions = {}): CasePack {
  const trace: TraceStep[] = [];
  const evidence: EvidenceItem[] = [];
  const agentEnabled = opts.agentEnabled ?? true;
  const dateVersion = opts.tariffVersion ? null : versionForDate(c.extracted.dispensingDate);

  // ---- Tier 0: deterministic pre-checks (no model) ----
  const mandatory = mandatoryFieldsCheck(c.extracted);
  const lookup = toolLookupProduct(c);
  const preVersion = opts.tariffVersion ? toolRetrieveTariff("NCSO", c.extracted.dispensingDate, opts.tariffVersion).version : dateVersion;
  const req = endorsementRequired(lookup.product, preVersion, c.claim.amountClaimed);
  const claim = toolLookupClaim(c);

  evidence.push(
    { id: "e-claim", origin: "Claim ledger", field: "Claimed", value: `qty ${c.claim.quantity}, £${c.claim.amountClaimed.toFixed(2)}, "${c.claim.endorsementText || "no endorsement"}"`, provenance: `${c.claim.submittedVia}, case ${c.id}`, cls: "existing" },
    { id: "e-fields", origin: "Existing capture", field: "Extracted", value: `${c.extracted.productText}, qty ${c.extracted.quantity ?? "?"}, endorsement "${c.extracted.endorsementText || "none"}"`, provenance: `Field confidence: product ${c.extracted.productConfidence.toFixed(2)}, quantity ${c.extracted.quantityConfidence.toFixed(2)}, endorsement ${c.extracted.endorsementConfidence.toFixed(2)}`, cls: "existing" },
  );
  if (lookup.product) {
    evidence.push({ id: "e-product", origin: "Product master data", field: "Product", value: `${lookup.product.name}, pack ${lookup.product.packSize}, basic price £${lookup.product.basicPrice.toFixed(2)}`, provenance: `code ${lookup.product.code}`, cls: "deterministic" });
  }

  trace.push({
    phase: "PLAN",
    title: "Deterministic pre-checks",
    cls: "deterministic",
    summary: req.reason,
    items: mandatory.map((m) => `${m.pass ? "Pass" : "Fail"}: ${m.name} (${m.detail})`),
    toolCalls: [lookup.call, claim.call],
    status: mandatory.every((m) => m.pass) ? "ok" : "warn",
  });

  const cleared = req.required === false && !c.extracted.endorsementText && mandatory.every((m) => m.pass);
  if (cleared || !agentEnabled) {
    const state: CaseState = cleared ? "cleared_by_rules" : c.initialState;
    trace.push({
      phase: "HAND_OFF",
      title: cleared ? "Cleared by rules; agent not invoked" : "Agent recommendations switched off; evidence only",
      cls: cleared ? "deterministic" : "human",
      summary: cleared
        ? "No endorsement is required and every mandatory field is present. The item proceeds to existing deterministic pricing. No model was called."
        : "The feature flag is off. The operator works the item exactly as today, with the gathered evidence attached.",
      items: [],
      toolCalls: [],
      status: "ok",
    });
    return {
      caseId: c.id,
      tariffVersion: preVersion?.version ?? "n/a",
      tariffLabel: preVersion?.label ?? "n/a",
      clause: null,
      citationValid: null,
      product: lookup.product,
      concession: null,
      endorsementRequired: req.required,
      facts: null,
      requirementResults: [],
      conflicts: [],
      evidence,
      signals: { provisionFound: false, sampleAgreement: { agree: 0, total: 0 }, reconciliation: "not_applicable", imageQuality: c.imageQuality, inCoverage: c.inCoverage },
      composite: { level: "high", reasons: [cleared ? "Deterministic clearance; no judgement needed" : "Agent not run"] },
      recommendation: "NONE",
      alternative: null,
      reasons: [cleared ? "No endorsement required; mandatory fields present." : "Agent disabled."],
      gate: { result: "NOT_RUN", checks: [] },
      draftToPharmacy: null,
      abstainReasons: [],
      trace,
      state,
      agentVersion: AGENT_VERSION,
      agentInvoked: false,
      assemblySeconds: 2,
    };
  }

  // ---- PLAN (agentic): what does this item need answered? ----
  const questions = [
    "Was an endorsement required for this product in the month of dispensing?",
    "Was an endorsement given, and what does it claim?",
    "Does the endorsement satisfy the provision in force on the dispensing date?",
    "Do the form, the extracted fields and the claim agree?",
  ];
  trace.push({
    phase: "PLAN",
    title: "Plan the unknowns for this item",
    cls: "agent",
    summary: `Routing reason: ${c.routingReason}. Plan questions and read-only evidence lookups.`,
    items: questions,
    toolCalls: [],
    status: "ok",
  });

  // ---- GATHER (agentic orchestration over read-only tools) ----
  const region = toolReadImageRegion(c, "endorsement");
  const itemRegion = toolReadImageRegion(c, "item");
  const history = toolCheckHistory(c);
  evidence.push(
    { id: "e-region", origin: "Form image", field: "Endorsement margin", value: `"${region.text || "unreadable"}"`, provenance: `Region located by layout model; read confidence ${region.confidence.toFixed(2)}`, cls: "existing" },
    { id: "e-history", origin: "Case history", field: "Contractor history", value: `${history.history.referralsLast90Days} referrals in 90 days`, provenance: history.history.lastReasons.join("; ") || "No recent referrals", cls: "existing" },
  );
  trace.push({
    phase: "GATHER",
    title: "Gather evidence from source systems",
    cls: "agent",
    summary: "Read-only tool calls, chosen from the plan. Every finding carries its source. A failed or low-confidence read is recorded, not papered over.",
    items: [
      `Endorsement margin read: "${region.text || "unreadable"}" (confidence ${region.confidence.toFixed(2)})`,
      `Item line read: "${itemRegion.text}" (confidence ${itemRegion.confidence.toFixed(2)})`,
      `Contractor history: ${history.call.outputSummary}`,
    ],
    toolCalls: [region.call, itemRegion.call, history.call],
    status: region.confidence < 0.6 ? "warn" : "ok",
  });

  // ---- ASSESS part 1: three independent readings of the free text (MOCKED interpretation) ----
  const agreement = sampleAgreement(c.readings);
  const facts = agreement.agree >= 2 ? agreement.consensus : null;
  const endorsementType = requiredTypeFromReadings(c.readings);

  // ---- RETRIEVE (agentic: which provision, for which date) ----
  const retrieval = toolRetrieveTariff(endorsementType, c.extracted.dispensingDate, opts.tariffVersion);
  const version = retrieval.version;
  const clause = retrieval.clause;
  const concession = version && lookup.product ? version.concessions.find((k) => k.productCode === lookup.product?.code) ?? null : null;
  if (clause && version) {
    evidence.push({ id: "e-rule", origin: "Drug Tariff (versioned corpus)", field: `${clause.part}, ${clause.title}`, value: `"${clause.text}"`, provenance: `${version.label} (effective ${version.effectiveFrom} to ${version.effectiveTo})`, cls: "agent" });
  }
  if (concession) {
    evidence.push({ id: "e-concession", origin: "Drug Tariff (versioned corpus)", field: "Concession price", value: `£${concession.price.toFixed(2)} for ${version?.label}`, provenance: `Product ${concession.productCode}`, cls: "deterministic" });
  }
  trace.push({
    phase: "RETRIEVE",
    title: "Retrieve the governing provision for the dispensing date",
    cls: "agent",
    summary: clause && version
      ? `${version.label} was in force on ${c.extracted.dispensingDate}. ${clause.title} governs an ${clause.endorsementType} endorsement.`
      : `No provision retrieved for "${endorsementType}" on ${c.extracted.dispensingDate}. No citation from memory; abstention required.`,
    items: clause ? [`Requirements: ${clause.requirements.map((r) => r.label).join("; ")}`, `Quoted: "${clause.text}"`] : ["Retrieval returned nothing usable"],
    toolCalls: [retrieval.call],
    status: clause ? "ok" : "fail",
  });

  // ---- RECONCILE (agentic; surfaces, never resolves) ----
  const conflicts = reconcile(c.extracted, c.claim.quantity, c.claim.productCode, c.claim.amountClaimed, lookup.product, concession?.price ?? null);
  trace.push({
    phase: "RECONCILE",
    title: "Compare what the sources say",
    cls: "agent",
    summary: conflicts.length === 0
      ? "Form image, extracted fields, claim and product data agree on product, quantity and amount."
      : `${conflicts.length} disagreement${conflicts.length === 1 ? "" : "s"} found. The agent flags each with both values and does not choose between them.`,
    items: conflicts.length === 0
      ? [`Quantity ${c.extracted.quantity ?? "?"} = claim ${c.claim.quantity}`, `Amount £${c.claim.amountClaimed.toFixed(2)}${concession ? ` = concession £${concession.price.toFixed(2)}` : ""}`]
      : conflicts.map((k) => `${k.field}: ${k.values.map((v) => `${v.origin} says ${v.value}`).join("; ")}`),
    toolCalls: [],
    status: conflicts.length === 0 ? "ok" : "warn",
  });

  // ---- ASSESS part 2: requirements against facts (deterministic) ----
  const requirementResults = evaluateRequirements(clause, facts, c.extracted);
  const citationValid = validateCitation(clause, version, clause?.text.slice(0, 40) ?? "");
  trace.push({
    phase: "ASSESS",
    title: "Interpret the note and test it against the rule",
    cls: "agent",
    summary: `Three scripted readings: ${agreement.agree} of ${agreement.total} agree. Requirement checks use code, not model judgement.`,
    items: [
      ...c.readings.map((r, i) => `Reading ${i + 1}: ${r.note} [${r.type}${r.initialled === null ? "" : r.initialled ? ", initialled" : ", not initialled"}${r.dated === null ? "" : r.dated ? ", dated" : ", not dated"}]`),
      ...requirementResults.map((r) => `${r.met === true ? "Met" : r.met === false ? "Not met" : "Unknown"}: ${r.requirement.label}`),
    ],
    toolCalls: [
      { tool: "run_endorsement_checks", productionService: "Azure Functions (pure functions)", cls: "deterministic", input: { clause: clause?.id ?? null, readings: c.readings.length }, outputSummary: `${requirementResults.filter((r) => r.met).length} of ${requirementResults.length} requirements met`, sourceLabel: "Deterministic code", durationMs: 12, status: "ok" },
      { tool: "validate_citation", productionService: "Azure Functions", cls: "deterministic", input: { clauseId: clause?.id ?? null, version: version?.version ?? null }, outputSummary: citationValid === null ? "Nothing to validate" : citationValid ? "Citation resolves to the corpus" : "Citation does not resolve", sourceLabel: "Deterministic code", durationMs: 8, status: citationValid === false ? "fail" : "ok" },
    ],
    status: agreement.agree >= 2 ? "ok" : "warn",
  });

  // ---- Confidence composite (deterministic) ----
  const signals: Signals = {
    provisionFound: Boolean(clause),
    sampleAgreement: { agree: agreement.agree, total: agreement.total },
    reconciliation: conflicts.some((k) => k.material) ? "conflict" : "agree",
    imageQuality: c.imageQuality,
    inCoverage: c.inCoverage,
  };
  const composite = compositeFrom(signals);

  // ---- Recommend or abstain ----
  let recommendation: Recommendation;
  const reasons: string[] = [];
  let alternative: CasePack["alternative"] = null;
  let draft: string | null = null;
  const abstainReasons: string[] = [];

  if (composite.level === "abstain") {
    recommendation = "ABSTAIN";
    abstainReasons.push(...composite.reasons);
    trace.push({
      phase: "ABSTAIN",
      title: "Abstain: the evidence does not support a recommendation",
      cls: "agent",
      summary: "Failed signals require abstention, not guessing. Evidence passes to a human; payments and case outcomes remain unchanged.",
      items: abstainReasons,
      toolCalls: [],
      status: "fail",
    });
  } else {
    const anyUnmet = requirementResults.some((r) => r.met === false);
    const materialConflict = conflicts.some((k) => k.material);
    if (materialConflict) {
      recommendation = "REQUEST_INFORMATION";
      reasons.push("Sources disagree on a material field; the operator should confirm the quantity dispensed before any outcome.");
      if (!anyUnmet && clause) reasons.push(`The endorsement itself satisfies ${clause.title}.`);
      alternative = { outcome: "REFER_BACK", note: "Refer back only if existing evidence cannot confirm quantity; the endorsement itself is complete." };
      draft = `The form shows quantity ${c.extracted.quantity}; the claim states ${c.claim.quantity}. Please confirm the quantity supplied for this item.`;
    } else if (anyUnmet && clause) {
      recommendation = "REFER_BACK";
      const missing = requirementResults.filter((r) => r.met === false).map((r) => r.requirement.label.toLowerCase());
      reasons.push("The endorsement does not meet every retrieved requirement. Review the checks and missing information.");
      reasons.push(`Missing: ${missing.join("; ")}.`);
      alternative = { outcome: "SUFFICIENT", note: "Not permitted: the gate blocks SUFFICIENT while a requirement of the clause is unmet." };
      draft = "Please add the date beside the initials and resubmit. No other correction is needed for this synthetic endorsement.";
    } else {
      recommendation = "SUFFICIENT";
      reasons.push(clause ? "Every retrieved endorsement requirement is met." : "No endorsement was required for this item.");
      reasons.push("Sources agree on product, quantity and amount.");
      alternative = { outcome: "REFER_BACK", note: "Would delay payment by a cycle with no rule requiring it." };
    }
    trace.push({
      phase: "RECOMMEND",
      title: `Recommend: ${recommendation.replace("_", " ").toLowerCase()}`,
      cls: "agent",
      summary: "Review the recommendation, requirement checks and any unresolved conflicts. A human decides.",
      items: draft ? [`Draft to pharmacy: "${draft}"`] : [],
      toolCalls: [],
      status: "ok",
    });
  }

  // ---- CHECK: compliance gate (deterministic) ----
  const gate = complianceGate(recommendation, requirementResults, conflicts, mandatory, req.required, citationValid);
  // Enforce withholding once, before any consumer receives the case pack.
  // Keep evidence and gate checks, but never return rejected advice or drafts.
  if (gate.result === "FAIL") {
    recommendation = "NONE";
    alternative = null;
    draft = null;
    reasons.splice(0, reasons.length, "Recommendation withheld by the compliance gate; evidence only.");
    for (const step of trace) {
      if (step.phase === "RECOMMEND") {
        step.title = "Proposal withheld by the compliance gate";
        step.summary = "The rejected outcome, reasons, alternative and pharmacy draft are withheld. Review the evidence and failed checks instead.";
        step.items = [];
        step.status = "fail";
      }
    }
  }
  trace.push({
    phase: "CHECK",
    title: "Compliance gate (code the model cannot influence)",
    cls: "deterministic",
    summary: gate.result === "PASS" ? "The recommended outcome is one the rules permit. It may be shown to the operator." : gate.result === "FAIL" ? "The recommendation is withheld. The operator sees the evidence only." : "No recommendation to check.",
    items: gate.checks.map((k) => `${k.pass ? "Pass" : "Fail"}: ${k.name}. ${k.detail}`),
    toolCalls: [],
    status: gate.result === "FAIL" ? "fail" : "ok",
  });

  // ---- HAND OFF ----
  const state: CaseState =
    recommendation === "ABSTAIN" ? "agent_abstained"
      : recommendation === "REQUEST_INFORMATION" ? "additional_evidence_required"
        : recommendation === "SUFFICIENT" && gate.result === "PASS" ? "agent_review_complete"
          : "operator_review_required";
  trace.push({
    phase: "HAND_OFF",
    title: "Present the complete case to the operator",
    cls: "human",
    summary: gate.result === "FAIL"
      ? "Evidence and failed checks remain available. Recommendation, alternative and draft are withheld. A human decision with a reason is required."
      : "Review evidence, rule, conflicts, signals and gate checks. Accept, amend, request information, refer back or escalate; the human decides.",
    items: [`Decision record prepared (append-only). Pinned: Tariff ${version?.version ?? "n/a"}, agent ${AGENT_VERSION}`],
    toolCalls: [{ tool: "write_decision_record", productionService: "Azure Cosmos DB (append-only)", cls: "deterministic", input: { caseId: c.id }, outputSummary: "Case pack appended; awaiting human decision", sourceLabel: "In-memory record", durationMs: 15, status: "ok" }],
    status: "ok",
  });

  const totalMs = trace.reduce((s, t) => s + t.toolCalls.reduce((a, k) => a + k.durationMs, 0), 0);
  return {
    caseId: c.id,
    tariffVersion: version?.version ?? "n/a",
    tariffLabel: version?.label ?? "not found",
    clause,
    citationValid,
    product: lookup.product,
    concession,
    endorsementRequired: req.required,
    facts,
    requirementResults,
    conflicts,
    evidence,
    signals,
    composite,
    recommendation,
    alternative,
    reasons,
    gate,
    draftToPharmacy: gate.result === "PASS" ? draft : null,
    abstainReasons,
    trace,
    state: gate.result === "FAIL" && recommendation !== "ABSTAIN" ? "operator_review_required" : state,
    agentVersion: AGENT_VERSION,
    agentInvoked: true,
    assemblySeconds: Math.round(totalMs / 1000 * 10) / 10 + 34, // synthetic: adds mocked model latency
  };
}
