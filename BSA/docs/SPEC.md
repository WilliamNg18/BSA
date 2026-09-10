---
title: Functional specification for Prescription Exception Case Builder
description: Guided tour, Chapter 2 scenario calculator, qualified assumptions and retained synthetic case behaviour.
ms.date: 2026-09-10
---

## Current increment scope

Task 1 replaces the earlier aggregate calculator model with seven editable
synthetic gathering steps, editable built review, identical reference-cohort
judging, bounded referral assumptions and a proportional four-cohort flow.
Chapter 1 now consumes the same live scenario selector. The existing header,
chapters 3/4/6, pharmacy and queue interfaces are unchanged. Tasks 2-7,
including animation, remain unimplemented. No backend or automatic decisions
are added. The current formulas and defaults are specified in
[the Task 1 model](task-1-baseline-model.md).

Presenter mode, Discussion mode, their state, the subtitle and `/notes` remain
removed. This supersedes those older requirements in [TASK.md](TASK.md).
The existing source registry is consumed without modification. Domain rules,
fixtures, gate semantics and six canonical outcomes are unchanged. See
[source-review.md](source-review.md) for attribution limits, discrepancies,
case mapping and the remaining numerical-copy migration.

Cases and operational results are synthetic. The tour separately labels
document-attributed public figures, assumptions and design proposals. No real
prescriptions, patients or authentic Drug Tariff text are introduced. Runtime
data stays local, with no public-document fetching.

---

## 1. Purpose

The supplied documents attribute approximately 1.1 billion primary-care items
annually to NHSBSA and approximately 85,000 referred-back items monthly to
Community Pharmacy England. Referrals are a subset, not the whole operator
queue. These publications were not independently verified. The Drug Tariff
is described as republished monthly; the frequency of endorsement-affecting
changes and the current operator evidence-assembly workflow need validation.

The application demonstrates a **governed AI agent that builds that case and recommends, while a person decides**. It is a capability demonstration for a conversation, not a system for NHSBSA to run.

**Governing principle (Keep, visible on every screen):**

> The agent gathers evidence and recommends. Deterministic code validates and calculates. A human decides. The prototype does not calculate or approve payments.

## 2. Boundary classes (Keep)

Every action in the application is tagged as exactly one of four classes, and the tag is shown wherever the action appears (trace steps, tool calls, evidence items, section headings):

| Class | Tag colour (initial build) | Meaning |
|---|---|---|
| `existing` | slate | Existing NHSBSA capability: scanners, capture, image store, claim ledger, case history, routing |
| `deterministic` | sky blue | Pure code: pre-checks, requirement checks, reconciliation arithmetic, confidence composite, compliance gate, citation validation, record writing |
| `agent` | teal | Agentic action: planning, choosing and calling tools, retrieving the rule for a date, reconciling sources, interpreting free text, recommending or abstaining |
| `human` | orange | Human decision: the operator's accept, amend, request information, refer back or escalate |

A `Boundary` page lists every action with its class and the reason for the classification, plus "where a model must not be used" and "what makes the agentic part genuinely agentic".

## 3. Information architecture

The sticky header is 56 px tall. Route metadata groups Overview, Operations
(Pharmacy check, Exception queue), and How it works (Evaluation, Boundary,
Assumptions, Architecture). Below 1024 px, a keyboard-operable mobile sheet
contains all groups. The shield links home, with an accessible full product
name at every width. Visible product text is abbreviated on tablets and
shield-only on phones. Agent: On/Off and Reset remain in the same row.

The tour rail pins immediately beneath the header. Back, Next, a six-chapter
menu and Dismiss tour are keyboard accessible. Alt+ArrowLeft/Right navigate
only outside editable fields, menus and dialogs, without Ctrl, Meta, Shift,
composition, repeat or an already-handled event. The footer restores a
dismissed rail at the current route. Unknown/detail routes show Start instead
of falsely claiming a chapter. Nothing about tour visibility is persisted.

The amber synthetic label remains on every route. Its detail paragraph can
be collapsed for the session; the governing principle cannot be collapsed.
The skip link focuses main without replacing a tour fragment. Chapter
navigation focuses its heading and returns to the top.

