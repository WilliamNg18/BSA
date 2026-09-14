import type { BoundaryClass } from "./types";

// Reference-page content. Rehearsal and discussion material lives in
// docs/demo-script.md; nothing here claims NHSBSA's real performance.

export type EvidenceClass =
  | "Publicly supported"
  | "Reasoned assumption"
  | "Synthetic demonstration"
  | "Proposed design decision"
  | "Requires customer validation";

export interface Assumption {
  id: number;
  statement: string;
  why: string;
  evidence: string;
  basis: "Public" | "Experience" | "Public and experience";
  validate: string;
  ifWrong: string;
  effect: "Kills" | "Reshapes" | "Intact";
}

export const ASSUMPTIONS: Assumption[] = [
  { id: 1, statement: "Repeatable exception causes", why: "Concentrated causes could support a bounded intervention; referral totals alone do not establish repeatability.", evidence: "Cause concentration: unmeasured", basis: "Public and experience", validate: "Analyse two years of item-level reason codes and top-five share.", ifWrong: "Stop if no repeatable pattern.", effect: "Kills" },
  { id: 2, statement: "Material evidence-assembly effort", why: "Measure assembly separately from judgement before estimating benefit.", evidence: "Operator timing: unavailable", basis: "Experience", validate: "Observe operators for a day; compare deterministic prefetching.", ifWrong: "Prefer a simpler screen or narrower audit benefit.", effect: "Reshapes" },
  { id: 3, statement: "Evidence across systems", why: "Separate records may require reconciliation; actual system boundaries remain unknown.", evidence: "Image, product, claim, history access: unvalidated", basis: "Experience", validate: "Inspect current screens and read access.", ifWrong: "Use a simpler lookup.", effect: "Reshapes" },
  { id: 4, statement: "Interpretation beyond deterministic rules", why: "Monthly publication does not prove monthly rule changes or model necessity.", evidence: "Change frequency and operator agreement: unmeasured", basis: "Public and experience", validate: "Review fifty exceptions and twelve months of relevant changes.", ifWrong: "Encode stable requirements instead.", effect: "Kills" },
  { id: 5, statement: "Usable historical decisions", why: "Evaluate against adjudicated evidence, not model agreement with itself.", evidence: "Retention, labels and reasons: unvalidated", basis: "Experience", validate: "Inspect item-level history and adjudication quality.", ifWrong: "Label from scratch; reassess feasibility.", effect: "Intact" },
  { id: 6, statement: "Workflow integration", why: "An additional screen may increase adoption costs.", evidence: "Queue extension points: unknown", basis: "Experience", validate: "Review access, workflow and extension options.", ifWrong: "Test an adjacent screen and its adoption cost.", effect: "Reshapes" },
  { id: 7, statement: "Independent operator-side value", why: "Operator assistance must justify itself without assuming pharmacy adoption.", evidence: "Handling, consistency and audit benefits: hypotheses", basis: "Experience", validate: "Compare operator-side results against timed baselines.", ifWrong: "Reshape scope and economics.", effect: "Reshapes" },
  { id: 8, statement: "Optional pharmacy integration", why: "Existing pre-submission checks, suitable channels and supplier access remain unknown.", evidence: "Integration and adoption: unvalidated", basis: "Experience", validate: "Confirm amendment windows, channels and existing checks.", ifWrong: "Defer pharmacy integration; evaluate operator scope separately.", effect: "Intact" },
];

export interface BoundaryRow {
  action: string;
  cls: BoundaryClass;
  why: string;
}

export const BOUNDARY_ROWS: BoundaryRow[] = [
  { action: "Scan the form; read fields; extract product, quantity, endorsement text", cls: "existing", why: "Solved. Consumed read-only; a second capture path would duplicate cost." },
  { action: "Price straightforward items; route exceptions to an operator", cls: "existing", why: "Published NHSBSA capability. Untouched." },
  { action: "Is an endorsement required for this product in this month?", cls: "deterministic", why: "A lookup against product data and the concession list. No judgement." },
  { action: "Are mandatory fields present? Is the read above the quality threshold?", cls: "deterministic", why: "Explicit rules and thresholds; unit-tested." },
  { action: "Which questions does this item need answered?", cls: "agent", why: "Depends on the routing reason and what the first reads return; goal-directed planning." },
  { action: "Which tools to call, in what order, and what to do when one returns nothing", cls: "agent", why: "Adapting the next action to returned evidence is the agentic step." },
  { action: "Retrieve the clause in force on the dispensing date", cls: "agent", why: "Version selection is date-driven code; deciding which provision governs a free-text note is interpretation." },
  { action: "Read the free-text endorsement into structured facts (type, initialled, dated)", cls: "agent", why: "Language in, structure out. Three independent readings; agreement measured. Mocked in the prototype." },
  { action: "Test the structured facts against the clause's requirements", cls: "deterministic", why: "Once the facts are structured, the check is a table lookup." },
  { action: "Compare form, extraction, claim and product data; flag disagreement", cls: "agent", why: "Deciding what disagreement is material and how to present it; never resolves it." },
  { action: "Form a recommendation and its alternative; explain the gap to the pharmacy", cls: "agent", why: "Grounded generation from the decision record only." },
  { action: "Validate that the citation exists in the corpus for the version in force", cls: "deterministic", why: "String and version match. The model cannot cite from memory." },
  { action: "Compliance gate: is the recommended outcome permitted by the rule?", cls: "deterministic", why: "Pure code the model cannot call or alter. FAIL withholds the recommendation." },
  { action: "Confidence composite from five structural signals; abstain below threshold", cls: "deterministic", why: "Never self-reported by the model." },
  { action: "Calculate any payment amount", cls: "deterministic", why: "Existing NHSBSA pricing. Never a model, never this prototype." },
  { action: "Accept, amend, request information, refer back or escalate; give a reason", cls: "human", why: "The consequential decision, with the override reason as the most valuable data collected." },
  { action: "Approve payment", cls: "human", why: "Outside the agent and outside this prototype." },
];

