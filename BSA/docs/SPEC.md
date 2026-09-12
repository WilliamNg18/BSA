---
title: Functional specification for Prescription Exception Case Builder
description: Current routes, synthetic evidence, shared lifecycle and human-controlled round trip.
ms.date: 2026-09-12
---

## 1. Purpose and authority

A static capability demonstration using synthetic prescription exceptions,
scripted interpretation and a versioned synthetic rulebook. It is not a clinical,
pricing or operational service.

> The agent gathers evidence and recommends. Deterministic code validates and
> calculates. A human decides. The prototype does not calculate or approve payments.

The integrated application implements the lifecycle, claims/detail, cross-side
round trip, eight-chapter tour and navigation. Source `898cda5` has passed
integrated functional acceptance; [PROGRESS.md](PROGRESS.md) owns final task
ticks, and owner-run hosted verification remains separate.

### Reference-grounded aim and outcome boundary

The public [source register](../data/reference/source-audit.ts) retains the
supplied single-page PDF and version 5 research pack, their locators and
qualifications. Its PDF-A02/A03/A04 assumptions require validation of material
assembly effort, evidence across sources and interpretation beyond rules.
They do not establish that today's tools are absent or that an agent is needed.

The proposed aim is a bounded assistant that assembles evidence and recommends
while existing capabilities, deterministic validation and human authority remain.
H08, H10 and H13 identify candidate outcomes: operator capacity, reconstructable
decisions and reduced pharmacy rework/affected-item delay. D-VALUE requires
separate benefit/cost accounting without double-counting; D-STOP requires agreed
evidence to proceed, reshape or stop. These are discovery hypotheses, not measured
benefits, calibrated accuracy or a payment guarantee.

The two local demonstration surfaces do not establish the existence of a common
operational service or a deployment commitment. D-PHASES distinguishes a proposed
operator-first slice from optional pharmacy integration; D-ADVISORY keeps
submission non-blocking. Document names may appear here and in comments,
not in website interface copy.

## 2. Boundary classes

| Class | Responsibility |
| --- | --- |
| `existing` | Existing capture, image store, claim ledger, case history and routing capabilities, represented by synthetic data |
| `deterministic` | Requirement checks, reconciliation arithmetic, citation validation, structural confidence, compliance gate and record writing |
| `agent` | Gather evidence, retrieve the applicable provision, compare sources and recommend or abstain |
| `human` | Review evidence, approve a pharmacy draft and explicitly record a decision |

Tags appear with actions and evidence. Colour is supplementary to text.
The agent cannot change a lifecycle state, invent a citation, resolve a material
conflict, bypass the pure gate or price an item. `price()` refuses pricing.

## 3. Information architecture

The header contains Overview, Operations (Pharmacy check, Pharmacy claims,
NHSBSA queue) and How it works (Evaluation, Boundary, Assumptions,
Architecture), plus Agent and Reset. Narrow layouts use Open navigation.
The shield links home. The synthetic banner and governing principle remain
available on every route.

### Eight chapters, nine stops

| Chapter | Route | Current content |
| --- | --- | --- |
| 1: The scene | `/#scene` | Qualified public figures, shared estimates with scene-only On count-in and existing process |
| 2: A month in numbers | `/#month` | Editable calculator with Today/assisted comparison |
| 3: What exists today and what changes | `/#pipeline` | Six operational stages and phase-related evidence-assembly comparison |
| 4: Four cases | `/#cases` | A-D pain/results with Open case and Follow actions in both modes |
| 5: One agent, two places | `/#two-places` | Longer manual/shorter assisted preparation loops, pharmacy referral experience and same-item links |
| 5: Pharmacy example | `/pharmacy` | Optional scripted precheck and explicit submission |
| 6: The queue | `/queue` | Virtual month, manual work, visible-row sweep and read-only Compare |
| 7: What the pharmacy sees | `/pharmacy/claims` | Full referral-cycle guide, actual recorded state, claim detail and history |
| 8: Where it ends | `/#close` | Referral-reason discovery, assumptions and questions |