| Chapter | Route | Built in this increment |
|---|---|---|
| 1 | `/#scene` | Three qualified documentary figures, existing-process branches and shared synthetic estimates; Off hides assisted estimates only |
| 2 | `/#month` | Editable synthetic workload calculator; qualified manual/assisted estimates |
| 3 | `/#cases` | A-D engine outcomes On; neutral illustrative manual tasks Off |
| 4 | `/#two-places` then `/pharmacy` | Accessible proposal diagrams and existing advisory pharmacy substop |
| 5 | `/queue` | Explicit planned simulation notice above the existing synthetic queue |
| 6 | `/#close` | First data test, five PDF assumptions and seven exact PDF questions |

Next visits the pharmacy substop before chapter 5; Back reverses that exact
sequence. The chapter menu has six entries, not seven. Only one Overview
chapter renders at a time. Bare home and unrecognised home fragments show
scene. Chapter narrative title plus prose is at most 40 words; concise data
labels, controls and expanded disclosures are separate. The seven-question
disclosure is explicitly exempt. Source disclosures name claim class, named
source, supplied document, and PDF section or DOCX part/paragraph identifiers.

| Route | Screen | Contents |
|---|---|---|
| `/` | Overview | Fragment-driven tour chapters described above; no old headline or operating KPI cards |
| `/pharmacy` | Pharmacy pre-submission check | Section 9 |
| `/queue` | NHSBSA exception queue | Section 12 |
| `/case/:id/trace` | Case-building trace | Section 6: the agent's observable workflow, step by step, with a replay control |
| `/case/:id` | Operator case pack | Section 8: everything the operator needs on one screen, then the decision |
| `/case/:id/record` | Decision and audit record | Section 8.3: the append-only record, and replay under another Tariff version |
| `/evaluation` | Evaluation and guardrails | Section 13 |
| `/boundary` | Agent, deterministic code, human decision | Section 2 |
| `/assumptions` | Assumptions register | Section 14 |
| `/architecture` | Technical architecture and the path to production | Section 15 |
| `*` | Not found | Friendly not-found state with a Go home link, including the removed `/notes` path |

Case pages share a header: synthetic-case tag, state badge, "Back to queue", title, one-paragraph intro, and a three-tab strip (trace, case pack, record).

## 4. Domain model

### Chapter 2 baseline model

The current Task 1 model is defined in
[task-1-baseline-model.md](task-1-baseline-model.md). It supersedes the
historical aggregate-minute formulas and six-input count below. Local
verification is separate from pending Azure deployment; Azure is the
user-approved target after private Pages returned HTTP 422.

### Historical calculator model before Task 1

The following retained description records the previous increment, not
current arithmetic or current UI expectations.

[baseline.ts](../src/lib/domain/baseline.ts) contains pure typed validation,
cohort arithmetic and generated summary copy. Its default provenance is in
[baseline-defaults.ts](../src/lib/domain/baseline-defaults.ts). Neither changes
cases, rules, gates, recommendations or human decisions. These are scenario
estimates, not measured savings, real current practice or an operational forecast.

| Input | Default and provenance |
|---|---|
| V, monthly volume proxy | 85,000, pinned by test to O23's approximate referred-back subset; not all exceptions |
| g, gathering minutes/item | 5, editable design assumption; A03/A10 motivate observation but supply no duration |
| j, judging minutes/item | 2, editable design assumption; not measured NHSBSA time |
| p, pharmacy pre-check share | 2/12 incoming seed rows: B EX-24112 has an unmet date requirement; filler EX-24109 explicitly lacks invoice price |
| c, rule-cleared share | 2/10 after those candidates: E EX-24101 and filler EX-24098 |
| a, abstention share | 2/8 after candidates and clearances: D EX-24123 and filler EX-24120 |
| Assembly seconds/item | Mean of current engine assemblySeconds for active recommended A/B/C, not a measured latency |

The seed queue contains six canonical cases and six metadata-only fillers.
There are no filler model runs. Pharmacy effectiveness is an explicit scenario
assumption, not a measured catch rate or evidence of existing pharmacy checks.
Conflict and unreadable rows are not counted as pharmacy catches. Historical
F and the recorded filler are excluded from catches and timing samples. They
remain in the residual scaling pool without inventing new packs or decisions.
Defaults do not change when an operator records a session decision.

