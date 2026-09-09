import type { BoundaryClass } from "./types";

// Presenter, discussion and reference content. Grounded in the one-pager and
// the discussion pack; nothing here is a claim about NHSBSA's real performance.

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

export interface ChallengeCard {
  q: string;
  a: string;
}

export const CHALLENGE_CARDS: ChallengeCard[] = [
  { q: "Why does this need an agent rather than a rules engine?", a: "A rules engine handles what is explicit: is a field present, is a value in range, is a concession listed. It cannot read a handwritten sentence against a paragraph of prose that changes monthly. The agent's work is recognising what the note claims, finding the provision for that month, reconciling sources that disagree, explaining the gap and knowing when to stop. Everything explicit stays as code: the requirement check, the gate, pricing." },
  { q: "Why not improve OCR?", a: "NHSBSA already reads at high accuracy. Items reach this queue because they need judgement, not because the read failed. Assumption 1 tests exactly this: if referral reasons turn out to be mostly illegibility, the answer is capture, not an agent, and I would say so." },
  { q: "Is this problem large enough to matter?", a: "By share of volume, no: under 0.1 per cent. By where the human effort sits, it is the whole queue. Each referred-back item is handled by a specialist, sometimes twice, and paid weeks late. The right denominator is exception effort, repeat processing and payment delay. The two numbers that size it, cost per touch and the assembly-versus-judgement split, are NHSBSA's and I ask for both." },
  { q: "What happens when the model is wrong?", a: "It cannot be wrong about a payment: it never prices and never disposes. A wrong reading is caught three ways: the other two readings disagree and confidence falls; the gate blocks any outcome the rule does not permit; and the operator sees the evidence beside the recommendation and overrides. I monitor the override rate with a floor: a rate near zero means people have stopped checking." },
  { q: "How do you stop the agent inventing a rule?", a: "It may only cite a passage that retrieval actually returned, and deterministic code checks that the cited span exists in the corpus for the version in force. No retrieved provision, no recommendation: the agent abstains. Case D shows exactly that path." },
  { q: "How is confidence measured?", a: "Never by asking the model. Five structural signals: was a provision found; do the three readings agree; do the sources reconcile; is the image above the quality threshold; is this category within the validated set. Combined in code and shown to the operator as the signals, not as a bare percentage. In production the composite is calibrated against operator outcomes." },
  { q: "What happens if the system is unavailable?", a: "The queue runs exactly as today. The agent is read-only against every source, sits behind a feature flag, and can only add a case pack to an item that is already in the operator's queue. Nothing it does can block an item. The flag-off path is exercised deliberately, monthly." },
  { q: "Why should NHSBSA fund this when some benefit reaches pharmacies?", a: "Because the case stands on NHSBSA's own exception cost: operator time, repeat touches, consistency, a reconstructable record, accuracy held. The pharmacy benefit, the exact fix sooner and fewer repeat referrals, is real and is kept separate so it never props up the NHSBSA case." },
  { q: "How does this progress from a prototype to a production service?", a: "Two weeks with referral data decide whether to build. Then: read-only integration with capture output and the queue tool inside the existing accredited environment; the data-protection assessment; the corpus pipeline with monthly versioning; an evaluation set labelled with operators, run in CI; shadow mode with no influence on live work; assisted mode only when agreement, calibration, abstention and override thresholds are met; then widen by exception pattern." },
  { q: "What would NHSBSA own after the engagement ends?", a: "The versioned corpus and its ingestion pipeline; the evaluation set and evaluators in their CI; the gate, requirement resolver and pricing tests; infrastructure as code in their landing zone; the runbook and the monthly fail-open drill; operators who labelled the set and can challenge the agent. Stated in the first meeting, not the last." },
  { q: "Why is this agentic rather than a chatbot?", a: "Nobody asks it anything. For each item it decides what it needs to know, calls read-only tools, reconciles what comes back, judges, cites and stops, unprompted. The conversational surface for pharmacies is a possible later phase and is retrieval, not adjudication." },
  { q: "What did you deliberately not build?", a: "Real capture integration, a live queue, authentication, pricing, the pharmacy dispensing-system integration, monitoring dashboards and the model call itself. Each is well-understood integration work and none was the risk. The risk was whether the judgement layer could be made grounded, gated and auditable." },
];

