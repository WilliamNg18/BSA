export const DESIGN_TITLE = "How it works and how it would scale";
export const DESIGN_DATE = "14 September 2026";
export const DESIGN_PRINCIPLE = "The agent gathers evidence and recommends. Deterministic code validates and calculates. A human decides. This prototype does not calculate or approve payments.";
export const REFERENCE_EXPLANATION = "Equivalents exist on other platforms. Selection follows NHSBSA's existing estate, procurement and assurance, not this example. Service names do not establish approved configuration or compliance.";

export const DESIGN_LABELS = {
  built: "Built in this proof of concept",
  proposed: "Proposed for production",
  assumption: "Assumption to validate with NHSBSA",
} as const;

export type DesignStatus = keyof typeof DESIGN_LABELS;
export interface DesignPanel {
  title: string;
  status: DesignStatus;
  text: string;
}
export interface DesignTable {
  caption: string;
  headers: readonly string[];
  rows: readonly (readonly string[])[];
}
export interface DesignSection {
  id: string;
  title: string;
  status: DesignStatus;
  panels: readonly DesignPanel[];
  table?: DesignTable;
}

export const DESIGN_SECTIONS: readonly DesignSection[] = [
  {
    id: "proof", title: "What this proof of concept actually is", status: "built",
    panels: [
      { title: "A working demonstration, not a live service", status: "built", text: "A static, client-side web application with no business or model backend. All operational data is synthetic and held in browser memory. No runtime model requests leave the browser. Existing single-web-app hosting and repository continuous deployment serve the application; they do not provide NHSBSA integrations or production authentication." },
      { title: "Executable controls", status: "built", text: "Requirement checks, reconciliation, citation validation, structural confidence, the compliance gate and routing are real deterministic code. The orchestration has an inspectable plan, gather, retrieve, reconcile, assess and recommend-or-abstain trace. These are reusable foundations, not assurance that synthetic rules can ship unchanged against the real Tariff." },
      { title: "Precisely what is scripted", status: "built", text: "Free-text interpretation uses scripted readings, not a model. Synthetic source lookups and three monthly Tariff versions keep the demonstration repeatable without patient data. Scripted three-reading agreement is not measured independent-model agreement. Typed and human-confirmed fields also use deterministic parsing. Animation is presentation, not measured processing time." },
      { title: "One shared cycle", status: "built", text: "The header compares Today with With the agent. Both perspectives read one session; navigation does not decide. Apply fills a human draft; Send, Resubmit, Release to pricing and Refer back remain separate actions. Paid on the normal schedule is synthetic existing-pricing attribution, not a payment made by the agent." },
    ],
    table: {
      caption: "Four playable cases: demonstration contract",
      headers: ["Item", "Today", "With the agent"],
      rows: [
        ["EPS complete · EX-24107", "Complete evidence follows existing automatic pricing; no operator or model.", "Both gates must pass independently before code-only release, with no operator action."],
        ["EPS missing date · EX-24112", "Possible weeks-later referral is the comparison assumption.", "Apply suggested correction, then human Send. If sent deficient, build a case for operator Apply suggestion and explicit disposition."],
        ["Wrong EPS · SYN-FQ123-MISMATCH", "Looking complete is not proof of source agreement; no random outcome.", "Gate 1 passes format; Gate 2 detects the mismatch. Never auto-release; operator reviews the built case."],
        ["Unreadable paper · EX-24123", "Type 1 keys by eye; unresolved evidence may need RB2B.", "Check before posting; fields are declared by the pharmacy, not read from the form. Human reconciliation is required; unreconcilable evidence abstains."],
        ["Background, not additional playable cases", "C and F retain background/history roles.", "E's no-model behaviour is in EPS complete. No separate readable-paper demonstration. Reset makes the four cases replayable."],
      ],
    },
  },
  {
    id: "alternatives", title: "Why agentic, rather than another tool?", status: "proposed",
    panels: [
      { title: "The next action depends on the last result", status: "proposed", text: "Five evidence sources must be joined: source image or EPS message, captured fields, product and pack master, claim ledger and case history. The retrieved dated Tariff governs them. Endorsement type selects a provision, version and requirements; reconciliation then determines whether advice or abstention is justified." },
      { title: "Keep the agent's job small", status: "assumption", text: "The Tariff is prose published monthly; publication does not mean every rule changes monthly. A governed interpreter could reduce maintenance when wording changes. Domain experts still approve ingestion and executable checks. If deterministic parsing covers the exceptions reliably, use it instead: agentic complexity must earn its place." },
    ],
    table: {
      caption: "Alternatives and the boundary where each is sufficient",
      headers: ["Alternative", "Sufficient when", "Where it falls short"],
      rows: [
        ["Rules engine", "Known structured requirements; tier-0 pre-check is part of this design and makes no model call.", "Ambiguous prose and changing coverage need curated interpretation; never replace pricing rules."],
        ["Better character recognition", "The gap is legible field extraction from paper.", "Cannot establish which dated provision applies or resolve conflicting sources; EPS is already typed."],
        ["Workflow tool", "Known routing, queues and human task ownership.", "Moving a task does not assemble and reconcile the evidence needed for judgement."],
        ["Chatbot", "A person needs general navigation or an explanation.", "Unpinned conversation is not a revision-bound, reproducible case with validated citations and enforced gates."],
        ["Governed agent", "Evidence needs vary by the last result and uncertainty must remain visible.", "Only worthwhile if evaluation beats simpler alternatives at acceptable risk and total cost."],
      ],
    },
  },
  {
    id: "governance", title: "Governance is executable, not a prompt", status: "proposed",
    panels: [
      { title: "Four authority classes", status: "built", text: "Existing systems supply evidence and the pricing path. Deterministic code checks, calculates and gates. The agent gathers evidence and recommends or abstains. Humans submit, confirm evidence and decide exceptions. The compliance gate is a pure function invoked by application code, not an agent tool the model can call or bypass." },
      { title: "One constrained model responsibility", status: "proposed", text: "Read redacted free text into schema-validated facts with quoted evidence spans. Request three independent samples without sharing earlier outputs; code measures agreement. Independence is a sampling design, not proof against correlated errors. No model-written clause, gate result, payment or final decision is trusted." },
      { title: "Five structural signals, never a percentage", status: "built", text: "Provision found; sample agreement; reconciliation; image quality; evaluation coverage. Code computes the composite, not model self-confidence. Unknown reconciliation is not agreement. The current synthetic image threshold is 0.60 and agreement threshold is two of three; neither is a calibrated probability of correctness." },
      { title: "Citation and release boundaries", status: "proposed", text: "Retrieve the clause for the dispensing date, never from model memory. Validate identifier, version and quoted span against that corpus. Gate 1 checks supplied requirements; Gate 2 independently reconciles source and claim. Both passing permits code-only release only on eligible items; disputed or unreadable evidence needs a human, never rubber-stamping." },
      { title: "Pinned record and replay", status: "proposed", text: "Append case revision, source hashes, effective dates, retrieved spans, model identifier, prompt hash, agent/code version, tool trace, gate results and human actor/reason. Replay into a separate result under another version; never overwrite the original. Enforce retention, access and tamper evidence in the record service." },
      { title: "What the browser record proves", status: "built", text: "Session records retain synthetic evidence, Tariff and agent versions, trace and human history; dated counterfactual replay leaves history unchanged. Reset or reload clears operational memory. No durable append-only service, pinned live model/prompt, tamper-proof storage or production compliance certification exists here." },
    ],
  },
  {
    id: "architecture", title: "Production architecture: the flow, once", status: "proposed",
    panels: [
      { title: "Read-only evidence, explicit disposition", status: "proposed", text: "Queue-based ingress consumes existing exception events. Tier-0 deterministic functions clear straightforward checks without inference. Governed orchestration uses read-only evidence tools and a hosted structured-output model endpoint. Code validates facts, citations and gates; an append-only record feeds the operator surface. Only authorised human disposition releases exceptions to the existing pricing path." },
      { title: "The tools and surfaces", status: "proposed", text: "Read image region, look up product/pack, look up claim, check history and retrieve the effective-date Tariff clause. Recording is application-owned, not a model write tool. Embed the operator surface in the queue tool where extensible. Use mandatory MYS for pharmacy returns; submission pre-check integration and later supplier APIs need agreement." },
      { title: "Controls around every component", status: "proposed", text: "Identity, least privilege, secrets management, private networking and approved UK data residency surround the runtime. A trace per case supports latency, abstention, override and drift monitoring without raw patient identifiers. Golden-set evaluation gates every prompt, model, corpus and code change. None of these production services is deployed by this proof of concept." },
    ],
  },
  {
    id: "integration", title: "Work with NHSBSA's existing systems", status: "proposed",
    panels: [
      { title: "Keep what already works", status: "assumption", text: "Supplied process context includes scanners and character recognition, EPS claim messages, existing rules-engine pricing, MYS returns, Type 1 and Type 2 streams, and a 50,000-item monthly accuracy sample. These stay. Access, event contracts, queue extensibility and the sample's suitability for exception evaluation require NHSBSA confirmation." },
      { title: "Adapters, not a replacement pricing system", status: "proposed", text: "Read-only adapters access the image store, captured fields, dm+d-aligned product master, claim ledger and case history. Existing exception routing triggers work. Ingest the Tariff monthly with effective dates, provenance and approved corrections. No adapter writes pricing; an operator's recorded decision hands back to today's pricing path." },
      { title: "Redaction before interpretation", status: "proposed", text: "Remove patient identity before every model request, including image regions, notes and telemetry. Use a pseudonymous item key for authorised joins. Confirm data minimisation, lawful basis, retention, deletion, residency and supplier terms with the CISO and information governance team. Current synthetic data is not evidence these controls are implemented." },
    ],
    table: {
      caption: "Data requested from NHSBSA and its use",
      headers: ["Requested data", "MVP collection or use"],
      rows: [
        ["Cost per operator touch", "Two weeks of sampled gathering, judging and rework time, loaded labour cost and handling type; compare like-for-like cohorts."],
        ["Exception volume by reason", "Read-only event export with timestamps; select evaluated coverage and measure actual arrival bursts."],
        ["Resolve-versus-refer split", "Link operator dispositions to the initial exception; estimate eligible assistance, not assumed universal clearance."],
        ["Second-referral rate", "Join pseudonymous item revisions and referral events; measure repeated pharmacy work without counting the same item twice."],
        ["Item-level referral history", "Authorised de-identified evaluation set, rule version and blinded operator labels; preserve held-out cases and override reasons."],
        ["Accuracy sample and source contracts", "Confirm access and representativeness of the 50,000-item monthly sample; stratify exception evaluation rather than extrapolate from easy items."],
      ],
    },
  },
  {
    id: "scale", title: "Scale: arithmetic, not a capacity claim", status: "assumption",
    panels: [
      { title: "Public context, not fresh verification", status: "assumption", text: "Owner-supplied public context: about 11,100 community pharmacies, over 100 million items/month, about 91% EPS, 2.2 million Type 1 and 2 million Type 2 touches/month, 85,000 referrals/month and about 194,000 unpaid MYS items in July 2026. Figures are not freshly independently verified; staff streams can overlap." },
      { title: "Reconcile daily and monthly volumes", status: "assumption", text: "85,000 / 22 business days = 3,864 cases/day, consistent with roughly 3,000-4,000. Over 30 calendar days it is 2,833/day. At eight staffed hours/day, 85,000 / (22 × 8 × 60) = 8.05/minute on average. Over 24 hours and 30 days it is 1.97/minute. Neither average is a measured peak." },
      { title: "Size against measured bursts", status: "assumption", text: "Illustrative fivefold burst: 8.05 × 5 = 40.25 cases/minute. At 45 seconds service time, average in-flight work is 40.25 × 45 / 60 = 30.19 cases. Budget 40 case slots and up to 120 simultaneous sample calls if parallel. These assumptions need load tests, quota checks and arrival/service-time distributions." },
      { title: "Latency and back-pressure", status: "proposed", text: "Target under one minute end-to-end per case, not a measured guarantee. Measure queue wait plus processing, including p95/p99, retry and timeout behaviour. Bound concurrency, deduplicate events, use idempotent revision keys and dead-letter handling. When delayed or unavailable, retain today's manual path; never turn missing advice into an automatic pass." },
      { title: "The pharmacy tier is a different workload", status: "proposed", text: "Stateless deterministic pre-check per claim line, with a cached approved monthly corpus; no model call on every claim by default. Model-assisted interpretation is exception-only. More than 100 million monthly items and month-end bursts need separate load testing. Proposed MYS/supplier APIs avoid new pharmacy installation, subject to portal and supplier capability." },
      { title: "What changes beyond the demonstration", status: "proposed", text: "Replace scripted interpretation with constrained inference, synthetic clauses with an approved ingested corpus, browser memory with queue and durable records, and scripted cases with live exceptions. Start in shadow mode with zero influence, then volunteer-assisted use. Feature flags, golden evaluations, override reasons and a monthly fail-open drill protect the unchanged payment-accuracy guardrail." },
    ],
  },
  {
    id: "judgement", title: "Judgement: boundaries and stop criteria", status: "assumption",
    panels: [
      { title: "Where a model must not be used", status: "proposed", text: "Never for pricing or the final decision; never without a retrieved clause, on unredacted patient identity, or outside evaluated coverage. Deterministic pre-checks remain the first choice. Missing evidence, conflicts, unvalidated output and unavailable services withhold advice and preserve manual work, not an automatic approval." },
      { title: "First test: establish the human ceiling", status: "assumption", text: "Collect two weeks of operator time by task and reason. Have two operators independently judge the same fifty de-identified items, blind to each other and to agent outputs; then adjudicate disagreements. Estimate inter-operator agreement, evidence-gathering share and referral repetition before selecting a model. Fifty items are discovery, not safety certification." },
      { title: "Kill or reshape the idea", status: "assumption", text: "Stop if safe redaction, dated source access or independent reconciliation cannot be established, or automation worsens the payment-accuracy guardrail. Reshape to rules/workflow if ambiguity is rare or gathering is negligible. Proceed only if blinded evaluation improves useful preparation without unacceptable abstention, overrides, workload or cost; agree thresholds with NHSBSA before pilot." },
      { title: "Calibrate before influence", status: "proposed", text: "Calibrate abstention thresholds in zero-influence shadow mode against adjudicated operator outcomes. Review error severity, coverage, overrides, repeated referrals and net operator time, not agreement alone. A model or corpus change must pass the same held-out evaluations. Stop assisted rollout on a guardrail breach; preserve evidence and the manual route." },
    ],
  },
  {
    id: "costs", title: "Cost and effort, honestly", status: "assumption",
    panels: [
      { title: "Model arithmetic: assumptions, not list prices", status: "assumption", text: "Assume 2,000 input and 400 output tokens per sample, three samples/case, GBP 2 per million input tokens and GBP 8 per million output tokens. Per case: 3 × ((2,000 × 2 + 400 × 8) / 1,000,000) = GBP 0.0216, or 2.16p. At 85,000 cases: GBP 1,836/month before retries." },
      { title: "Comparator is labour, not guaranteed savings", status: "assumption", text: "Assume one operator touch takes 13 minutes at GBP 30/hour: 13 / 60 × 30 = GBP 6.50; 85,000 touches = GBP 552,500/month. This illustrative referral-touch comparator is not the routine 12-14-second Type 2 average. It excludes repeat touches; actual judgement, abstention and integration costs remain." },
      { title: "Cost scope and sensitivity", status: "assumption", text: "All figures below are planning assumptions, not quotes or verified billing. Change token lengths, rates, volume and retry factor when measured. Production models all 85,000 referrals conservatively, not all staff exceptions. Pharmacy pre-check is deterministic; exception model calls must not be counted twice. Labour, tax, network and existing-estate costs are excluded from service totals." },
      { title: "Current hosting is not a zero-bill claim", status: "built", text: "The existing F1 hosting tier is unchanged. No new runtime service is added here. Incremental infrastructure allocation is assumed GBP 0 for comparison only; actual subscription billing and shared costs are unverified. The proof of concept is not cost evidence for a production service." },
    ],
    table: {
      caption: "Monthly cost and implementation effort: all numeric estimates are assumptions",
      headers: ["Line", "This proof of concept", "Shadow-mode pilot", "Production"],
      rows: [
        ["Volume assumption", "Synthetic browser cases only", "5,000 exception cases/month", "85,000 exception cases/month; 100 million pharmacy pre-check lines as a conservative baseline"],
        ["Model, base assumption", "GBP 0: no model calls", "5,000 × GBP 0.0216 = GBP 108/month", "85,000 × GBP 0.0216 = GBP 1,836/month"],
        ["Model retry allowance assumption", "GBP 0", "10% × GBP 108 = GBP 10.80/month", "10% × GBP 1,836 = GBP 183.60/month"],
        ["Search assumption", "Local synthetic corpus; no search service", "One index: GBP 100/month", "One scaled index: GBP 300/month"],
        ["Exception functions assumption", "Browser code; no function service", "GBP 20/month", "GBP 100/month"],
        ["Pharmacy pre-check assumption", "Browser code; no service calls", "Not included in zero-influence exception pilot", "100 million / 1 million × GBP 2 assumed blended compute/queue allocation = GBP 200/month"],
        ["Record store assumption", "Browser memory; no durable service", "GBP 20/month", "GBP 100/month"],
        ["Observability assumption", "Inspectable local trace", "GBP 30/month", "GBP 150/month"],
        ["Service subtotal assumption", "No added service; existing host billing unverified", "108 + 10.80 + 100 + 20 + 20 + 30 = GBP 288.80/month", "1,836 + 183.60 + 300 + 100 + 200 + 100 + 150 = GBP 2,869.60/month"],
        ["People-effort assumption, not elapsed delivery", "No retrospective effort estimate", "4-8 people-weeks: source access, redaction, ingestion, shadow evaluation", "12-24 additional people-weeks: adapters, queue/MYS integration, resilience, assurance and evaluation"],
        ["Ongoing people-effort assumption", "Demonstration maintenance not measured", "1-2 people-weeks/month for labelling and review", "2-4 people-weeks/month for corpus, prompts, operations and evaluation; NHSBSA must validate"],
      ],
    },
  },
  {
    id: "questions", title: "Likely questions and short answers", status: "proposed",
    panels: [
      { title: "Why not fine-tune a model?", status: "proposed", text: "Start with retrieved dated evidence and constrained output. Fine-tuning does not make monthly rules current or citations valid. Consider it only for a measured, persistent interpretation gap after the simpler baseline is evaluated." },
      { title: "Why three samples?", status: "proposed", text: "Three allow code to detect disagreement and a two-of-three majority. Samples can share systematic errors; this is not calibrated confidence. Compare one versus three in blinded evaluation before accepting extra cost and latency. Today's three readings are scripted." },
      { title: "What if the Tariff changes mid-month?", status: "proposed", text: "Publish an approved, effective-dated correction without overwriting the previous corpus. Route by dispensing date and applicable correction policy. Pin the exact version in every record; replay separately and have governance decide whether affected cases need review." },
      { title: "What about EPS versus paper?", status: "proposed", text: "EPS supplies typed messages, not an unreadable image or Type 1 task. Paper retains original capture and declared-not-read provenance. A pharmacy declaration cannot corroborate itself. Poor, conflicting or unconfirmed evidence stays manual or abstains." },
      { title: "How do you stop an invented clause?", status: "built", text: "Code verifies the retrieved clause identifier, version and quoted span against the selected synthetic corpus. Missing or invalid citations withhold advice. Production must preserve that boundary against the approved corpus; model memory is never a source." },
      { title: "What happens when the agent is down?", status: "proposed", text: "Keep today's manual queue and pharmacy submission path. Time out assistance, show unavailable, retain the trace and retry safely. Fail-open means manual continuity, never a successful gate or automatic release. Practise this monthly." },
      { title: "How is this different from the existing rules engine?", status: "proposed", text: "The rules engine still prices straightforward items. This prepares evidence for the ambiguous tail and may prevent avoidable pharmacy gaps. It neither replaces pricing nor assumes every staff-touched item needs a model." },
      { title: "Who owns the prompts and corpus?", status: "assumption", text: "NHSBSA-designated domain and engineering owners approve prompts, ingestion, effective dates and evaluation coverage, with information governance oversight. Ownership, change control, supplier responsibilities and rollback authority must be agreed before a pilot." },
      { title: "How do you evaluate it?", status: "proposed", text: "Use blinded, adjudicated, de-identified held-out items stratified by reason and channel. Measure evidence correctness, citation validity, severe errors, abstention, override reasons and net operator time. Test every model, prompt, corpus and code version before release." },
      { title: "What does the CISO need to see?", status: "proposed", text: "A data-flow and threat assessment, redaction evidence, lawful basis, residency, retention, access controls, supplier terms, incident response and audit/replay proof. Synthetic offline operation demonstrates none of these production approvals; there is no certification claim." },
      { title: "How does this reach 11,100 pharmacies?", status: "proposed", text: "Propose a stateless pre-check through MYS and later approved supplier APIs into dispensing systems, not another installation. Confirm submission touchpoints, contracts and month-end capacity. Use deterministic checks by default, exception-only inference and the existing manual fallback." },
      { title: "What is the smallest first step?", status: "assumption", text: "Two weeks of operator time data and fifty de-identified items judged blind by two operators. Establish the problem and disagreement ceiling first; then compare deterministic checks with constrained interpretation before any zero-influence shadow pilot." },
      { title: "What would make you stop?", status: "assumption", text: "No safe data access, no trustworthy dated evidence, material accuracy harm or no net preparation benefit. Reshape to rules or workflow if they suffice. Agree measurable stop thresholds before rollout; no sunk-cost justification for keeping a model." },
    ],
  },
];