Next and Back follow this exact sequence. The chapter menu has eight entries;
Pharmacy example is a substop, not a ninth chapter. Only one Overview chapter
renders at a time. Bare `/` and unknown home fragments show scene.
Off-tour routes show Start. Dismiss tour and Restore tour are session choices.
Alt+ArrowLeft/Right navigate outside editable fields, menus and dialogs.

### Route inventory

| Route | Screen |
| --- | --- |
| `/` and the six fragments above | Overview |
| `/pharmacy` | Pharmacy check |
| `/pharmacy/claims` | Claims list |
| `/pharmacy/claims?caseId=:id` | Selected claim detail; legacy `case` query also accepted |
| `/queue` | Exception queue and shared session queue |
| `/case/:id` | Operator case pack |
| `/case/:id/trace` | Case-building trace |
| `/case/:id/record` | Decision and audit record |
| `/evaluation` | Synthetic evaluation and guardrails |
| `/boundary` | Agent/code/human boundary |
| `/assumptions` | Assumptions and validation |
| `/architecture` | Tool contracts and proposed production architecture |
| Other paths, including removed `/notes` | Not found with Go home |

Case pages share a header, Back to queue, View pharmacy claim and a Case views
tab strip. Same-item links use the shared case ID, including generated claims.
Unknown cases have a recovery link rather than an invented pack.

## 4. Models and storage

`src/lib/domain` owns cases, product/reference data, tariff versions, rules,
scripted tools, baseline arithmetic and lifecycle contracts. `src/lib/store.ts`
owns session state. Scenario changes clone data instead of changing canonical
fixtures. Only presentation preferences may persist.

An `ExceptionCase` contains the case ID/scenario, synthetic pharmacy and patient,
capture quality/regions, extracted fields, claim and scripted readings.
`runAgent` returns a `CasePack`: evidence, provision/version, checks, conflicts,
five confidence signals, composite, recommendation, gate, draft and trace.
These outputs do not themselves create a human decision or lifecycle event.

### Chapter 2 baseline model

The authoritative equations/defaults are in
[task-1-baseline-model.md](task-1-baseline-model.md). `V` is the scenario volume;
`g` sums seven editable gathering durations and `j` is judging time per item.
Pharmacy-caught `P`, rule-cleared `C`, abstained `A` and built `B` are disjoint,
sequentially rounded cohorts summing to `V`. The monthly calculator uses `V * j`
for judging on both sides; pharmacy catch counts items, not saved minutes.

Projected referrals are `round(B * db) + round(A * da)`, using editable
deficient-built and deficient-abstained fractions. The separate risk residual
is `R = A + round(B * db)`: every abstention plus deficient built items, with
no second addition of deficient abstentions. For positive `V` and `R`, the
referral-free proxy is `(V - R) / V * 100`, rounded down to one decimal for
display. Zero volume or residual means Not established, never 100% accuracy.

The scene, calculator, pipeline and queue consume shared scenario assumptions.
Approximately 85,000 monthly referrals is a 2024/25-context scale proxy, not the
whole exception queue. Approximately 1.1 billion primary-care items per year in
England (reporting year unspecified) and monthly rulebook publication are
documentary context, not independently verified figures or a measured change rate.
One Sources line sits on chapter 1; the documentary audit remains outside the
client. No public-document retrieval occurs at runtime.

On scene estimates count in numerically over the presentation interval while
accessible names retain exact final values. Off and reduced motion are immediate.
Input/toggle/route changes cancel stale frames. The three public cards do not
become animated invented facts, and count-in is not work or model latency.

## 5. Canonical synthetic cases

### 5.1 Synthetic rulebook

July, August and September 2026 are synthetic versions. NCSO needs presence and
initials in July; August and September additionally require a date. Broken bulk,
expenses and specials have their own synthetic requirements. The effective
dispensing date selects the version; replay may explicitly choose another.

### 5.2 Synthetic reference data

Products use `SYN-` codes; five pharmacies and all prices/claims are synthetic.
Claimed/concession amounts are evidence, not a payment calculation.

### 5.3 The six cases