export interface DeliveryStep {
  step: number;
  title: string;
  detail: string;
  weeks: string;
}

export const DELIVERY_SEQUENCE: DeliveryStep[] = [
  { step: 1, title: "Start with synthetic data and one exception pattern", detail: "This prototype. NCSO endorsements only; nothing touches a live system.", weeks: "Done" },
  { step: 2, title: "Validate the concentration of exception reasons", detail: "Two years of referral codes at item level. Long tail means stop.", weeks: "Weeks 1 to 2" },
  { step: 3, title: "Establish operator agreement and baseline handling effort", detail: "Fifty items, two operators, blind; a day of timing split between locating evidence and judging.", weeks: "Weeks 1 to 2" },
  { step: 4, title: "Build a golden evaluation set", detail: "Around 200 adjudicated cases, stratified by category and print versus handwriting, labels agreed with operators, harness in CI.", weeks: "Weeks 3 to 4" },
  { step: 5, title: "Run the agent in shadow mode", detail: "Recommendations generated on the live exception stream with zero influence on outcomes.", weeks: "Weeks 7 to 10" },
  { step: 6, title: "Compare its recommendations with human decisions", detail: "Agreement against the inter-operator ceiling, per exception category and per print or handwritten slice.", weeks: "Weeks 7 to 10" },
  { step: 7, title: "Measure evidence quality, calibration, abstention, overrides, handling time and cost", detail: "Groundedness must be 100 per cent; calibration error within an agreed bound; abstention honest; cost per case within budget.", weeks: "Weeks 7 to 10" },
  { step: 8, title: "Move to operator-assisted mode only when guardrails are met", detail: "Volunteer operators; payment-accuracy measures in the definition of done; override rate above a floor.", weeks: "Weeks 11 to 13" },
  { step: 9, title: "Scale, reshape or stop based on evidence", detail: "A documented decision and the next exception pattern, or a documented stop.", weeks: "Week 14" },
];

export interface ArchRow {
  component: string;
  prototype: string;
  production: string;
  owns: string;
  built: "Built for real" | "Mocked" | "Not built";
}

export const ARCHITECTURE: ArchRow[] = [
  { component: "Scanning, capture, field extraction", prototype: "Pre-annotated regions on synthetic forms", production: "NHSBSA's existing scanners and capture; document layout analysis only where region provenance is needed", owns: "Existing estate", built: "Mocked" },
  { component: "Exception event ingress", prototype: "In-memory case list", production: "Queue-based event ingress from the existing routing", owns: "Topics, subscriptions, dead-letter policy", built: "Mocked" },
  { component: "Deterministic pre-checks, requirement checks, gate, composite, citation check", prototype: "Typed pure functions (rules.ts), reusable checked foundations", production: "Unit-tested serverless deterministic functions", owns: "The functions and their tests", built: "Built for real" },
  { component: "Agent orchestration (plan, gather, retrieve, reconcile, assess, recommend, abstain)", prototype: "Deterministic orchestration in agent.ts with an inspectable trace", production: "Governed orchestration runtime with tracing and tool governance", owns: "Agent definitions and tool contracts", built: "Built for real" },
  { component: "Interpretation of the free-text endorsement", prototype: "Three scripted readings per case (mocked)", production: "Constrained hosted model endpoint: structured JSON output, schema-validated, three samples, may cite only retrieved passages", owns: "Prompts, schemas, evaluation results", built: "Mocked" },
  { component: "Versioned Drug Tariff retrieval", prototype: "Local synthetic corpus, three monthly versions, date filter", production: "Vector and keyword search with effective-date metadata over the ingested Tariff", owns: "The corpus and ingestion pipeline", built: "Built for real" },
  { component: "Product, claim and history sources", prototype: "Local synthetic tables behind tool functions", production: "Read-only adapters to product master data (dm+d-aligned), the claim ledger and case history", owns: "Adapter contracts", built: "Mocked" },
  { component: "Append-only decision record", prototype: "In-memory array; replay re-runs the pack under a chosen version", production: "Append-only record store with a change feed", owns: "The record store", built: "Built for real" },
  { component: "Operator case pack surface", prototype: "This web interface", production: "Inside the existing queue tool where it can be extended; otherwise a thin web app", owns: "The surface and its API", built: "Built for real" },
  { component: "Pharmacy pre-submission check", prototype: "This web interface, advisory only", production: "Manage Your Service on claim submission; later a supplier API into dispensing systems", owns: "The API contract", built: "Built for real" },
  { component: "Identity, secrets, networking, lineage", prototype: "None (single-user demo)", production: "Managed workload identity, secret storage, private networking, UK residency and data lineage", owns: "Configuration", built: "Not built" },
  { component: "Monitoring and agent tracing", prototype: "Trace shown per case; synthetic evaluation page", production: "Application telemetry, service monitoring and agent tracing; the payload trace information governance can audit", owns: "Dashboards and alert rules", built: "Not built" },
  { component: "CI/CD, infrastructure as code, evaluation gates, feature flags, rollback", prototype: "Feature flag for agent recommendations; offline demo mode", production: "Declarative infrastructure, automated release workflows, golden-set evaluation as a release gate, blue-green behind a flag", owns: "The repository", built: "Mocked" },
  { component: "Pharmacy-facing conversational surface", prototype: "None", production: "A conversational layer over the same corpus, only if a later pharmacy-facing experience is justified", owns: "Maintained by NHSBSA's team", built: "Not built" },
];

