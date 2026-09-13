---
title: Functional specification for Prescription Exception Case Builder
description: Shared process model, explicit capture, automatic routing and human-controlled endorsement judgement.
ms.date: 2026-09-13
---

## 1. Purpose and authority

This describes the Tasks 19-24 integrated process, not a declaration of final
hosted acceptance. [PROGRESS](PROGRESS.md) owns release status.
[FIRST-TIME-VIEWER](FIRST-TIME-VIEWER.md) and the original
[hosted checklist](live-verification/README.md) retain their historical builds;
they are not relabelled as evidence for this migration.

This is a static demonstration using synthetic prescription exceptions, scripted
interpretation and a versioned synthetic rulebook. It is not a clinical, pricing
or operational service.

> The agent verifies the submission and advises; a person decides.
> Deterministic code routes complete items to existing pricing.
> The prototype does not calculate or approve payments.

The public [source register](../data/reference/source-audit.ts) preserves the
supplied single-page PDF and version 5 research pack, locators and qualifications.
Their assumptions require validation of material evidence-gathering effort and
interpretation beyond deterministic rules. They do not establish that today's
tools are absent or an agent is necessary. Less repeat handling, reconstructable
decisions and reduced pharmacy rework are hypotheses, not measured benefits.
Separate benefit/cost accounting and explicit proceed/reshape/stop criteria
remain required. Document names belong in this audit, not interface copy.

## 2. Boundary classes

| Class | Responsibility |
| --- | --- |
| `existing` | Synthetic representations of image store, claim ledger, history and pricing capabilities |
| `deterministic` | Requirements, reconciliation arithmetic, citations, structural signals, gate, routing and records |
| `agent` | Gather evidence, retrieve the applicable provision, compare sources and advise or abstain |
| `human` | Submit, capture/reconcile paper, approve an optional draft and explicitly record Type 2 judgement |

Tags pair text with colour. Advice cannot commit a decision, invent a citation,
resolve a material conflict, bypass the gate or price an item. `price()` refuses
pricing. No agent toggle or perspective change writes operational history.

## 3. Information architecture

The header groups Overview, Operations (Pharmacy check, Pharmacy claims,
NHSBSA queue) and How it works (Evaluation, Boundary, Assumptions, Architecture).
Perspective, the sole Agent switch and Reset are shared controls. Narrow layouts
use Open navigation. The synthetic banner and governing principle remain visible.

Perspective defaults to Both. Pharmacy/NHSBSA filter operational navigation and
hide tour/Follow controls. Opposite-side routes keep their URL and show a switch
prompt, not a redirect. Switching preserves evidence, approvals and history.
Both restores the tour and same-item Follow/Switch side controls.

### Eight chapters, nine stops

| Chapter | Route | Content |
| --- | --- | --- |
| 1: The scene | `/#scene` | Most items need no person; attributed public volumes and separate model estimates |
| 2: A month in numbers | `/#month` | Shared process inputs and simultaneous Today / With the agent columns |
| 3: What exists today and what changes | `/#pipeline` | EPS and paper branching through automatic pricing, Type 1, Type 2 and referral |
| 4: Four cases | `/#cases` | A automatic, B referred back, C conflict and D explicit capture |
| 5: One agent, two places | `/#two-places` | Assistance across pharmacy and NHSBSA, with distinct capture and judgement boundaries |
| 5: Pharmacy example | `/pharmacy` | EPS/Paper declaration, advisory checks and explicit submission |
| 6: The queue | `/queue` | Actual Type 2 work and separate Type 1 capture |
| 7: What the pharmacy sees | `/pharmacy/claims` | Counted claims, selected detail, referral correction and immutable attempts |
| 8: Where it ends | `/#close` | Evidence for a first test, assumptions and stop criteria |

The chapter menu has eight entries; Pharmacy example is a substop. One home
chapter renders at a time. Bare `/` and unknown fragments show scene.
Next/Back and Alt+ArrowLeft/Right navigate outside fields, menus and dialogs.
Dismiss/Restore tour are session choices. Presenter/Discussion UI and `/notes`
are removed; the [demo script](demo-script.md) carries presenter guidance.

Operational routes are `/pharmacy`, `/pharmacy/claims`, `/queue`, `/case/:id`,
`/case/:id/trace` and `/case/:id/record`. Claims accept `?caseId=:id` and the
legacy `case` query. Reflective routes are `/evaluation`, `/boundary`,
`/assumptions` and `/architecture`. Unknown cases/routes show recovery, not
invented evidence. Case views preserve ID through pack, trace, record and pharmacy.

## 4. Models and storage