export const COMPONENT_FLOW = [
  "Existing exception event enters queue-based ingress with item and revision identifiers.",
  "Tier-0 deterministic checks bypass inference for straightforward items; existing pricing stays outside the new tools.",
  "Governed orchestration reads source evidence, product/pack, claim, history and the effective-date search index.",
  "A hosted model endpoint receives redacted text and returns three schema-validated fact samples, not a decision.",
  "Application code runs reconciliation, citation checks and the compliance/release gates; unavailable or disputed evidence cannot pass.",
  "Append-only records feed the existing operator queue surface. A human decides exceptions; authorised code-only items follow their separate eligibility path.",
] as const;

export const CASE_B_SEQUENCE = [
  "Pharmacy → Pre-check: EX-24112 typed EPS endorsement is missing its date.",
  "Pre-check → Pharmacy: dated clause and gap; Apply suggested correction fills the draft only.",
  "Pharmacy → Ingress: human Send submits the current revision; sending without the correction remains possible.",
  "Ingress → Case builder: if deficient, read claim, source, product, history and effective-date clause; interpret only where required.",
  "Case builder → Code gate: reconcile facts, validate citation and requirements; missing date fails the sufficiency checks.",
  "Code gate → Operator: record evidence, clause/version, recommendation and draft; never automatically release the deficient item.",
  "Operator → Pharmacy: human Apply suggestion, then explicit Refer back with RB code and approved note, or a justified permitted disposition.",
  "Pharmacy → Ingress: human Apply suggested correction, then Resubmit; retain prior attempts and any required human re-check.",
  "Operator → Existing pricing: after satisfied checks and required review, explicit Release to pricing; pharmacy sees normal-schedule attribution, no agent payment.",
] as const;