export const NOT_BUILT: string[] = [
  "Real capture integration: the prototype reads pre-annotated regions on synthetic forms.",
  "A live queue: cases are a fixed synthetic set; nothing here can touch NHSBSA's work.",
  "The model call: the interpretation step is scripted so the demonstration cannot fail live and no data leaves the browser.",
  "Pricing: never, by design. The prototype refuses to price.",
  "Authentication, networking, secrets and lineage: production concerns, listed in the architecture view.",
  "Pharmacy dispensing-system integration: the pre-submission check is shown as a surface; the supplier API is a later phase.",
  "Monitoring dashboards and alerting: the evaluation page is illustrative.",
  "Calibrated confidence thresholds: set by hand here; calibrated against operator outcomes in shadow mode.",
];

export interface MetricRow {
  metric: string;
  value: string;
  target: string;
  status: "ok" | "warn" | "fail";
  note: string;
}

export const EVAL_METRICS: MetricRow[] = [
  { metric: "Agreement with expert adjudication", value: "87% (synthetic)", target: "Approaching inter-operator ceiling (to be measured)", status: "warn", note: "Ceiling unknown until two operators judge fifty items blind." },
  { metric: "Citation validity", value: "100% (synthetic)", target: "100%; any unsupported recommendation is withheld", status: "ok", note: "Enforced by code, not measured after the fact." },
  { metric: "Evidence completeness", value: "94% (synthetic)", target: "Every recommendation carries source per finding", status: "ok", note: "Gaps are on history lookups for new contractors." },
  { metric: "Abstention rate", value: "18% (synthetic)", target: "Stable; a fall without accuracy gain is an alert", status: "ok", note: "Concentrated in handwritten items." },
  { metric: "Human override rate", value: "9% (synthetic)", target: "Above a floor; near zero is an alert", status: "ok", note: "Overrides mostly amend the draft wording, not the outcome." },
  { metric: "Handling time per exception", value: "Not measured", target: "Down against a timed baseline", status: "warn", note: "Requires a day of operator timing." },
  { metric: "Repeat-referral rate", value: "Not measured", target: "Down", status: "warn", note: "Requires NHSBSA's second-referral data." },
  { metric: "Cost per synthetic case", value: "£0.04 (synthetic)", target: "Below the cost of the touch it replaces", status: "ok", note: "Tier 0 clears most volume with no model call." },
  { metric: "Payment-accuracy guardrail (PPPA, ACV, NCV)", value: "Unchanged by design", target: "Held; the agent never prices or disposes", status: "ok", note: "Measured by NHSBSA's existing monthly sampling." },
];

export interface CategoryRow {
  category: string;
  cases: number;
  agreement: string;
  abstention: string;
  note: string;
}

export const EVAL_BY_CATEGORY: CategoryRow[] = [
  { category: "NCSO, printed endorsement", cases: 62, agreement: "95%", abstention: "3%", note: "Strong; candidate first pattern." },
  { category: "NCSO, handwritten endorsement", cases: 48, agreement: "84%", abstention: "27%", note: "Abstains rather than guesses; acceptable in shadow mode." },
  { category: "Broken bulk", cases: 31, agreement: "90%", abstention: "10%", note: "Quantity reconciliation carries most of the value." },
  { category: "Specials, invoice price", cases: 22, agreement: "71%", abstention: "36%", note: "Outside coverage; reshape before including." },
  { category: "Out-of-pocket expenses", cases: 17, agreement: "76%", abstention: "29%", note: "Threshold logic is deterministic; the narrative part is weak." },
];