`src/lib/domain` owns typed cases, references, rules, routing and lifecycle
contracts. `src/lib/store.ts` is the sole operational store. Pharmacy submission,
Type 1 capture, Type 2 decisions, confirmation and resubmission delegate into
shared APIs rather than maintaining independent page state. Input drafts and
presentation controls may be local; committed evidence is not.

Immutable revisions keep the submitted channel, declaration and original image.
Item processes identify the current revision, routing and any confirmed capture.
Records and lifecycle events are append-only until explicit Reset/reload.
No durable audit service, runtime backend or live model is supplied.

### Chapter 2 monthly model

`selectProcessMonth` / `calculateProcessMonth` in
`src/lib/domain/process-month-model.ts`, shared through `useProcessMonth()`,
replace the referral-only presentation. Legacy baseline contracts remain for
compatibility; their 12-minute cohort and operator-capacity outputs are not the
current process tiles.

Let `N` be monthly items, `T` Type 2 items, `R` monthly referrals, `K` pharmacy
catches, `A` abstained Type 2 items and `B` built Type 2 items.

| Quantity | Calculation / boundary |
| --- | --- |
| EPS / paper | Rounded `N * epsPercent / 100`; paper is the remainder |
| Type 1 / Type 2 | Each is a rounded percentage of `N`; lanes can overlap |
| Staff touched | A separate union, at least each lane and at most their sum or `N` |
| Automatic | `N - staffTouchedItems`, not a session completion count |
| Pharmacy catches | `K = round(R * pharmacyCatchPercent / 100)` |
| Remaining Type 2 | `T - K`; split into rounded abstentions `A` and remainder `B` |
| Today Type 2 hours | `T * type2SecondsToday / 3600` |
| Assisted Type 2 hours | `(B * builtJudgingSeconds + A * type2SecondsToday) / 3600` |
| Referral investigation | `R * investigationMinutesToday / 60`; assisted uses `R - K` |
| Pharmacy completion | `R * pharmacyCompletionMinutes / 60`; assisted uses `R - K` |
| Type 1 | Separate keying/confirmation seconds, not added to Type 2 labour |

Today and With the agent are always shown together. Built cases, abstentions,
catches, remaining referrals and rule/reason assurance are scenario outputs,
not actual decisions, measured accuracy or guaranteed savings.

The supplied context is over 100 million monthly items, roughly 91% EPS / 9%
paper, 2.2 million Type 1, 2 million Type 2 and 85,000 referrals. Figures are
attributed, not independently verified. The roughly 12-14-second Type 2 average
(13-second default) is distinct from the four-minute referral-investigation
and six-minute pharmacy-completion assumptions. Their cohorts and effort must
not be added or double-counted. Monthly rule publication is not a change rate.

Invalid or blank drafts show field errors and no stale result. Counts require
bounded integers; percentages are bounded; referrals cannot exceed Type 2;
the staff-touched union must cover both lanes without exceeding their sum.
Scene, month, queue and pharmacy consume the same shared result and formatters.
Accessible names retain final values during scene count-in; Off/reduced motion
are immediate, and navigation/input changes cancel stale animation.

## 5. Canonical synthetic cases

July, August and September 2026 are synthetic rule versions. NCSO requires
presence and initials in July; August/September also require a date. Dispensing
date selects the version; recorded replay may select a different version.
Products use `SYN-` codes. Claim/concession amounts are evidence, not payments.

| Case | ID | Current route and invariant |
| --- | --- | --- |
| A | EX-24107 | Complete existing-rules automatic pricing, no human approval/work row |
| B | EX-24112 | Seed is referred back; missing date needs Type 2 judgement, corrected complete EPS auto-prices |
| C | EX-24119 | Seed is information requested; quantity 56 versus 84 survives confirmation |
| D | EX-24123 | Initial Type 1 capture abstention; original quality 0.31 below 0.60 and only 1/3 agreement |
| E | EX-24101 | Code-only automatic clearance, no model call or human approval |
| F | EX-24088 | Historical human record DR-000871 and its recorded rule remain unchanged |

A/D seeds are paper; B/C/E/F seeds are EPS. Explicit submitted channel and
current revision metadata govern routing, not legacy fixture channel labels.
Unsupported BB/XP supplied endorsements continue to Type 2 judgement.
D's machine evidence is never silently upgraded by declaration pre-fill.

<a id="6-the-agent-pipeline-agentts-toolsts-keep-the-sequence-the-classification-and-the-stop-conditions"></a>

## 6. Evidence pipeline and gate