O23 is attributed to Community Pharmacy England by the supplied pack,
P0694-P0695, not externally verified. O24 distinguishes referrals from the
unknown total operator queue. N01: 1,000,000 / 12 is approximately 83,333.33,
not exactly 85,000. Scaling this deliberately mixed synthetic queue with that
referral proxy does not estimate real operational cohorts.

With p/c/a converted from percentages to fractions, the disjoint counts are:

* P = round(V * p), pharmacy-caught
* C = round((V - P) * c), rule-cleared
* A = round((V - P - C) * a), abstained
* B = V - P - C - A, built for human review

Rounding uses the nearest integer, halves up. Each cohort is removed before
the next denominator is calculated. P + C + A + B equals V exactly. At the
defaults these are 14,167 / 14,167 / 14,167 / 42,499 respectively.

Today gathering = V * g; Today judging = V * j. With agent gathering = A * g;
With agent judging = (A + B) * j. Operator hours divide each combined minute
total by 60. Default Today: 425,000 gathering minutes and 170,000 judging
minutes, or 9,916.7 displayed operator hours. With agent: 70,835 gathering
minutes and 113,332 judging minutes, or 3,069.5 displayed operator hours.
No subtraction is presented as a measured saving.

Expected per-item time before decision for built items = j + assemblySeconds/60;
abstained = g + j. Assembly is machine latency, never added to operator hours
or priced as labour. Queue delay, parallelism, extra failed-assembly latency
and pharmacy effort are excluded. Pharmacy-caught and rule-cleared items
assume no NHSBSA human touch. Built items require human review. Per-item
assumptions remain labelled even when a cohort is empty; zero volume yields
zero monthly hours and zero cohort counts.

Validated citations cover only 3/3 active recommended canonical A/B/C packs,
not all decisions or all scaled built items. D has no provision; E has no
citation or model call. No payment, price, approval or human decision is output.

The six input fields retain raw text in the global memory-only calculator
slice across route navigation. Blank, negative, non-finite, malformed,
out-of-range and fractional-volume inputs suppress estimates with associated
field errors. Volume accepts whole numbers 0-1,000,000,000; minutes accept
decimals 0-1,440; all three percentages accept decimals 0-100. Plain decimal
syntax only, no thousands separators or exponents. Internal assembly input
validation accepts finite seconds 0-3,600; the UI derives it, not an editable
stopwatch claim. Bounded arithmetic stays within safe numerical magnitudes.

Agent Off highlights Today and hides assisted metrics and summary cohorts;
the accessible existing header switch restores them with inputs retained.
Reset demonstration restores inputs and Agent On via the store as well as
the existing route remount. Reload returns defaults; no storage is added.
The permanent note requires replacing assumptions with validated NHSBSA
figures. Expanded disclosure lists defaults/current values, exact default
denominators, source IDs, formula and the Assumptions link. Display rounding
does not change the full-precision rates retained in inputs.

### Existing case model

Types live in `src/lib/domain/types.ts`. The important ones:

- **ExceptionCase**: `id`, `scenario` (A to F), `title`, `purpose`, `pharmacy {name, contractorCode}`, `routingReason`, `channel` ("Paper FP10" or "Electronic (EPS)"), `receivedAt`, `minutesInQueue`, `imageQuality` (0 to 1), `imageStyle` (printed, handwritten, handwritten_poor), `patientLabel`, `extracted` (ExtractedFields), `regions` (located regions on the form with text and read confidence), `claim` (what the pharmacy claimed), `readings` (three independent interpretations of the note, the mocked model step), `inCoverage`, `initialState`.
- **ExtractedFields**: `productText`, `productCode | null`, `productConfidence`, `quantity | null`, `quantityConfidence`, `endorsementText`, `endorsementConfidence`, `prescriber`, `dispensingDate` (ISO date).
- **EndorsementFacts** (one reading): `type` (NCSO, BB, XP, SP, UNKNOWN, NONE), `present`, `initialled | null`, `dated | null`, `quotedText`, `note`.
- **TariffVersion**: `version` (YYYY-MM), `label`, `effectiveFrom`, `effectiveTo`, `changeNote`, `clauses[]`, `concessions[] {productCode, price}`.
- **TariffClause**: `id`, `part`, `title`, `endorsementType`, `text`, `requirements[] {id, label}`.
- **CasePack** (output of the agent run): tariff version and label, clause, `citationValid`, product, concession, `endorsementRequired`, `facts`, `requirementResults[]`, `conflicts[]`, `evidence[]`, `signals`, `composite`, `recommendation`, `alternative {outcome, note}`, `reasons[]`, `gate {result, checks[]}`, `draftToPharmacy`, `abstainReasons[]`, `trace[]`, `state`, `agentVersion`, `agentInvoked`, `assemblySeconds`.
- **TraceStep**: `phase` (PLAN, GATHER, RETRIEVE, RECONCILE, ASSESS, RECOMMEND, ABSTAIN, CHECK, HAND_OFF), `title`, `cls` (boundary class), `summary`, `items[]`, `toolCalls[]`, `status` (ok, warn, fail, skipped).
- **ToolCall**: `tool`, `productionService`, `cls`, `input` (record), `outputSummary`, `sourceLabel`, `durationMs`, `status`.
- **Recommendation**: SUFFICIENT, REFER_BACK, REQUEST_INFORMATION, ABSTAIN, NONE.
- **CaseState**: cleared_by_rules, agent_review_complete, operator_review_required, additional_evidence_required, agent_abstained, human_decision_recorded.
- **HumanDecision**: ACCEPT, AMEND, REQUEST_INFORMATION, REFER_BACK, ESCALATE.
- **DecisionRecord**: `id` (DR-nnnnnn), `caseId`, `timestamp`, `tariffVersion`, `agentVersion`, `inputs[]`, `sources[]`, `checks[]`, `recommendation`, `decision`, `isOverride`, `overrideReason | null`, `operator`, `synthetic: true`.

## 5. Synthetic data (Keep the shape and the six behaviours; values may be regenerated)

### 5.1 Rulebook: three monthly versions (`tariff.ts`)

| Version | Clause 9 (NCSO) requires | Concessions |
|---|---|---|
| 2026-07 July | endorsement present, initialled | sertraline £3.12, metformin £2.40 |
| 2026-08 August | endorsement present, initialled **and dated** | sertraline £3.41, amlodipine £2.95, metformin £2.60 |
| 2026-09 September | as August | sertraline £3.20 (amlodipine withdrawn) |

Other clauses in every version: Clause 8 Broken bulk (BB: present, quantity stated), Clause 12 Out-of-pocket expenses (XP: present, initialled), Part VIIIB Specials (SP: present, invoice price, quantity stated). `versionForDate(isoDate)` returns the version in force; `versionById` supports replay. The August change to Clause 9 is what makes Case B flip when replayed under July (Keep).

### 5.2 Reference data (`reference.ts`)

Six products with code, name, pack size, category and basic price (all `SYN-` codes). Five pharmacies with contractor codes. Contractor history (referrals in the last 90 days with reasons). A fuzzy `productCandidates(text)` for uncertain reads.

### 5.3 The six cases (`cases.ts`)

| Case | Id | Set-up | Expected agent outcome | Expected state |
|---|---|---|---|---|
| A | EX-24107 | Riverside Chemist. Printed "NCSO JB 14/08/26", sertraline, dispensed 2026-08-14, claim matches | SUFFICIENT, gate PASS, high confidence | agent_review_complete |
| B | EX-24112 | Hillcrest Pharmacy. Handwritten "NCSO  RK" (initialled, not dated), amlodipine, dispensed 2026-08-21, £2.95 = August concession | REFER_BACK with the exact fix and a drafted note to the pharmacy; alternative SUFFICIENT shown as "not permitted"; gate PASS | operator_review_required |
| C | EX-24119 | Oakfield Pharmacy. Complete endorsement, but form/capture say quantity 56 and the claim says 84 | REQUEST_INFORMATION; conflict surfaced with both values, not resolved; alternative REFER_BACK explained | additional_evidence_required |
| D | EX-24123 | Meadow Lane Dispensary. Poor handwritten scan (quality 0.31), product and quantity unreadable, three readings disagree on what the note even is | ABSTAIN with three named reasons (no provision, quality below 0.60, only 1 of 3 readings agree); gate NOT RUN | agent_abstained |
| E | EX-24101 | Station Road Pharmacy. EPS item, no endorsement, amount at basic price | Cleared by deterministic pre-checks; agent never invoked; no model call | cleared_by_rules |
| F | EX-24088 | Hillcrest Pharmacy. Already decided; a seeded decision record DR-000871 (refer back, accepted, no override) | Shown through the record view | human_decision_recorded |