| Case | ID | Agent On result and invariant |
| --- | --- | --- |
| A | EX-24107 | Complete endorsement: SUFFICIENT, gate PASS |
| B | EX-24112 | Initialled, not dated: August REFER_BACK with exact fix; July replay SUFFICIENT |
| C | EX-24119 | Form/capture quantity 56 versus claim 84: REQUEST_INFORMATION; preserve both values |
| D | EX-24123 | ABSTAIN: quality 0.31 below 0.60, no provision and only 1/3 readings agree; gate NOT RUN |
| E | EX-24101 | Deterministic clearance, agent never invoked, no model call |
| F | EX-24088 | Already decided; seeded DR-000871 remains historical |

Turning Agent Off removes proposals but does not rewrite these fixtures,
decisions or lifecycle history. Code-only E clearance remains visible.
Metadata-only queue examples do not acquire invented agent results.

<a id="6-the-agent-pipeline-agentts-toolsts-keep-the-sequence-the-classification-and-the-stop-conditions"></a>

## 6. Evidence pipeline and gate

`runAgent(case, { tariffVersion?, agentEnabled? })` is deterministic, offline
orchestration of scripted tool results, not a live language-model request.

1. Code checks mandatory fields, product, claim and whether endorsement is needed.
   E exits with code-only clearance; Off exits to manual evidence review.
2. PLAN identifies missing evidence. GATHER reads synthetic image regions and
   history. Scripted readings agree only when at least two of three match.
3. RETRIEVE obtains the clause for the endorsement type and dispensing-date
   version. No provision means no citation from memory.
4. RECONCILE preserves both sides of product, quantity and amount disagreements.
5. ASSESS runs requirement checks and citation validation. Confidence uses
   provision found, sample agreement, reconciliation, image quality and coverage,
   not a self-reported percentage. Missing provision, disagreement or low image
   quality triggers abstention.
6. RECOMMEND proposes Sufficient, Refer back or Request information, or ABSTAIN
   names the stop conditions. Proposed text has no sending authority.
7. CHECK is pure `complianceGate`: citation, mandatory fields, no pricing/disposal
   and outcome-specific requirements. Sufficient cannot pass with an unmet
   requirement or unresolved material conflict. ABSTAIN/NONE yield NOT RUN.
8. FAIL withholds recommendation, alternative and pharmacy draft while preserving
   evidence and failed checks. HAND_OFF ends the agent's part; a human decides.

Phase chips include PLAN, GATHER, RETRIEVE, RECONCILE, ASSESS, CHECK, RECOMMEND,
ABSTAIN and HAND_OFF as applicable, not nine compulsory steps for every case.
Observable actions, tool inputs/results and boundaries are exposed; private
model reasoning is not. Synthetic durations are not measured inference latency.

## 7. Case pack, trace and record

The pack pairs synthetic form/claim evidence with applicable provision, checks,
conflicts and the human decision. On adds gated recommendations and assembly
slots. Off presents competent manual tasks and evidence-only comparisons.
D shows named abstention reasons; E explains why no agent was called.

Trace playback has play/pause, stepping and completion controls using the shared
two-second presentation clock. Reduced motion is respected. Replay changes
presentation only, never a decision or lifecycle. Off exposes manual work and
does not pretend to replay an agent trace; E retains deterministic evidence.

An active review permits Accept/Sufficient, Amend, Request information, Refer
back or Escalate as applicable. Recommended choices are labelled. A reason of
at least eight characters is required for an override, a manual decision without
a recommendation, and every referral, information request or escalation even
when recommended. Invalid input produces a visible error.
Explicit **Approve this draft for the pharmacy** is separate from recording
the decision; toggling On is never approval.

Record decision appends the human decision with revision, timestamp, inputs,
sources, checks and versions, then opens the record. An already-disposed case
requires an explicit new demonstration attempt, not a second silent decision.
Manual NONE decisions have no recommendation to override.

The record page shows an honest empty state when no human record exists.
Existing records survive flag changes. Counterfactual **Replay with** compares
July/August/September against recorded evidence without mutating history or
the current resubmission. It is disabled in manual mode or without a recorded
rule version. B's original undated August record becomes Sufficient under July.