`runAgent(case, { tariffVersion?, agentEnabled? })` produces a scripted,
offline evidence pack, not a live inference request or a human decision.
Code-only clearance avoids agent work; Off exposes manual evidence.

PLAN identifies evidence needs; GATHER reads synthetic sources; RETRIEVE pins
the applicable clause/version; RECONCILE preserves disagreements; ASSESS
checks requirements and five structural signals. These signals are provision,
sample agreement, reconciliation, image quality and coverage, not calibrated
confidence. No provision, inadequate agreement or poor source quality withholds
advice. Material conflicts are never resolved by selecting a winning value.

RECOMMEND or ABSTAIN exposes the proposed outcome or stop conditions.
Pure `complianceGate` checks citation, mandatory fields, outcome requirements
and the no-pricing boundary. Sufficient cannot pass with unmet requirements or
material conflict. ABSTAIN/NONE produce NOT RUN. FAIL withholds recommendation,
alternative and draft while retaining failed checks and evidence. HAND_OFF
leaves judgement with a person. Not every case executes every phase.
Tool inputs/results and observable actions are visible; private reasoning is not.
Synthetic animation duration is not operational or inference latency.

## 7. Case pack, trace and record

The pack pairs synthetic form/claim evidence with dated provisions, conflicts,
checks and human choices. On adds permitted advice; Off retains competent
manual evidence. E shows deterministic clearance. D initially shows capture,
named abstention reasons and no Start review or Record decision control.

Other actionable submissions require explicit **Start review**; **Open** only
navigates. A disposed seed requires an explicit demonstration attempt before
another review. Accept/Sufficient, Amend, Refer back, Request information and
Escalate remain explicit human choices. Refer back requires an RB code and
human reason; invalid input produces a visible error. Draft approval is optional
and distinct from recording. Only a checked **Approve this draft for the
pharmacy** stores an approved generated note.

Records preserve revision, timestamp, evidence, checks, original rule and human
reason. No record exists merely because advice was generated. **Replay with**
compares another synthetic month against recorded evidence without writing
history; manual mode or no recorded rule disables replay. A gate-failed record
without a recorded clause truthfully shows **Not recorded**, not a citation
inferred from surrounding Tariff context. B's undated August referral can be
sufficient under July without altering its original decision.

Trace play/pause, stepping and completion use a two-second presentation clock.
Off exposes manual work; E keeps deterministic evidence. Playback and
reduced-motion preferences never alter operational state.

## 8. Shared lifecycle and human authority

Lifecycle, evidence classification and process routing are distinct but share
one authoritative item/revision. Explicit submission may immediately append
existing-rules auto-pricing for complete EPS; no review/decision is needed.
Capture, human referral/information request/escalation and subsequent
resubmission append their own evidence/events. Opening a page does not.

The paid label is **Paid on the normal schedule (synthetic)**, attributed to
existing pricing rather than an agent. Human sufficient disposition remains
human-decided staff work, even after pricing. Complete EPS correction does not
require a second decision; C confirmation does, and new paper requires capture.
Agent/perspective changes preserve all attempts, approvals, timestamps and IDs.

## 9. Pharmacy check and claims

`/pharmacy` offers Complete endorsement, Information missing and Unreadable form,
explicit EPS/Paper radios, endorsement editing and Restore. Paper declaration
fields default blank and remain labelled as pharmacy declarations, not image
readings. On performs a cancellable scripted precheck; Off is **Not checked:
manual submission**, not an outage. Edits invalidate previous checks.

**Apply fix** applies a human-requested correction, never a submission.
**Continue with submission** remains available even when advice is incomplete;
the receipt labels such a checked attempt as submitted anyway. Submission stores an immutable attempt and
offers **View submitted claim**. Its timeline uses actual events, not assumed
future payment or a month-end schedule.

Claims have five pharmacy choices, four counted filters (Action needed,
Waiting on NHSBSA, Paid this month, All) and one five-column table. Row actions
are Correct and resubmit, Send confirmation or View. Amounts are claimed
(synthetic). Select the owning pharmacy when revisiting without a case deep link.
Recorded monthly counters and the whole-service scenario are explicitly separate.
Caught-before-submission counts explicit correction evidence once per attempt,
not projected catches or a hidden automatic submission.

Referrals require a corrected endorsement and explicit **Resubmit claim**.
On may **Re-check endorsement**; a suggested date correction requires an
operator-approved draft. Applying it invalidates prior checking. Off permits
manual correction. A ready complete EPS item routes automatically in either
mode; paper resubmission requires fresh capture. On displays only approved
generated notes; Off and NHSBSA retain the human reason.