Six further "filler" rows make the queue read like a working day (ids EX-24104, 24109, 24115, 24120, 24098, 24093) with a state, a recommendation label and minutes in queue but no case pages.

## 6. The agent pipeline (`agent.ts`, `tools.ts`) (Keep the sequence, the classification and the stop conditions)

`runAgent(case, {tariffVersion?, agentEnabled?})` is deterministic and runs entirely in the browser. It returns a CasePack with a trace. In the initial build the model step is mocked by the three scripted readings per case; the interface says so wherever the result appears.

1. **PLAN, deterministic pre-checks** (`deterministic`): `mandatoryFieldsCheck` (product identified, quantity present, dispensing date present, prescriber present), `lookup_product_pack`, `lookup_claim`, `endorsementRequired(product, versionForDate, amountClaimed)`. Evidence items added: claim, extracted fields, product.
   - **Stop 1 (cleared):** if no endorsement is required, there is no endorsement text and all mandatory fields pass, the trace ends with HAND_OFF "Cleared by rules; agent not invoked", `agentInvoked=false`, recommendation NONE, state cleared_by_rules.
   - **Stop 2 (flag off):** if `agentEnabled` is false, the trace ends with HAND_OFF "Agent recommendations switched off; evidence only"; the case keeps its initial state; the operator sees evidence only.
2. **PLAN, the unknowns for this item** (`agent`): four questions: was an endorsement required this month; was one given and what does it claim; does it satisfy the provision in force on the dispensing date; do form, extracted fields and claim agree.
3. **GATHER** (`agent`): read-only tool calls chosen from the plan: `read_image_region` (endorsement margin), `read_image_region` (item line), `check_history`. Each finding carries its source and confidence; a low-confidence read is recorded with status `warn`, never papered over.
4. **ASSESS part 1, interpret** (mocked model): `sampleAgreement(readings)`; consensus facts are used only if at least 2 of 3 readings agree on type, presence, initialled and dated; otherwise the endorsement type is UNKNOWN.
5. **RETRIEVE** (`agent`): `retrieve_tariff(endorsementType, dispensingDate)` returns the version in force and the clause for that type. Evidence item added with the quoted clause text and the version's effective dates. If nothing is retrieved the step is `fail` and the agent may not cite a rule from memory (Keep).
6. **RECONCILE** (`agent`): `reconcile()` compares quantity (form vs claim), product code (form vs claim) and amount (claim vs concession price). Disagreements are listed with both values and marked material; the agent never chooses between them (Keep).
7. **ASSESS part 2** (`deterministic` tool calls inside an `agent` step): `run_endorsement_checks` evaluates each clause requirement against the consensus facts (present, initialled, dated, quantity stated, invoice price); `validate_citation` confirms the cited span exists in the clause of the version in force.
8. **Confidence composite** (`deterministic`, `compositeFrom(signals)`): five structural signals, never a self-reported percentage (Keep): provision found; readings agree (threshold 2 of 3); sources reconcile; image quality (threshold 0.60); in validated coverage. Any of the first, second or fourth failing means **abstain**. Otherwise: high if all five satisfied; medium if one weakness (conflict, out of coverage, readings not unanimous); low if more than one.
9. **RECOMMEND or ABSTAIN** (`agent`):
   - composite abstain: recommendation ABSTAIN, reasons listed, step status `fail`, no draft.
   - material conflict: REQUEST_INFORMATION; alternative REFER_BACK with a note on why it is worse for the pharmacy; draft asks the pharmacy to confirm the quantity.
   - any requirement unmet and a clause found: REFER_BACK; reasons name the clause, version and the missing requirement; alternative SUFFICIENT marked "not permitted: the gate blocks SUFFICIENT while a requirement is unmet"; draft note to the pharmacy states the item, the gap, the clause and version, and what to do ("nothing else is needed").
   - otherwise: SUFFICIENT; alternative REFER_BACK "would delay payment by a cycle with no rule requiring it".
