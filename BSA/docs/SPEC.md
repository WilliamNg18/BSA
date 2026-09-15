---
title: Four-case desktop demonstration specification
description: Eleven shared-state steps, source-bound verification, explicit human actions and an honest system-design reference.
ms.date: 2026-09-15
---

## 1. Purpose and authority

The current scope is Tasks 31-38, the owner's four-case Vision and its
Requirements 1-5 addition.
[MEMORY](MEMORY.md), [DECISIONS](DECISIONS.md) and [SCOPE](SCOPE.md) govern
interpretation; [PROGRESS](PROGRESS.md) owns actual acceptance and deployment.
This specification describes required behaviour, not a passing release verdict.

The agent verifies and advises; a person decides. Deterministic code checks
requirements, reconciles evidence, validates citations and releases eligible
items to existing pricing. The prototype calculates or approves no payment
and provides no medicine advice. All data, prescriptions and organisations
in operational examples are synthetic.

This is a static browser application with one in-memory operational store.
Interpretation uses scripted readings. There is no model endpoint, business
backend, analytics, runtime external font or real patient data. Presentation
preferences alone may persist. The existing hosting configuration is unchanged.

## 2. Four playable cases and historical semantics

`PLAYABLE_CASE_IDS` is the authoritative operational inventory:

| ID | Channel | Today | With the agent |
| --- | --- | --- | --- |
| `EX-24107` | EPS | Complete item priced by existing rules with no person | An explicit submission passes both gates and is automatically released |
| `EX-24112` | EPS | Missing NCSO date needs human judgement and may be referred back | A supported pharmacy correction precedes explicit Send; sending incomplete evidence still creates operator work |
| `SYN-FQ123-MISMATCH` | EPS | Plausible wrong pack needs judgement, not random pricing | Gate 1 passes format; Gate 2 fails independent reconciliation; never automatically released while wrong |
| `EX-24123` | Paper | Type 1 keys known evidence, Type 2 judges and may issue RB2B | A pharmacy declaration is checked, never represented as image reading; explicit human confirmation is required |

C and F are fixed, labelled, unclickable background, not hidden operational
items. E's no-model deterministic behaviour is represented inside A's Today
path. Removed readable-paper, generic and recheck items are not manufactured
by test-only store seeding.

The six canonical domain fixtures remain semantic regressions: A sufficient;
B August referral and July sufficiency; C unresolved quantity conflict and
information request; D abstention on unreconciled evidence; E deterministic
clearance without interpretation; F an existing human decision. Their pure
historical fixtures do not imply six playable routes. Original F audit values
are retained in `data/archive/decision-records.ts`, not rewritten to match
current capability-neutral metadata.

## 3. Desktop routes and navigation

Verify 1280 and 1440 px only. New screenshots use 1440 px only. Mobile/tablet
layouts, navigation and active tests were explicitly withdrawn; historical
results are not relabelled as new desktop acceptance.

Ordinary operations retain `/pharmacy`, `/pharmacy/claims`, `/queue` and
`/case/:id`, `/case/:id/trace`, `/case/:id/record` for playable IDs. Reflective
routes remain `/evaluation`, `/boundary`, `/assumptions` and `/architecture`.
Unknown or background IDs cannot create operational controls or substitute
another item. Pharmacy case/channel queries select the actual source form;
invalid combinations show recovery rather than a different case.

Ordinary Home also exposes six real **Overview sections** links to `/#scene`,
`/#month`, `/#pipeline`, `/#cases`, `/#two-places` and `/#close`. These use
SPA navigation and retain the shared state. They are absent from the focused
demo; the removed chapter rail is not restored.

`demoStep: null` means ordinary navigation. **Enter demo mode** deliberately
selects step 1 at `/#pipeline`. The Demo mode strip replaces the former chapter rail and
contains Back, Next, a labelled jump selector and Exit demo. The eleven steps:

| Step | Subject | Case |
| --- | --- | --- |
| 1 | The real process and problem | Whole process |
| 2 | A month in numbers, shared editable assumptions | Whole process |
| 3 | Complete EPS | A |
| 4 | EPS missing the date | B |
| 5 | Complete-looking EPS with wrong pack information | Mismatch |
| 6 | Paper declaration before posting | D |
| 7 | Human paper confirmation | D |
| 8 | NHSBSA work and an opened operator item | Current selected work |
| 9 | Pharmacy response and explicit resubmission | Current actionable hand-off |
| 10 | Follow one case across both sides | D initially |
| 11 | Outcome, central bet and first test | Whole process |

Each screen has Today on the left and With the agent on the right. The
current mode contains the real controls for one shared item; the other side
is explicitly a read-only scenario projection, not executed history.
Only the controls declared by `DEMO_ALLOWED_CONTROLS` may appear. Do not
hide full operational pages behind broad CSS or retain unrelated filters,
tables and secondary actions. Step 8 needs its one queue table.

The header has one Agent toggle and one perspective control. During demo
mode the ordinary primary navigation and Reset are absent; Exit restores
ordinary controls without losing the item, mode or history. Step changes
focus the new heading and reset scroll, not operational state. Shortcuts
ignore fields, menus and dialogs. Reduced motion preserves the same outcome
without movement or temporarily low-contrast text.

## 4. One state and Follow

Pharmacy, NHSBSA and Both are presentations of the same store. Navigation,
perspective changes and the Agent toggle do not submit, capture, approve,
refer, correct, resubmit or release. The only Agent control is in the header.

The Follow banner remains available across perspectives and demo steps. It
shows reference, actual channel, perspective-specific state, actual location
and the latest event with its date and RB code where recorded.
**Pharmacy view** and **NHSBSA view** replace Switch side.

A hidden destination temporarily shows Both with an explicit explanation.
The origin-side button restores the originating perspective; a deliberate
header choice, including Both, keeps that choice. Changing followed item,
dismissing Follow or Reset clears temporary context. This presentation-only
metadata lives in the existing store, not another authority.

Follow links must open the actual item even from narrative steps 1, 2 and 11,
while retaining the current demo step. Opening a queue row is distinct from
an explicit side visit. Advancing an actual operator referral from step 8
to step 9 retains the actionable followed item rather than substituting a
previously completed default B. Navigation never creates the missing referral.

## 5. Source-bound gates and release attribution

Gate 1 checks typed EPS fields or the paper declaration against the provision
for the dispensing date. Gate 2 independently checks received evidence,
original claim/product/quantity/pack/amount facts, mandatory fields and the
dated citation. A declaration cannot corroborate itself.

Current `itemVerification` contains gate1/gate2 (`pass`, `fail`, `none`),
`reconciled` and `released`. Both gates must pass and reconciliation agree
for automatic release. Wrong-but-complete EPS, unreadable paper and
unreconciled evidence remain operator work. No navigation animation invents
a transient Gate 1/Gate 2 location.

Submission mode is retained on the immutable revision. Capture records its
actual human action and assistance mode. Later toggles do not rewrite
verification or audit history. In an Off-only attempt both proposed gates
remain `none`; a human may release only after the existing deterministic
source checks and valid judgement. A complete, genuinely recorded manual
capture can satisfy those checks without an unavailable On-only attestation
control. On confirmation remains strict, and unreadable paper is never
automatically released.

`released_to_pricing` means release into the existing engine, not payment
calculation. Automatic release has code origin and may say **released to
existing pricing, no operator action**. Human release has operator origin
and explicitly says **after operator review**. The pharmacy's normal-schedule
Paid grouping includes actual releases without adding a fabricated paid event.
Labels anchor to the real release event; a later same-state Apply cannot
erase its provenance. Missing or inconsistent evidence cannot produce a
success-shaped release description.

## 6. Human action panels