## 8. Shared lifecycle and human authority

Lifecycle states are distinct from evidence-pack `CaseState` classifications.
`lifecycles`, immutable `caseRevisions` and decision records are shared between
pharmacy and NHSBSA views, with no parallel operational store.

| Lifecycle | Pharmacy label | How it advances |
| --- | --- | --- |
| `submitted` | Submitted, awaiting processing | Explicit pharmacy submission |
| `in_review` | In review at NHSBSA | Explicit Start review/Open for review |
| `information_requested` | Information requested: NHSBSA needs you to confirm something | Human Request information |
| `referred_back` | Referred back: correction needed before payment | Human Refer back |
| `resubmitted` | Resubmitted, awaiting re-check | Explicit pharmacy correction/resubmission or confirmation |
| `paid` | Payment approved (synthetic) | Human sufficient disposition, or E's deterministic clearance, attributed to existing pricing |
| `escalated` | In review at NHSBSA (senior review) | Human Escalate |

Only NHSBSA's `in_review` wording changes with assistance: Awaiting operator
versus Case built, awaiting operator. Pharmacy state labels do not vary by toggle.
History lists actor, transition, reason, version/clause, revision and approval
metadata where present. Old attempts retain their own endorsement and precheck
snapshot. Reset/reload restores seeds; this is not durable audit storage.

## 9. Pharmacy check and claims

`/pharmacy` offers Complete endorsement (A), Information missing (B) and
Unreadable form (D), an editable endorsement and Restore. Off performs no
advisory check; On runs a cancellable two-second scripted check. Agent available
models unavailable assistance without blocking **Continue with submission**.
Intentional Off is labelled **Not checked: manual submission**; On with unavailable
assistance is **Agent unavailable: manual submission**. Only an actual failed
scripted interpretation is **Agent unable to determine**. Manual work is not
presented as a broken service.
Edits invalidate old checks. B's date is applied only by explicit action.
D stops at capture; later steps are NOT RUN even if typed text appears complete.

Submission stores an immutable attempt/advisory snapshot and offers
**View submitted claim**. An illustrative local timeline is not automatic
lifecycle progress or a payment guarantee.

`/pharmacy/claims` filters five synthetic pharmacies and seven states. Totals sum
matching claimed amounts, not payments. Open claim selects detail by shared ID.
Read-only states do not offer correction/confirmation fields.

The **Referral cycle guide** explains Referred back, Corrected, Resubmitted,
Re-checked and Paid (synthetic only), with distinct Today/With agent preparation
copy. **Recorded claim state** shows the actual selected lifecycle alongside
links to **Open this pharmacy claim** and **Open this operator case**. Opening
the guide changes no stage. A local unsent correction is not a lifecycle state.

Referred-back claims offer **Corrected endorsement** and **Resubmit claim**.
On adds **Re-check endorsement**; a permitted date correction requires the
operator-approved draft. Applying it invalidates the prior check, so re-check
again before showing Ready to resubmit. This advisory status never blocks
resubmission or guarantees payment. Off allows typed manual correction.
Its pain marker identifies the absence of an advisory sufficiency check as a
synthetic assumption, not evidence about real pharmacy checks. On resolves the
marker only when the current text is Ready and an approved instruction exists;
editing invalidates readiness. Human re-check remains required.

Information-requested claims show both conflicting values and **Pharmacy
confirmation** / **Send confirmation**. Empty confirmation is rejected.
Confirmation appends evidence and requires human re-check; it does not select
a winning quantity. On pharmacy-facing draft instructions must be explicitly
operator-approved and labelled as such.
Raw human reasons remain visible to NHSBSA and in the Off pharmacy comparison.
Pharmacy On response and history expose only explicitly approved drafts,
labelled **Operator-approved note**; toggling does not approve a missing draft
or change stored history.

**Demonstration replay** / **Submit another demonstration attempt** explicitly
appends a new revision for a seeded or disposed item. Prior attempts remain.
Follow this case/Follow this item and the Followed item banner's **Switch side**
links keep one ID through navigation. Merely switching sides does not start review.