export interface DiscussionPrompt {
  routes: string[];
  text: string;
}

export const DISCUSSION_PROMPTS: DiscussionPrompt[] = [
  { routes: ["/queue", "/case"], text: "When an item reaches an operator today, where does the time actually go: finding the evidence, or making the judgement?" },
  { routes: ["/case", "/evaluation"], text: "How often would two operators reach the same conclusion on the same exception, and where is the reason for a decision recorded today?" },
  { routes: ["/case", "/trace"], text: "How do monthly rule changes reach operators, and what currently breaks in that handover?" },
  { routes: ["/", "/evaluation"], text: "Which outcome would make this worth pursuing for NHSBSA: capacity released, pharmacies paid on time, or being able to explain any decision on demand?" },
  { routes: ["/", "/evaluation", "/record"], text: "Which payment-accuracy or assurance measures must not move, whatever we build?" },
  { routes: ["/trace", "/architecture"], text: "What information may reach an AI model, and what must remain outside it?" },
  { routes: ["/case", "/queue"], text: "Where would the recommendation need to appear so operators do not open another system?" },
  { routes: ["/case", "/evaluation"], text: "What would make operators trust, ignore or actively resist this?" },
  { routes: ["/evaluation", "/assumptions"], text: "What evidence would justify scaling the prototype?" },
  { routes: ["/evaluation", "/assumptions"], text: "What result should cause the work to be reshaped or stopped?" },
  { routes: ["/pharmacy"], text: "Which endorsement mistakes cause the most preventable referrals, and would a check before submission change what pharmacies do?" },
  { routes: ["/boundary", "/architecture"], text: "What must stay as deterministic code, and who would own and run this after handover?" },
];

export interface WalkthroughBeat {
  time: string;
  title: string;
  route: string;
  say: string;
  show: string;
}