`operatorDrafts` and `pharmacyDrafts` are shared, revision-bound drafts.
Editing or applying a suggestion is not a final decision or submission.
Apply events are attributed to the human who used the control.

The operator panel supplies Apply suggestion, outcome radios, RB code and
reason/question fields, followed by explicit Release to pricing, Refer back,
Request information and Escalate actions. Apply fills the correct visible
fields and records **applied by the operator from the agent's suggestion**.
Release is disabled when required source checks or the reason fail; the
store independently rejects invalid release attempts. Referral needs a valid
RB code and note. Information requests need a question. Off provides no new
advice and says **experience only**, but retains already human-applied drafts
and their actual provenance.

An automatic or already completed item is read-only; it must not present an
impossible operator decision prompt. On unreadable paper, image and declaration
remain distinct. Fields are **declared by the pharmacy, not read from the form**.
Correct focuses actual fields and clears attestation; subsequent edits also
require fresh confirmation. Unknown prescriber evidence is not invented.

Pharmacy referral detail shows the actual operator response. On, Apply
suggested correction fills only supported source fields, highlights actual
changes and re-runs the precheck. Resubmit is separate. Off retains editable
fields and **Resubmit blind**. An information-requested item has Confirm and
Send confirmation. Notices and Ready results cannot remain stale after an
edit, item change or revision change.

The submission workbench deliberately prepares a new same-ID attempt with
retained history; the claim panel corrects the current referral. Distinct
draft purpose prevents an unsent replay from impersonating an approved
referral correction. Receipts use the submitted revision's recorded events,
not a forecast based on the current header mode.

## 7. Shared numbers and system design

The supplied whole-process context is over 100 million monthly items, roughly
91% EPS, around 4% receiving staff attention and 85,000 monthly referrals.
The referral subset is not all staff work. Context is attributed, not claimed
as independently measured by this application.

One shared monthly model feeds the two tiles, queue and pharmacy projections.
At unchanged defaults, total operator hours are 19,479.166666... Today and
297.5 With, including 255 judging plus 42.5 gathering on abstentions.
Every With figure is an estimate. Assumptions remain editable within the
active month detail, including recovery from invalid inputs. No stale result
or independent page calculation may replace the shared model.

`/architecture` is **How it works and how it would scale**, with contents
navigation, ten sections, diagrams, explicit built/proposed/assumption labels,
cost arithmetic and the limits of the proposed production design.
[SYSTEM-DESIGN](SYSTEM-DESIGN.md) carries the full reference.

Only the table captioned **Reference mapping, one example** contains concrete
platform service names. Current metadata is capability-neutral at source,
not scrubbed at render time. `check:source-copy`, included in `npm run check`,
allows service cells of that one mapping module, not its caption, capability
cells or other exports; package imports are not interface copy. Rendered
checks require the same single table and prohibit names elsewhere.

## 8. Acceptance and evidence

Blocking checks are type/lint/build and the source-copy policy, Vitest,
crash/dead-control/canonical-outcome browser regressions and zero axe
violations. Word counts, screenshot differences and performance reports
do not establish visual quality or manual accessibility certification.
Meaningful UI prose stays under 25 words per panel; the system-design
reference alone permits under 60. UK English and no em dashes remain required.

Final acceptance additionally requires the complete named latest-main live
inventory of 75 checks: all eleven steps Off/On, Back/Next at both desktop widths, the
actual operator-to-pharmacy hand-off, all four full cycles in Both and
switched perspectives, both side buttons at every state, real Apply/Release
and Apply/Resubmit actions, wrong EPS never automatically released, both
system-design widths and a URL check less than ten minutes old.

The separate instrumented matrix compares complete domain snapshots after
each UI action with controlled clocks and IDs, including all verification,
drafts, records and capture metadata. It never strips inconvenient fields.
The ordinary production build must not expose its read-only observer.
The existing 36 state checks remain intact; eight additional four-case checks
exercise both side buttons at every state without replacing that coverage.

