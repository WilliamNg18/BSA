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
  { id: 1, statement: "Exception causes are concentrated enough to support a repeatable intervention.", why: "A repeatable solution needs repeating patterns; a long tail of one-offs cannot be covered by an evaluation set or measured per slice.", evidence: "Around one million items referred back in 2024/25 (Community Pharmacy England); the Drug Tariff defines a finite set of endorsement types and NHSBSA's published routing names specific categories.", basis: "Public", validate: "Two years of referral reasons by code; a concentration index (share of volume in the top five reasons).", ifWrong: "Nothing repeatable to build against. Recommend stopping.", effect: "Kills" },
  { id: 2, statement: "Operators spend material time assembling evidence, not only judging.", why: "The time saving comes from the case being assembled before the operator opens it.", evidence: "The published routing rule implies find, look up, then judge; in comparable estates the image, product data, claim and rule sit in separate systems.", basis: "Experience", validate: "Time a small number of operators for a day, splitting locating evidence from forming the judgement.", ifWrong: "Value narrows to consistency, explanation and audit. A pre-fetched screen may be the simpler answer.", effect: "Reshapes" },
  { id: 3, statement: "Relevant evidence is split across sources that must be reconciled.", why: "Otherwise a single lookup would do and no orchestration is needed.", evidence: "Image store, product master data, claim ledger and case history appear to be separate systems (assumed from the published process).", basis: "Experience", validate: "Confirm the sources and their read access in the first two weeks.", ifWrong: "A simpler tool is more appropriate.", effect: "Reshapes" },
  { id: 4, statement: "Some cases need contextual interpretation beyond deterministic rules.", why: "Otherwise a rules engine suffices and no model belongs in the loop.", evidence: "Endorsements are free text judged against prose that changes monthly; two operators can reach different answers on the same item.", basis: "Public and experience", validate: "Review fifty exceptions with operators; count endorsement-affecting Tariff changes in twelve months.", ifWrong: "Encode the rules and stop. The architecture already keeps the deterministic part separate.", effect: "Kills" },
  { id: 5, statement: "Historical decisions can support evaluation.", why: "The agent must be measured against what people decided, not against itself.", evidence: "Referral codes are published; storing them at item level is standard practice (assumed).", basis: "Public and experience", validate: "Inspect item-level history and how the reason for a decision is recorded.", ifWrong: "Label an evaluation set from scratch with operators. Slower, not fatal.", effect: "Intact" },
  { id: 6, statement: "Decision support can appear inside or beside the existing operator workflow.", why: "Adoption fails if operators must open another system.", evidence: "An operator queue at this scale is worked in a case tool that routes by reason; such tools usually expose an extension point (experience).", basis: "Experience", validate: "Review the queue tool's extension options.", ifWrong: "An adjacent screen. Adoption risk rises; the case does not fall.", effect: "Reshapes" },
  { id: 7, statement: "NHSBSA-side value exists without pharmacy-side adoption.", why: "The first phase must stand alone; pharmacy integration depends on suppliers NHSBSA does not control.", evidence: "Every benefit in the NHSBSA value list (time, touches, consistency, audit, accuracy held) accrues inside NHSBSA.", basis: "Public and experience", validate: "The two-week data test itself: does the operator-side case pack move handling time and consistency on its own?", ifWrong: "The case depends on integration NHSBSA does not control; phase one would not stand alone.", effect: "Reshapes" },
  { id: 8, statement: "Pre-submission checks can reach pharmacies through channels NHSBSA already owns.", why: "Manage Your Service is mandatory for month-end submission and already returns referred-back items digitally.", evidence: "NHSBSA's published Manage Your Service pages describe mandatory FP34C submission, digital referred-back items and supplier APIs.", basis: "Public", validate: "Confirm the claim-amendment window and the share of referred-back items that were electronic claims.", ifWrong: "The pharmacy-side check moves to a later phase; the NHSBSA-side case is unaffected.", effect: "Intact" },
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
  { component: "Scanning, capture, field extraction", prototype: "Pre-annotated regions on synthetic forms", production: "NHSBSA's existing scanners and capture; Azure AI Document Intelligence (layout) only where region provenance is needed", owns: "Existing estate", built: "Mocked" },
  { component: "Exception event ingress", prototype: "In-memory case list", production: "Azure Service Bus topic from the existing routing", owns: "Topics, subscriptions, dead-letter policy", built: "Mocked" },
  { component: "Deterministic pre-checks, requirement checks, gate, composite, citation check", prototype: "TypeScript pure functions (rules.ts), same logic as production", production: "Azure Functions / Durable Functions, unit-tested", owns: "The functions and their tests", built: "Built for real" },
  { component: "Agent orchestration (plan, gather, retrieve, reconcile, assess, recommend, abstain)", prototype: "Deterministic orchestration in agent.ts with an inspectable trace", production: "Azure AI Foundry Agent Service with tracing and tool governance", owns: "Agent definitions and tool contracts", built: "Built for real" },
  { component: "Interpretation of the free-text endorsement", prototype: "Three scripted readings per case (mocked)", production: "Constrained Azure OpenAI call: structured JSON output, schema-validated, three samples, may cite only retrieved passages", owns: "Prompts, schemas, evaluation results", built: "Mocked" },
  { component: "Versioned Drug Tariff retrieval", prototype: "Local synthetic corpus, three monthly versions, date filter", production: "Azure AI Search with effective-date metadata over the ingested Tariff", owns: "The corpus and ingestion pipeline", built: "Built for real" },
  { component: "Product, claim and history sources", prototype: "Local synthetic tables behind tool functions", production: "Read-only adapters to product master data (dm+d-aligned), the claim ledger and case history", owns: "Adapter contracts", built: "Mocked" },
  { component: "Append-only decision record", prototype: "In-memory array; replay re-runs the pack under a chosen version", production: "Azure Cosmos DB append-only container with change feed", owns: "The record store", built: "Built for real" },
  { component: "Operator case pack surface", prototype: "This web interface", production: "Inside the existing queue tool where it can be extended; otherwise a thin web app", owns: "The surface and its API", built: "Built for real" },
  { component: "Pharmacy pre-submission check", prototype: "This web interface, advisory only", production: "Manage Your Service on claim submission; later a supplier API into dispensing systems", owns: "The API contract", built: "Built for real" },
  { component: "Identity, secrets, networking, lineage", prototype: "None (single-user demo)", production: "Microsoft Entra ID with managed identities, Azure Key Vault, Private Link, UK region, Microsoft Purview", owns: "Configuration", built: "Not built" },
  { component: "Monitoring and agent tracing", prototype: "Trace shown per case; synthetic evaluation page", production: "Application Insights, Azure Monitor and Foundry tracing; the payload trace information governance can audit", owns: "Dashboards and alert rules", built: "Not built" },
  { component: "CI/CD, infrastructure as code, evaluation gates, feature flags, rollback", prototype: "Feature flag for agent recommendations; offline demo mode", production: "Bicep or Terraform, GitHub Actions, golden-set evaluation as a release gate, blue-green behind a flag", owns: "The repository", built: "Mocked" },
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