10. **CHECK, compliance gate** (`deterministic`, `complianceGate`): pure code the model cannot influence (Keep). Always: recommendation cites a validated provision; mandatory fields present; agent has not priced or disposed. Then per recommendation: SUFFICIENT needs every requirement met (or no endorsement required) and no unresolved material conflict; REFER_BACK needs at least one requirement unmet; REQUEST_INFORMATION needs a material conflict or missing evidence. Result PASS, FAIL or NOT_RUN (for ABSTAIN and NONE). On FAIL the recommendation is withheld and the operator sees evidence only.
11. **HAND_OFF** (`human`): the case pack is written to the append-only record (`write_decision_record`) with the Tariff version and agent version pinned. State: agent_abstained, additional_evidence_required, agent_review_complete (SUFFICIENT and PASS) or operator_review_required.

`assemblySeconds` is the sum of tool durations plus a fixed synthetic model latency (34 s) and is labelled synthetic wherever shown. `price()` throws: the application refuses to price (Keep).

### Tool contracts (`TOOL_DEFINITIONS`, shown on the Architecture page)

| Tool | Class | Purpose | Production mapping (as stated in the initial build) |
|---|---|---|---|
| read_image_region | existing | Read the located endorsement margin and item line | Document layout analysis over the existing image store |
| lookup_product_pack | deterministic | Resolve product and pack from captured text | Product and pack master data (dm+d-aligned), read-only |
| retrieve_tariff | agent | Fetch the clause in force on the dispensing date for an endorsement type | Search over the versioned Drug Tariff corpus, filtered by effective date |
| lookup_claim | existing | What the pharmacy claimed | Claim ledger / submission records, read-only |
| check_history | existing | Recent referrals for the contractor | Case-management history, read-only |
| run_endorsement_checks | deterministic | Requirement and mandatory-field checks | Pure functions with unit tests |
| validate_citation | deterministic | Cited span exists in the corpus for the version in force | Pure functions |
| write_decision_record | deterministic | Append the case pack, later the human decision | Append-only store |

Every tool is read-only against its source; none can write to a payment (Keep).

## 7. Case-building trace screen (`/case/:id/trace`)

- Controls: **Replay step by step** (reveals one step every ~0.9 s, `aria-live="polite"`), **Show all**, **Clear**; summary line "N steps · N tool calls · Tariff <label> · agent invoked / not invoked".
- Each step is a card with a coloured left border by class, a monospace chip "01 PLAN", the title, the boundary tag and a status dot (OK, Attention, Failed, Skipped); then the summary, bullet items, and a tool-call table (Tool, Input, Result, Source, Production service, ms) where each tool row carries its own status and class tag.
- When all steps are shown: "Where it ends. The agent's part is over. The rest is a person." with buttons to the operator case pack and the Boundary page.
- No private model reasoning is displayed; the trace shows tool calls and structured outputs only (Keep).

## 8. Operator case pack (`/case/:id`) and the human decision

### 8.1 Alerts at the top
- Agent not invoked (cleared by rules, or flag off): neutral alert explaining the operator works the item as today with evidence attached.
- ABSTAIN: rose alert "The agent abstained" with the reasons; the item follows today's process unchanged.
- Gate FAIL: rose alert "Recommendation withheld by the compliance gate".

### 8.2 Layout (two columns on wide screens, 3:2)
Left: **Recommendation** card (recommendation badge, composite badge, gate result; reasons; alternative considered with its note; confidence signals as five labelled rows with pass/fail dots and a composite sentence; deterministic check results, one row per gate check; draft explanation to the pharmacy in a blockquote, "grounded in the decision record only; the operator reviews before it leaves"). **Applicable Drug Tariff provision** (part, clause title, version label, "citation validated against the corpus", quoted text, requirement rows met / not met / unknown). **Conflicts and missing evidence** (each conflict with both sources and values, a "material" marker and a note; or "the sources agree").
Right: **Prescription image** (synthetic form drawn as SVG with the located regions boxed and labelled with read confidence; the poor scan is skewed, faint and speckled); **Extracted fields, product and claim** (key-value list including capture confidences, master data, claim/ledger, concession this month, endorsement required, dispensing date); **Evidence** (every finding with field, value, source, provenance and class tag).