Local rehearsal is not hosted acceptance. Partial or duplicated selections,
missing or dirty identities, mismatched commits, errors and retries cannot
produce a full passing report. Preserve failed attempts and their evidence.
Historical Tasks 25-30 images and interrupted review remain historical and
unverified; removing mobile files does not turn them into a desktop pass.

## 9. Always-visible recommendations and complete paper workflow

This addition is required, not yet accepted by the earlier 55-check local
rehearsal. That result predates Task 38.

Every actual case-bearing Agent-On view shows a Recommendation card without
opening a disclosure. Reference, monthly-model and pipeline-only pages do not
invent a case or a card. Each card is bound to the visible item and the
appropriate current draft, submitted revision or historical record.

The shared recommendation object and card contain the dispensing-date clause
and Tariff version, each requirement with its result, the missing/unresolved
list, suggested values, corrected preview, recommended outcome and structural
confidence signals. The card says **the agent verifies and advises; a person
decides**. Complete evidence explicitly says there is nothing to add; missing
evidence never becomes a fabricated value or a passing gate.

Suggestions are concrete. For B, the proposed date is the dispensing date,
21/08/2026, and the preview is `NCSO RK 21/08/26`. Apply writes exactly that
preview into the visible field and highlights the change without sending.
Manufacturer, pack and presentation suggestions come from the synthetic
product/reference facts. A missing invoice price is a focused manual-entry
request, **invoice price required; enter £x.xx**, not an invented amount.
The four base scenarios do not reach an invoice-price provision. The required
manual-focus UI remains pending: use a clearly labelled unsupported-input
variant on an existing item and the existing applicable provision, without
widening supported interpretation or release. BB does not require invoice
price. The null-value unit contract alone cannot close this requirement.
The pharmacy check, referred-back detail and operator controls use the same
validated proposal rather than separate approximations of it.

Paper D has explicit controls for **Show the form as NHSBSA's scanner will
see it**, **Declaration complete** and **Declaration missing information**.
The scanner view says **image cannot be read**. The card distinguishes the
declared values from image evidence and previews supported corrections.
Post paper remains an explicit enabled human action when information is
missing; deterministic malformed-input errors remain visible, not silently
treated as a successful submission.

The same submitted D arrives in Type 1 with image and declaration shown
separately. Human Confirm/Correct records actual capture evidence. Type 2
then shows the always-visible card: matching evidence may recommend Sufficient
but still requires the operator's Release action because the image was
unreadable. Conflicts show the exact disagreement and a safe Refer back or
Request information proposal. Applying a safe diagnostic fills the operator
draft and records a same-state human event; it does not change ABSTAIN,
failed verification, source evidence or release eligibility.

The final human Ref/Info action revalidates and approves its actual note.
The pharmacy sees the RB code or question, the recorded operator reason and
the applicable reasoning, without pretending an unapproved generated draft
was approved. Correction, resubmission, answer and human release remain
separate actions on the same item.

For all applicable transitions on the four cases, in Both and each single
perspective, the origin and destination must visibly update within **1,000
milliseconds measured from before the actual action click**. The budget
includes Follow navigation and assertions for the actual destination item,
state and required reason/answer. A monotonic clock independent of synthetic
business timestamps enforces the remaining budget at each observation.
There are no sleeps, post-delay starting points or five-second default waits
disguised as a one-second result. Automatic A does not gain imaginary human
controls merely to populate a matrix.

The latest event remains the latest recorded event. For example, an On
confirmation can be followed synchronously by code verification; show that
verification event while still displaying the actual answer on the NHSBSA
side. Navigation alone never appends a business event.

The final blocking inventory must add visible card/preview coverage at both
desktop widths and modes, the complete/missing/scanner/unreconciled paper
branches, safe Ref/Info actions, explicit resubmission and answer handling,
and the measured one-second transitions. Previous pre-addition passes are
retained as bounded history, not relabelled as this acceptance.