export function systemDesignMarkdown(reference: DesignTable): string {
  const table = ({ caption, headers, rows }: DesignTable) => [
    `### ${caption}`, "",
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`), "",
  ].join("\n");
  const sections = DESIGN_SECTIONS.map((section) => [
    `## ${section.title}`, "", DESIGN_LABELS[section.status], "",
    ...section.panels.flatMap((panel) => [
      `### ${panel.title}`, "", DESIGN_LABELS[panel.status], "", panel.text, "",
    ]),
    ...(section.table ? [table(section.table)] : []),
    ...(section.id === "architecture" ? [
      "### Component diagram: proposed production boundary", "",
      ...COMPONENT_FLOW.map((step, index) => `${index + 1}. ${step}`), "",
      "### Case B sequence: missing-date EPS, proposed integration", "",
      ...CASE_B_SEQUENCE.map((step, index) => `${index + 1}. ${step}`), "",
    ] : []),
  ].join("\n")).join("\n");
  return [
    `# ${DESIGN_TITLE}`, "", `Technical reference · ${DESIGN_DATE} · Synthetic demonstration`, "",
    DESIGN_PRINCIPLE, "", sections,
    `## ${reference.caption}`, "", DESIGN_LABELS.proposed, "", REFERENCE_EXPLANATION, "",
    table(reference),
  ].join("\n");
}