### 8.3 Operator decision (orange card, `human`)
- Five options with help text: Accept the recommendation; Amend; Request information; Refer back; Escalate. The recommended option is marked "(as recommended)" and pre-selected (SUFFICIENT maps to Accept, REFER_BACK to Refer back, REQUEST_INFORMATION to Request information, anything else to Escalate).
- **Reason** field: required (minimum 8 characters) when the choice departs from the recommendation or when there is no recommendation to accept; optional otherwise. Placeholder on override: "Why you are departing from the recommendation. This is the most valuable data the system collects." (Keep the mandatory-reason rule.)
- **Record decision** appends a DecisionRecord (inputs, sources, gate checks, recommendation, decision, override flag and reason, pinned versions), toasts the record id, sets the case state to human_decision_recorded and navigates to the record view. Footnote: nothing is paid or approved; in production the decision releases the item to existing deterministic pricing or returns it to the pharmacy.
- Once decided, the card shows "Decision already recorded for this case" with the record id; Reset demo (header) makes it workable again.

### 8.4 Decision and audit record (`/case/:id/record`)
- The latest record for the case: id, timestamp, operator, rule version used, agent version, decision vs recommendation, override reason, inputs, sources, checks. Empty state "No human decision recorded yet" with a link to the case pack.
- **Replay under a different rule version**: a select over the three Tariff versions re-runs `runAgent` with `tariffVersion` and shows the resulting recommendation, so the effect of a monthly change is visible (Case B under July becomes SUFFICIENT because July did not require a date) (Keep).
- "What this record deliberately is not": it is not a payment decision, not a pricing calculation, not a model's free-text reasoning.

## 9. Pharmacy pre-submission check (`/pharmacy`) (Keep: advisory, never blocks)

- Intro: the same agent that works NHSBSA's queue checks the endorsement against the rule in force on the dispensing date before the claim is sent; in production this runs where the claim is submitted (NHSBSA's Manage Your Service portal) and later inside dispensing software. A teal "Advisory only" alert.
- Controls: scenario toggle (Complete endorsement = Case A, Information missing = Case B, Unreadable form = Case D) and an **Agent available** switch.
- Left: the synthetic form with regions highlighted; product, quantity, dispensing date, amount to be claimed; an editable **Endorsement entered by the pharmacy** text field (monospace) with **Restore**; help text "Edit the endorsement and the check re-runs. Try adding a date such as 21/08/26."
- Right: a status card whose border colour follows the status:
  - **Ready to submit** (green): the endorsement appears to satisfy the rule in force; submit as normal; NHSBSA's own checks still apply.
  - **Information may be missing** (amber): "The endorsement appears to need: <missing requirements>. Correcting it now avoids a referral weeks later."
  - **Agent unable to determine** (grey): either the agent is unavailable ("Continue with submission as normal; NHSBSA processes the item exactly as today") or the form could not be read well enough / the type was not recognised ("the item will be checked by a person at NHSBSA").
  - Sections: Deterministic checks (endorsement required this month? plus the four mandatory fields, each Present/Missing, and the reason sentence); Rule retrieved for <date> (clause, version label, quoted text, requirement rows met / not met); "Reading of the note (mocked interpretation): ..."; buttons **Correct the information** (in scenario B, appends the dispensing date to the note and focuses the field) and **Continue with submission** (always enabled); on submit: "Submitted (synthetic). The result of this check travels with the claim, so if the item still reaches an operator the case starts pre-built. Nothing here changed what NHSBSA will pay."
  - Footnote: a check on a typed field, not a scan; nothing is scanned at the pharmacy.
- In the initial build the interpretation of the typed field is a small deterministic mock (`interpret()`: type from keyword, date from a d/m(/y) pattern, initials from a 2 to 3 capital-letter token). In production it is the same constrained model call the NHSBSA side uses.

## 10. Header controls after tour foundation

- Agent recommendations on/off (feature flag): off shows the fail-open path on every case (evidence only, no recommendation, state unchanged). Queue recommendations, including filler rows, are withheld. Pharmacy assistance is also withheld without blocking submission. Historical human records are unchanged; rule-version replay follows the current flag.
- Agent: On/Off is the visible and accessible control label. Its tooltip explains synthetic assistance, evidence-only Off and unchanged scene facts. Historical records stay unchanged.
- Reset demo opens a confirmation dialog. Keep working or Escape changes nothing. Reset demonstration restores seeded case states and records and calculator inputs, turns Agent on, restores tour/disclaimer visibility and remounts the current route to reset local pharmacy fields and replay selection. DR-000871 remains. The current route/fragment is retained. No record is persisted or payment affected.

