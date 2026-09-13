import {
  complianceGate,
  compositeFrom,
  endorsementRequired,
  evaluateRequirements,
  mandatoryFieldsCheck,
  QUALITY_THRESHOLD,
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
import { capturedFields, compatibleCapture } from "./capture-evidence";
import { interpretPharmacyText } from "./pharmacy-check";
import { routeSubmission, routingFactsForCase } from "./routing";
import { EPS_SUPPLY_RULE, evaluateEpsSupply } from "./eps-check";
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

export function runAgent(original: ExceptionCase, opts: RunOptions = {}): CasePack {
  const captured = Boolean(original.capturedEvidence);
  const compatible = compatibleCapture(original);
  const c = captured ? { ...original, extracted: capturedFields(original) } : original;
  const trace: TraceStep[] = [];
  const evidence: EvidenceItem[] = [];
  const agentEnabled = opts.agentEnabled ?? true;
  const dateVersion = opts.tariffVersion ? null : versionForDate(c.extracted.dispensingDate);
  const supply = c.epsPrescription ? evaluateEpsSupply(c.epsPrescription) : null;
  const supplyRequired = c.extracted.productCode === EPS_SUPPLY_RULE.productCode || supply !== null;

  // ---- Tier 0: deterministic pre-checks (no model) ----
  const mandatory = mandatoryFieldsCheck(c.extracted);
  if (supplyRequired) mandatory.push({
    name: "Synthetic supply product and month validated",
    pass: Boolean(supply?.checks.filter((check) => check.id === "supply_product" || check.id === "supply_version").every((check) => check.met)),
    detail: supply ? supply.gap : "Required EPS supply source is unavailable",
  });
  const lookup = toolLookupProduct(c);
  const preVersion = opts.tariffVersion ? toolRetrieveTariff("NCSO", c.extracted.dispensingDate, opts.tariffVersion).version : dateVersion;
  const req = supplyRequired ? { required: true, reason: "The registered synthetic generic product requires manufacturer, pack size and form evidence." }
    : endorsementRequired(lookup.product, preVersion, c.claim.amountClaimed);
  const claim = toolLookupClaim(c);

  evidence.push(
    { id: "e-claim", origin: "Claim ledger", field: "Claimed", value: `qty ${c.claim.quantity}, £${c.claim.amountClaimed.toFixed(2)}, "${c.claim.endorsementText || "no endorsement"}"`, provenance: `${c.claim.submittedVia}, case ${c.id}`, cls: "existing" },
    { id: "e-fields", origin: "Existing capture", field: "Extracted", value: `${c.extracted.productText}, qty ${c.extracted.quantity ?? "?"}, endorsement "${c.extracted.endorsementText || "none"}"`, provenance: `Field confidence: product ${c.extracted.productConfidence.toFixed(2)}, quantity ${c.extracted.quantityConfidence.toFixed(2)}, endorsement ${c.extracted.endorsementConfidence.toFixed(2)}`, cls: "existing" },
  );
  if (original.paperDeclaration) {
    for (const field of ["typedProduct", "quantity", "endorsementText", "dispensingDate"] as const) evidence.push({
      id: `e-declared-${field}`, origin: "Pharmacy declaration", field,
      value: String(original.paperDeclaration[field] ?? "Not supplied") || "Not supplied",
      provenance: "declared by the pharmacy, not read from the form; original declaration retained", cls: "human",
    });
  }
  if (captured) {
    evidence[1] = { ...evidence[1], value: `${original.extracted.productText}, qty ${original.extracted.quantity ?? "?"}, endorsement "${original.extracted.endorsementText}"` };
    const origin = original.capturedEvidence!.provenance === "pharmacy_declaration" ? "Declared by the pharmacy, not read from the form" : "Human capture";
    for (const [field, value] of Object.entries(original.capturedEvidence!.fields)) evidence.push({
      id: `e-captured-${field}`, origin, field, value: String(value ?? "Not supplied"),
      provenance: `Human confirmation, revision ${original.capturedEvidence!.revision}; original image unchanged`, cls: "human",
    });
  }
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

  const cleared = Boolean(preVersion) && (!supplyRequired || supply?.complete === true) && !captured && routeSubmission(routingFactsForCase(c, c.channel === "Electronic (EPS)" ? "eps" : "paper")).outcome === "auto_priced" && mandatory.every((m) => m.pass);
  if (cleared || !agentEnabled) {
    const state: CaseState = cleared ? "cleared_by_rules" : c.initialState;
    trace.push({
      phase: "HAND_OFF",
      title: cleared ? "Cleared by rules; agent not invoked" : "Agent recommendations switched off; evidence only",
      cls: cleared ? "deterministic" : "human",
      summary: cleared
        ? "Priced by NHSBSA's existing rules engine; no person involved. Complete fields follow normal pricing. No model was called."
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
      reasons: [cleared ? supplyRequired ? "Required supply evidence complete; mandatory fields present." : "No endorsement required; mandatory fields present." : "Agent disabled."],
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
  const eps = c.channel === "Electronic (EPS)";
  const region = eps ? null : toolReadImageRegion(original, "endorsement");
  const itemRegion = eps ? null : toolReadImageRegion(original, "item");
  const history = toolCheckHistory(c);
  if (region) evidence.push(
    { id: "e-region", origin: "Form image", field: "Endorsement margin", value: `"${region.text || "unreadable"}"`, provenance: `Region located by layout model; read confidence ${region.confidence.toFixed(2)}`, cls: "existing" },
  );
  evidence.push(
    { id: "e-history", origin: "Case history", field: "Contractor history", value: `${history.history.referralsLast90Days} referrals in 90 days`, provenance: history.history.lastReasons.join("; ") || "No recent referrals", cls: "existing" },
  );
  trace.push({
    phase: "GATHER",
    title: "Gather evidence from source systems",
    cls: "agent",
    summary: eps ? "Read the typed EPS claim and recorded supply fields. There is no image or Type 1 capture."
      : c.imageQuality < QUALITY_THRESHOLD
      ? "Image cannot be read. Raw uncertain readings remain visible; any human-confirmed declaration is separate evidence, not improved image recognition."
      : "Read-only tool calls, chosen from the plan. Every finding carries its source. A failed or low-confidence read is recorded, not papered over.",
    items: [
      ...(region && itemRegion ? [
        `Endorsement margin read: "${region.text || "unreadable"}" (confidence ${region.confidence.toFixed(2)})`,
        `Item line read: "${itemRegion.text}" (confidence ${itemRegion.confidence.toFixed(2)})`,
      ] : [`EPS endorsement: "${c.extracted.endorsementText}"`, ...(supply?.checks.map((check) => `${check.met ? "Met" : "Missing"}: ${check.label}`) ?? [])]),
      `Contractor history: ${history.call.outputSummary}`,
    ],
    toolCalls: [...(region && itemRegion ? [region.call, itemRegion.call] : []), history.call],
    status: region && region.confidence < 0.6 ? "warn" : "ok",
  });

  // ---- ASSESS part 1: three independent readings of the free text (MOCKED interpretation) ----
  const agreement = sampleAgreement(c.readings);
  const facts: EndorsementFacts | null = supplyRequired ? {
    type: "SUPPLY", present: supply !== null, initialled: null, dated: null,
    quotedText: c.extracted.endorsementText, note: "Synthetic typed supply fields, not an image reading",
  } : captured ? interpretPharmacyText(c.extracted.endorsementText) : agreement.agree >= 2 ? agreement.consensus : null;
  const endorsementType = supplyRequired ? "SUPPLY" : captured ? facts!.type : requiredTypeFromReadings(c.readings);

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
  const conflicts = reconcile(c.extracted, c.claim.quantity, c.claim.productCode, c.claim.amountClaimed, lookup.product, concession?.price ?? null)
    .map((conflict) => captured ? { ...conflict, values: conflict.values.map((value) => value.origin === "Form image (capture)"
      ? { ...value, origin: "Human-confirmed fields, not an image reading" } : value) } : conflict);
  const comparableFieldsKnown = Boolean(lookup.product && c.extracted.productCode &&
    c.extracted.quantity !== null && Number.isSafeInteger(c.extracted.quantity) && c.extracted.quantity > 0 &&
    (captured ? compatible : c.imageQuality >= QUALITY_THRESHOLD &&
      c.extracted.productConfidence >= QUALITY_THRESHOLD && c.extracted.quantityConfidence >= QUALITY_THRESHOLD));
  const reconciliation: Signals["reconciliation"] = conflicts.some((k) => k.material)
    ? "conflict" : comparableFieldsKnown ? "agree" : "not_established";
  trace.push({
    phase: "RECONCILE",
    title: "Compare what the sources say",
    cls: "agent",
    summary: reconciliation === "conflict"
      ? `${conflicts.length} disagreement${conflicts.length === 1 ? "" : "s"} found. The agent flags each with both values and does not choose between them.`
      : reconciliation === "not_established"
        ? "Reconciliation not established. Missing, unreadable or unconfirmed fields cannot establish agreement."
        : captured ? "Human-confirmed fields match the claim. Image agreement remains unknown; the declaration was not read from the form."
          : "Comparable fields agree. This does not establish agreement for missing or unreadable evidence.",
    items: reconciliation === "conflict"
      ? conflicts.map((k) => `${k.field}: ${k.values.map((v) => `${v.origin} says ${v.value}`).join("; ")}`)
      : reconciliation === "not_established"
        ? ["Product and quantity comparison requires known fields and trustworthy capture.", "No detected conflict is not evidence of agreement."]
        : [`Product ${c.extracted.productCode} = claim ${c.claim.productCode}`, `Quantity ${c.extracted.quantity} = claim ${c.claim.quantity}`,
          ...(concession ? [`Amount £${c.claim.amountClaimed.toFixed(2)} = concession £${concession.price.toFixed(2)}`] : ["No concession amount comparison established."]),
          ...(captured ? ["Human-confirmed capture is separate from the unchanged original image."] : [])],
    toolCalls: [],
    status: reconciliation === "agree" ? "ok" : "warn",
  });

  // ---- ASSESS part 2: requirements against facts (deterministic) ----
  const requirementResults = evaluateRequirements(clause, facts, c.extracted, supply?.checks);
  const citationValid = validateCitation(clause, version, clause?.text.slice(0, 40) ?? "");
  trace.push({
    phase: "ASSESS",
    title: "Interpret the note and test it against the rule",
    cls: "agent",
    summary: captured ? "Requirements checked against human-confirmed fields. Original image readings remain uncertain; the proposed declaration path does not improve image confidence." : `Three scripted readings: ${agreement.agree} of ${agreement.total} agree. Requirement checks use code, not model judgement.`,
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
    reconciliation,
    imageQuality: c.imageQuality,
    inCoverage: c.inCoverage,
  };
  const composite = supplyRequired
    ? !eps || !supply || !clause || reconciliation === "not_established"
      ? { level: "abstain" as const, reasons: ["Registered generic supply source, dated provision or comparable fields are unavailable."] }
      : { level: "low" as const, reasons: ["Typed EPS supply fields checked directly. Handwriting readings and image confidence do not apply."] }
    : captured
    ? !compatible || !clause || reconciliation !== "agree" || !mandatory.every((check) => check.pass) || requirementResults.some((check) => check.met === null)
      ? { level: "abstain" as const, reasons: [
        "Human-confirmed fields remain unknown, conflicting or unreconciled, or no provision was retrieved.",
        ...mandatory.filter((check) => !check.pass).map((check) => `Missing evidence: ${check.name}`),
      ] }
      : { level: "low" as const, reasons: [
        "Proposed human-confirmed evidence path, not validated image recognition. Original poor-image confidence and readings are unchanged.",
        ...compositeFrom(signals).reasons,
      ] }
    : compositeFrom(signals);

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
      draft = supplyRequired ? `Please supply: ${missing.join("; ")}. Resubmit the corrected synthetic claim.`
        : "Please add the date beside the initials and resubmit. No other correction is needed for this synthetic endorsement.";
    } else {
      recommendation = "SUFFICIENT";
      reasons.push(clause ? "Every retrieved endorsement requirement is met." : "No endorsement was required for this item.");
      reasons.push(captured ? "Human-confirmed declaration and claim match. Image agreement is unknown; a person still makes the Type 2 decision."
        : "Comparable fields agree; missing or unreadable evidence is not established by this comparison.");
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