export const WALKTHROUGH: WalkthroughBeat[] = [
  { time: "0:00 to 1:00", title: "NHSBSA, the exception, what is already automated", route: "/", say: "One disclosure: this is anchored to a UK public body my employer holds relationships with, so everything is public and every figure is synthetic where it says so. NHSBSA pays every community pharmacy in England for about 1.1 billion prescription items a year. It already scans, reads and prices almost all of them by machine. Around a million a year still go to a person, because the pharmacy's note does not satisfy a rulebook that changes every month.", show: "Overview: the queue counts, and the statement that nothing here prices or approves a payment." },
  { time: "1:00 to 2:00", title: "The manual journey: interpretation, not OCR", route: "/queue", say: "Here is what an operator does today: find the image, look up the product, check the claim against the ledger, find this month's rule, judge the note, send it back with a code. Reading is solved. What is not solved is judging a free-text note against prose that changed last month, and finding everything first.", show: "Queue: the six states, the confidence signals rather than a percentage." },
  { time: "2:00 to 3:30", title: "The pharmacy pre-submission check", route: "/pharmacy", say: "Before the claim leaves the pharmacy, the same agent checks the endorsement against the rule for today's date and says exactly what is missing, while the person who knows the answer is still at the counter. Advisory: it never blocks a submission.", show: "Switch scenarios: ready, information missing, unable to determine. Correct the endorsement and re-check." },
  { time: "3:30 to 6:30", title: "The exception queue and a complete case pack", route: "/case/EX-24112", say: "Now the NHSBSA side. This item was initialled but not dated. Watch what the agent did before the operator opened it: planned three unknowns, gathered from four sources, retrieved the August clause, judged the note three times, and a piece of code, not the model, checked that refer back is what the rule permits. Same outcome as today; one look, not one hunt; and the pharmacy is told exactly what to add.", show: "Case pack for EX-24112, then the trace for the same case." },
  { time: "6:30 to 8:00", title: "Evidence conflict, and the deliberate abstention", route: "/case/EX-24119", say: "Two harder ones. Here the form says 56 and the claim says 84; the agent flags both and refuses to choose. And here, a poor handwritten scan: no readable margin, no rule matched, three readings that disagree. It abstains and names what failed. Beside a 99.85 per cent accuracy target, a confident wrong answer costs more than an honest abstention.", show: "EX-24119 case pack; then EX-24123 trace ending in ABSTAIN." },
  { time: "8:00 to 9:00", title: "Agent, deterministic code, human decision", route: "/boundary", say: "Every action is one of four things: something NHSBSA already does, deterministic code, the agent, or a person. The agent gathers evidence and recommends. Code validates and calculates. A human decides. Pricing and the gate are never a model.", show: "Boundary page: the classification of every action." },
  { time: "9:00 to 10:00", title: "Evaluation, assumptions, and the questions to ask next", route: "/evaluation", say: "Before this touches live work: shadow mode against operator decisions, agreement, calibration, abstention, cost per case, per category, and the accuracy guardrail. Two assumptions decide whether it is worth building at all, and two weeks of NHSBSA's data would settle them. So what I would want from you today: access to two years of referral reasons, a named owner for the accuracy guardrails, and which exception pattern to start with.", show: "Evaluation scoreboard, then the assumptions panel. End on the decisions, not on 'any questions?'." },
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

export interface FailurePoint {
  risk: string;
  recovery: string;
}

export const FAILURE_POINTS: FailurePoint[] = [
  { risk: "The preview does not load or a screen renders blank.", recovery: "Say: 'That is the fail-open path you are watching; in production the queue runs exactly as it did before this existed.' Move to the recorded run or the one-pager's build panel and continue verbally." },
  { risk: "An interviewer asks to change an input (a different date, a different note).", recovery: "Use the pharmacy check: edit the endorsement and re-run. For the operator side, use the replay under a different Tariff version on the record page. Do not promise arbitrary inputs; the cases are constructed." },
  { risk: "'Isn't the abstention just hard-coded?'", recovery: "Yes, the readings are scripted; the composite and gate are real code. Open the trace and point at the five signals and the threshold. Explain that production replaces the scripted readings with three sampled model calls and nothing else changes." },
  { risk: "'Why is the missing date an agent problem? Code can check a date.'", recovery: "Agree. The date check is code (show it in the boundary row). The agent's part was recognising that the free-text mark is an NCSO claim, finding the August clause, and writing the fix. Offer Case D as the case that shows the difference." },
  { risk: "Time overruns before the abstention case.", recovery: "Skip the pharmacy screen. The abstention case and the boundary page carry more weight than the pharmacy check." },
  { risk: "A question about NHSBSA's real numbers.", recovery: "Every number on screen is synthetic and labelled. Name the NHSBSA inputs that would replace them: cost per touch, the assembly-versus-judgement split, the second-referral rate." },
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

export const SETUP_NOTES: string[] = [
  "The prototype is a single-page web application with no back end. All data is synthetic and held in the browser; nothing is sent anywhere.",
  "It opens in the app preview from this workspace. No sign-in, no network access and no external services are needed, so it runs offline.",
  "Demo controls sit in the header: Presenter mode (the timed walkthrough with a 'go to' button per beat), Discussion mode (prompts and challenge cards for the current screen), and the Agent recommendations switch (turning it off shows the fail-open path: evidence only, no recommendation).",
  "Reset demo returns every case to its starting state and clears the decision records made during the session.",
  "To rehearse: start Presenter mode on the Overview, press Start, and follow the beats. Each beat's 'Go to' navigates to the right screen and case.",
];