There are no Presenter mode or Discussion mode buttons, bar, sheet, timers or
beat controls. The reference script is documentation, not a route or a header link.

## 11. Overview figures and case summaries

Scene consumes the registry's three key figures: approximately 1.1 billion
annual items, approximately 85,000 monthly referred-back items, and the stated
99.85% PPIA/PPPA target. Qualifications distinguish items from forms, referrals
from all exceptions, approximation from exact arithmetic, and targets from
achievement. No savings or operational-count headline is shown.

The A-D summaries invoke `runAgent` with the current flag. On shows the actual
recommendation and gate, B's missing-date fix, C's unresolved source values,
and D's three failed abstention signals with exact reasons in disclosure.
Off shows manual review tasks, with no fabricated minutes or effort counts.
Those tasks are illustrative assumptions, not observed NHSBSA practice.
All case links open the existing case pack; no new manual pack is built.

Other routes retain existing synthetic numbers pending a separate numerical
copy/source migration. This PR does not claim universal registry coverage.

## 12. Exception queue (`/queue`)

A filter toggle (All plus the six states) and a table of twelve rows: case id, routing reason, pharmacy, state badge, recommendation, minutes in queue, and for the six real cases a link to the case pack and to the trace. Empty state "No items in this state". With the agent flag off, recommendations show as "No recommendation (agent not run)".

## 13. Evaluation and guardrails (`/evaluation`) (illustrative; every figure labelled synthetic)

Scoreboard of nine metrics with value, target, status and note (agreement with expert adjudication; citation validity; evidence completeness; abstention rate; human override rate; handling time per exception, not measured; repeat-referral rate, not measured; cost per synthetic case; payment-accuracy guardrail unchanged by design). Performance by exception category (five categories with cases, agreement, abstention, note). Payment-accuracy guardrail. Go, reshape or stop criteria. "How this becomes evidence, in order": an eight-step delivery sequence from synthetic data to operator-assisted mode.

## 14. Assumptions (`/assumptions`)

A register of eight assumptions, each with statement, why it matters, evidence, how to validate, what if wrong, and whether being wrong kills, reshapes or leaves the idea intact. Plus "How the prototype's own claims are classified" (publicly supported; reasoned assumption; synthetic demonstration; proposed design decision; requires customer validation).

## 15. Architecture (`/architecture`)

"The flow, once" as a monospace diagram (existing estate, ingress, tier-0 pre-checks, agent with tools and a constrained model call, gate, append-only record, operator surface, human decision, pharmacy channel, evaluation gates, observability; pricing never enters; patient identity redacted before any model call). A component table (component; in this prototype; in production; NHSBSA owns; status Built for real / Mocked / Not built). The tool-contract table (section 6). "Deliberately not built" and "Why the prototype is shaped this way".

## 16. Demonstration guide outside the application

[demo-script.md](demo-script.md) retains seven timed beats with what to say and
show, all twelve discussion prompts and twelve challenge answers, the delivery
sequence, ownership, failure recovery, setup and deliberate omissions. It uses
the current control labels and marks future controls as planned. `/notes` no
longer has a page or navigation link and resolves to Page not found.

## 17. Accessibility and interaction conventions (Keep and improve)

Skip link to `#main-content`; every icon-only control has an `aria-label`; the trace list is `aria-live="polite"`; statuses use `role="status"`; form fields have visible labels and `aria-describedby` help; focus-visible outlines on all interactive elements; reduced motion respected (`MotionConfig reducedMotion="user"`); colour is never the only carrier of meaning (dots are paired with words); surfaces and text use semantic tokens so the OS dark theme works; accent colours carry at least 4.5:1 contrast against their text.

## 18. Non-functional (Keep)

- Static single-page application; no back end, no network calls, no analytics, no storage beyond memory. Reset returns to the seeded state.
- Runs on GitHub Pages under a sub-path (`/BSA/`); deep links resolve through a `404.html` copy of `index.html`.
- No real personal data anywhere. Every screen carries the synthetic label.
- UK English throughout. No vendor branding in the interface; the production mapping on the Architecture page may name services because that is its purpose.