## 10. Queue and Today

Pinned canonical cases coexist with a bounded virtual month. State filters,
manual seven-step work, projection counts and **Run agent on visible rows** /
**Step sweep** / **Cancel sweep** operate on illustrative work. The shared
session queue separately exposes submitted/resubmitted cases with **Open for
review**. A sweep never records a human decision or changes a lifecycle state.

The day projection is a single-operator capacity model, not the monthly
calculator's fixed-cohort judging comparison. Built and abstained items share
one elapsed-time allowance; pharmacy-caught and code-cleared items add no human
judging time there. Synthetic assembly latency is not operator labour.

**Compare** in Queue controls opens the inline **Today versus With agent**
region using the current scenario and day clock. It does not toggle assistance,
run a sweep or write a record. **Close comparison** or Escape returns focus to
Compare. Reset/input revision closes the comparison; invalid inputs disable it.
**Jump to 17:00** reveals the end-of-day projection, not work actually performed.

Today on a metadata-only item opens a labelled manual-work example with seven
assumed tasks and judging duration. It must remain usable and honest, not a
broken link or fabricated full evidence pack. Projection speed/benefits are
not measured operational performance.

## 11. Reflective pages

Evaluation exposes illustrative synthetic metrics, risks and guardrails, not
an accuracy claim. Boundary separates existing capability, code, agent and
human authority. Assumptions states how claims could be validated or disproved.
Architecture describes read-only tool contracts and a proposed production
mapping; it does not assert those services are deployed.

The first-test chapter requests referral-reason evidence before proceeding.
The [demo script](demo-script.md) supplies the exact-click story and discussion
prompts outside the interface. Presenter/Discussion UI and `/notes` are removed.

## 12. Global controls and accessibility

Agent starts Off. On/Off is reversible, never a lifecycle or approval action.
Reset demo opens confirmation; Keep working/Escape leaves the session unchanged.
Reset demonstration restores seeds (including DR-000871), calculator defaults,
Agent Off, tour/disclaimer visibility and local route controls without changing
the current URL.

UK English, no em dashes, no vendor/product/document names in interface copy
outside the permitted Architecture mapping, under 25 words of prose per panel,
and one qualified Sources line are content requirements. The synthetic label
and governing principle cannot disappear with optional disclosure content.
Keyboard operation, focus visibility, semantic labels, non-colour status,
live announcements and reduced motion are required by WCAG 2.2 AA intent.
Automated axe is necessary, not proof of full manual conformance.

## 13. Hosting and verification

The owner-selected existing Azure App Service F1 serves root `/` (issue #48,
superseding SWA). Root `hosting.config.json`, a static server and Git build-info
are emitted to `BSA/dist`; SPA deep links and strict headers are preserved.
Main/manual deployment uses OIDC, not a publish-profile or SWA token. F1 has no
PR slots. See [DEPLOYMENT.md](DEPLOYMENT.md) for the verified target and separate
actual hosted-release verification.

Blocking: typecheck, lint, build, Vitest, production crash/dead-control browser
checks and zero-violation axe. There are no size or performance budgets.
CI gzip reporting, prose counts, Lighthouse and screenshot differences are
informational. Functional defects remain blocking even when discovered during
an informational visual review.

Integrated source `898cda594d0dcb34376bddab7112edcddb172440` corresponds to the
accepted R head `6e424ac75c4980380c31f9e3aab23243a9a013d0`:
[CI 34689966621](https://github.com/WilliamNg18/BSA/actions/runs/34689966621)
passed check, 607 units in 22 files, 1,019 blocking Chromium tests and three
separate informational quarantine cases. Successful-run audit artifacts were
not uploaded; do not turn that test result into an invented deduplicated axe
report count. The screenshot manifest records a separate set of actual audits.

[Current captures](screens/integrated/README.md) are fresh root-path production
images at 1440px in both Agent states. They are not copied historical captures.
[KNOWN-ISSUES](KNOWN-ISSUES.md) records genuine limitations and evidence scope;
older measurement logs remain historical rather than current release claims.