C's **Pharmacy confirmation** rejects blank text, appends the actual response
and returns to human review with 56/84 unchanged. **Demonstration replay >
Submit another demonstration attempt** creates a new revision for a disposed
seed. Paper replay uses the retained declaration, names its provenance, retains
the original scan and never confirms capture.

### Type 1 capture

Off starts manual fields blank beside the original image. On may prefill a
prior declaration, labelled **declared by the pharmacy, not read from the form**.
No declaration means blank fields, not invented values. Proposed confirmation
requires **I have reconciled the declaration with the paper**; editing clears
that checkbox. Explicit confirmation appends capture evidence and routes onward.
It is not a Type 2 decision or a repair of the machine image.

Compatible confirmed evidence can support subsequent Type 2 advice; mismatches
and uncertainty withhold it. Missing prescriber remains a mandatory gate failure.
A complete, source-compatible non-D manual capture can continue to existing
pricing without declaration reconciliation or Agent On. D's poor-source manual
path still requires Type 2; proposed declaration assistance still requires the
explicit reconciliation checkbox. Completed Type 1 is labelled as human capture,
not awaiting capture or a no-person automatic item.
A fresh paper revision cannot reuse an old confirmation. Generic readable paper
does not claim a poor image or promise Type 2/RB2B; D retains its dedicated
**Confirm capture and continue to Type 2** path.

## 10. Queue and Today

The six-column Type 2 worklist uses actual current revisions and routing:
Reference, Pharmacy, Channel, Reason it is here, What the agent did, Open.
Type 1 capture is a separate lane. No-human automatic items are excluded.
Human-decided and capture-completed work retain their provenance; referred-back
items retain the actual RB code and approved-note status.

Off filters describe Type 1 capture, Type 2 judgement, referrals and Decided.
On distinguishes built, confirmation, evidence, abstained, referred and Decided.
All staff items/New submissions use actual counts. Fresh revisions sort first.
Inconsistent metadata produces a visible error and withholds affected rows.

Automatic-pricing and Today/With the agent effort summaries are labelled shared
monthly projections, not actual completions. Invalid model inputs suppress
projections while leaving actual work visible. The former virtual-month queue,
one-hour Compare and full-day simulation are not current queue controls.

## 11. Reflective pages

Evaluation is illustrative, not measured accuracy. Boundary distinguishes
existing/code/agent/human authority; Assumptions explains validation and stop
criteria. Architecture uses provider-neutral capability labels and exact
read-only tool contracts, not a claim of a deployed production stack.
Source mappings, contract payloads and immutable provenance remain unchanged.

## 12. Global controls and accessibility

Agent starts Off. Reset opens confirmation; Keep working/Escape changes nothing.
Confirmed Reset restores seed records, inputs, Agent Off and local controls
without changing route or perspective. Reload loses session work.

UK English, no em dashes, no implementation branding or source-document titles
in UI (including Architecture), qualified evidence and concise prose are required.
NHSBSA, MYS, NHSmail, EPS, dm+d and Drug Tariff remain required process names.
The synthetic label and governing principle must not disappear with disclosures.
Keyboard operation, visible focus, semantic labels, non-colour status,
announcements and reduced motion are required. Axe is necessary, not complete
manual WCAG 2.2 AA or screen-reader certification. Word count is informational.

## 13. Hosting and verification

The existing App Service F1 serves root `/`, SPA deep links, strict headers and
Git build provenance from the ordinary `BSA/dist` package. Main/manual deployment
uses OIDC; there are no PR slots. See [DEPLOYMENT](DEPLOYMENT.md).

Typecheck, lint, build, Vitest, production crash/dead-control checks and
zero-violation axe are blocking. Four CI shards must pass. There are no size or
performance budgets; gzip, word counts, Lighthouse and visual differences are
informational, but concrete functional/accessibility defects remain blocking.

The [live checklist](../tests/live/README.md) has 20 integrated checks with HTTPS
and exact clean build identity before and after each test. Local HTTP rehearsal
is separate, never a committed bypass or deployed acceptance. Thirty-two instrumented
tests compare complete read-only state across uninterrupted and perspective-
switched actions, including atomic Reset. Instrumentation is absent from ordinary
builds. The launcher canonicalizes the emitted entry's real path; the static
server's strict entry guard is unchanged.

[Original captures](screens/integrated/README.md) and
[Task 18 captures](screens/task18/README.md) retain their historical source
identities. New screenshots and novice review must identify the tested integrated
source rather than reuse those claims. [KNOWN-ISSUES](KNOWN-ISSUES.md) separates
current limitations, local compatibility and final release acceptance.
