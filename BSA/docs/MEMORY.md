---
title: Durable project facts
description: Read first at each task; correct facts in place rather than appending history.
ms.date: 2026-09-13
---

## Purpose and principle

Tasks 19-24 implement the whole-process model below. All functional streams
are merged. Initial release `1327e65` passed 20 hosted checks, but its independent
visual review found false D reconciliation/ready wording and an E automatic
trace implying human work. Repair #80 is deployed at
`d5832e0faa44c32242cb75f2970288d4499befae`; all 20 new hosted checks and
independent review of all 43 images passed. The failed first review is preserved.
V's final documentation merge and latest-main recheck remain release steps.
PROGRESS owns the source-pinned evidence and final release boundary.
Infrastructure remains frozen.

## Process model

The owner's 13 September process brief supersedes the earlier referral-only
workload model for Tasks 19-24. Treat the following supplied public figures as
fixed project context, not as a claim of fresh external source verification:

- NHSBSA processes over 100 million items monthly: about 91% EPS claim messages
  with dm+d codes and typed endorsements, and 9% scanned paper/character recognition.
- Straightforward items flow to existing rules-engine pricing without a person.
  Staff do not approve every item; about 4% receive a staff touch.
- Type 1 captures handwritten/low-confidence products, about 2.2 million items
  monthly and roughly 880 per hour. After human capture, code routes again.
- Type 2 handles endorsement interpretation, extra fees and finalisation,
  about 2 million monthly, 260-300 per hour, roughly 12-14 seconds per item.
- About 85,000 items monthly remain insufficient and are referred back.
  Reasons include missing brand/manufacturer, pack size, price, presentation
  (RB2B, especially handwritten forms) and incomplete NCSO endorsements.
- Pharmacies receive referrals in MYS, Unpaid items, with an NHSmail email;
  they complete the endorsement and resubmit. Only that item's payment is
  delayed; unpaid items expire after 18 months.
- July 2026 had about 194,000 unpaid items awaiting action, roughly GBP 1.55m,
  around GBP 150 per pharmacy. Payment context is 80% advance and a balance
  when priced. The demo calculates or approves no payment.

The new code outcomes are `auto_priced`, `type1_capture`, `type2_endorsement`
and `referred_back`; channels are `eps` or `paper`. Auto-priced items never
appear in an operator queue. Case A becomes automatically priced; B retains
referral/July sufficiency; C retains unresolved conflict; E remains no-model
clearance; F retains its original record. D deliberately changes: paper capture
stays unreadable, but a human-confirmed compatible pharmacy declaration can
support a proposed built-case path. Unreconciled declarations still abstain.
Never present declared fields as read from the poor image.

## One state

There is one authoritative application store, one header Agent switch and one
Pharmacy/NHSBSA/Both perspective switch. Perspective is never an input to routing,
arithmetic, submission, capture confirmation, decisions or history. Identical
actions in Both and switched perspectives must produce identical domain state.
Timestamps/IDs are controlled in the equivalence tests, not erased from proof.

The existing pharmacy receipt and queue presentation store modules must become
adapters over the same store or component-local presentation, not additional
operational stores. M owns that consolidation; no view may duplicate lifecycle,
revision or routing state. Local focus/disclosure/playback is not domain state.
Agent actions never change lifecycle. Code may route/price automatically; humans
explicitly submit, confirm Type 1 capture, judge Type 2 and approve a referral note.
Reset restores seeds and Agent Off, retaining perspective. No page-local Agent
override may return. Apply shared model changes first, then every consuming view.

On 13 September the owner explicitly created annotated `lkg-2026-09-13`
(**Last known good after Tasks 14 to 18**) and advanced `last-known-good`
to that pre-change main `80d955b`. Existing tags and `cowork-v1` remain unchanged.
Do not advance the rollback branch again without explicit owner instruction.

The Prescription Exception Case Builder is a static, offline React 19 and
TypeScript demonstration using synthetic prescriptions, pharmacies and tariff
clauses. No backend, real patient data, runtime services or payment calculation.
The agent gathers evidence and recommends. Deterministic code validates and
calculates. A human decides. The prototype does not calculate or approve payments.

The problem is evidence gathering for uncertain prescription endorsements under
a versioned rulebook. Approximately 85,000 monthly referrals represent a subset,
not total exceptions. Public figures are attributed, not independently verified.
One agent in two places is a proposal: pharmacy advice before submission and
NHSBSA evidence assembly after an exception. Neither is a live model service.

## Fixed vocabulary

* Boundary classes: existing, deterministic, agent, human
* Agent phases: PLAN, GATHER, RETRIEVE, RECONCILE, ASSESS, CHECK, RECOMMEND,
  ABSTAIN, HAND_OFF
* Recommendations: SUFFICIENT, REFER_BACK, REQUEST_INFORMATION, ABSTAIN, NONE
* Case states: cleared_by_rules, agent_review_complete, operator_review_required,
  additional_evidence_required, agent_abstained, human_decision_recorded
* Human decisions: ACCEPT, AMEND, REQUEST_INFORMATION, REFER_BACK, ESCALATE
* Confidence signals: provision found, sample agreement, reconciliation,
  image quality, evaluation coverage; never model self-confidence
* Gate: PASS, FAIL, NOT_RUN; pure code validates citation, mandatory fields,
  recommendation requirements and conflicts. No recommendation means NOT_RUN.
  FAIL withholds recommendation and draft. Image threshold 0.60; agreement 2/3.
* Monthly model: 100 million is a conservative calculation baseline for the
  supplied "over 100 million" figure. EPS/paper partition the total; Type 1
  and Type 2 can overlap within the approximately 4% staff-touch cohort.
  Type 2 today defaults to 13 seconds, the investigation tail to 4 minutes,
  pharmacy completion to 6 minutes, and built-case judgement to 45 seconds.
  Forty-five seconds exceeds thirteen: assisted Type 2 hours can increase.
  Catch defaults to an assumed 20% of referrals; abstention to one of six
  synthetic cases. No additional reduction is invented. Type 2 and referral
  operator hours are non-additive views; pharmacy time is a separate workforce.
  `monthModel(ProcessMonthInputs)` and `useProcessMonth` supply every current
  figure. Render hours with `formatProcessHours` (one decimal maximum) and
  items with `formatProcessItems` (integers), without rounding model outputs.
  The prior 12-minute calculator remains only an explicitly legacy comparison.
* Routing: `auto_priced` means no person was involved in that revision.
  Human-completed Type 1/Type 2 work retains its staff route with
  `requiresHuman: false`; do not misclassify it as an untouched automatic item.
  Generic legacy submissions preserve the recorded channel. Only explicit
  channel-bearing submissions change it. Seed channels derive from the claim
  message rather than contradictory legacy display text.
* Lifecycle contracts: submitted, in_review, information_requested,
  referred_back, resubmitted, paid, escalated. Distinct from existing case states.
  Implemented shared lifecycle, immutable revisions and five-pharmacy seeds.
  Paid is synthetic, attributed to existing pricing.

## Six canonical cases

| Case | ID | Fixed behaviour |
| --- | --- | --- |
| A | EX-24107 | Complete endorsement; existing rules-engine pricing without operator involvement |
| B | EX-24112 | Initialled, not dated; August refer back; July sufficient |
| C | EX-24119 | Quantity conflict surfaced, request information |
| D | EX-24123 | Poor paper image remains unreadable. Manual capture continues to Type 2; a compatible, explicitly reconciled declaration can build a proposed case. Unreconciled evidence abstains; missing mandatory evidence withholds the recommendation |
| E | EX-24101 | Cleared by deterministic rules without a model call |
| F | EX-24088 | Already decided; historical record preserved |

Scenario edits must clone data, never change these fixtures or gate semantics.
The agent never changes a lifecycle state. Human-approved drafts are labelled
as such and optional: a human may record their own reason without using a draft.
Code performs ordinary automatic routing/pricing attribution; humans explicitly
confirm capture and record decisions. No agent approval, referral or payment.
Complete non-D manual capture can route on matching confirmed facts without
claiming a pharmacy declaration was reconciled. D and declaration-based trust
keep their stricter reconciliation checks. Original pharmacy attempts are never
enriched after submission; capture evidence is appended to revision-linked history.

## Presentation and storage

Header has Pharmacy/NHSBSA/Both immediately before Agent. Navigation and cross-side
links are filtered by perspective; the same pages and operational store remain.
Both is the default and the only perspective with the tour rail. Hidden deep
links offer a perspective switch, not an error. The header stays one row at
normal 360-1920 widths and wraps at narrower widths or enlarged text, with
measured focus/scroll clearance. Default and confirmed Reset are Agent Off.
Reset restores seeded data, assumptions and local controls but retains perspective.
Agent On/Off is controlled only by the top-right header switch. No page may call
`setAgentEnabled` or keep its own assistance override. The queue toggle and
pharmacy's local availability switch are removed; pharmacy checks use the header
state directly. On-only actions are conditionally shown by that state. The
read-only Compare projection never toggles assistance or changes lifecycle.
The current staff worklist excludes automatic rows, separates Type 1 capture
from Type 2 judgement and retains completed human work under Decided.
Perspective hides an already-open form using `hidden` and `inert`, preserving
unsaved fields without a second operational store. Explicit guard restoration
returns focus to the selected view's contextual heading.
`pharmacyCorrections` records validated missing-to-ready evidence after a human
applies a correction; it never submits or changes lifecycle/history. It is
session-only, cleared by Reset, and distinct from whole-scenario projections.
Use stable Zustand slices; derive arrays with useMemo or useShallow.

Copy uses UK English, no em dashes, and no implementation vendor/product or
document names in the interface, including Architecture. The owner's latest
Part D instruction supersedes the former Architecture exception. Use
presentation-only capability aliases; retain original source mappings, tool
contracts, payloads and decision history. NHSBSA, MYS, NHSmail, EPS, dm+d and
Drug Tariff remain valid process names. Narrative panels are under 25 words;
structured labels are not a hiding place for prose. One Sources line in chapter
one; documentary audit stays outside the client. Synthetic operational citations
remain visible. Keyboard, focus, contrast, reduced motion and non-colour status
are requirements. Shared two-second animation is presentation, not processing.

## Public repository and current state

Initial functional release: `1327e65fffeafebf43df1b1b566c6e4152452b46`.
Exact N candidate `f7d9039` passed check, 923 unique units, 1,186 ordinary
browser tests and 21 instrumented state-equivalence tests in four CI shards.
V then ran the complete 32-case exact-state suite locally and 20 real hosted
checks against clean `1327e65`, without an observer in the deployed build.
Hosted evidence includes 41 metadata-paired screenshots (18 Off/23 On) plus
two separately identified perspective-helper screenshots (one Off/one On),
43 images in total (19 Off/24 On), and 24 axe audits
(10 Off/14 On), zero violations and 19 incomplete audits requiring judgement.
These captures are primarily Both perspective; they are not a static matrix
of every route in all perspectives. Header route checks and per-action state
equivalence cover those requirements separately.

The first 43-image review failed D/E content truthfulness despite zero axe
violations. Repair #80 at `d5832e0` passed 943 units, 1,186 ordinary browser
tests and 21 instrumented cases, then deployment 34765809076. Missing or
unconfirmed comparison evidence is Not established, never green agreement
inferred from no conflicts. In-review history is labelled Awaiting operator,
not automatically Case built. Automatic trace closing says no agent/person is
involved; human paths remain distinct. Claim filters use an accessible group.
New repaired captures and review are separate evidence; never erase the failure.
The repaired run has 40 clean before/after identities, 43 reviewed images
(19 Off/24 On) and 24 axe audits (10 Off/14 On), zero violations. Sixteen
contrast incomplete audits covering 121 nodes remain manual-review caveats;
there are no remaining prohibited-ARIA incomplete results. The novice/content
review passed with no blocker, not as a participant study or WCAG certification.
Thirty-two exact-state scenarios passed coherently with no production observer.
The minor "1 items" wording is retained as a non-blocking KNOWN-ISSUES entry.
No blocking application issue is deferred; final release evidence follows #79.

Each final documentation merge changes the build identity. Its latest-main
deployment and full hosted checklist must pass again before ALL DONE; earlier
capture images and test artifacts must not be relabelled as later source.

### Retained public and prior-release decisions

Transfer is not proceeding: the enterprise identity is an Enterprise Managed
User and cannot join or own this external repository. Owner remains WilliamNg18.
The repository is public for Actions capacity. Any later visibility change
requires a fresh explicit owner instruction; this task changes none. Actions
billing/entitlements belong to the repository owner.
The owner has explicitly authorised all streams to resume from HANDOVER.

Reference documents are public by the owner's decision and remain committed.
Use the reference material directly for the aim, problem and outcomes while
preserving attribution and uncertainty. Naming documents in working docs and
code comments is allowed; document names remain prohibited in the website UI.
No deletion or history rewrite was performed. Secret scanning and push
protection are enabled, `.env*` is ignored, and no actionable credential was
found in the recorded local tree/reachable-history scan. Deployment uses the
existing site-scoped OIDC identity; no SWA token or publish-profile action remains.

The accepted Tasks 14-18 release is `80d955bdde6a7ef4e59ceb720d9c9a654efbe5e3`,
after N #64, P #66, Q #67, X #65 and V #63. Exact final-main CI 34720652232
passed check, 774 unique units and 1,086 blocking browsers across four shards
(272/272/271/271), zero quarantine. Main OIDC 34720652234 succeeded.
The coordinator's actual live run passed 14/14 checks, 28 clean identities
and seven axe audits (three Off/four On), zero violations. It includes the
same-item perspective round trip Off then On without Reset. V separately
at the preceding identical runtime `c0203fc`
captured/reviewed 18 states (14 content/four guards), with 18 zero-violation axe
audits; 13 retain incomplete rules requiring judgement. Nine novice clarity
points and 22 walk checkpoints passed, including the live caught-item counter
and explicit submission boundary. Its first selector-failed walk is retained.
Final latest-main verification completed after V's documentation merge.
The header-only Agent follow-up verifies its own deployment; no later build
is silently attributed to these results. No application issue IDs were deferred.

### Historical foundation and provenance

Git root contains the nested application `BSA`. Application main at transfer freeze was
`98c888184db1df9c03539413b5e3b1db47f1ebfe`; annotated
`checkpoint-2026-09-12` pins the main handover/tracking commit. Stream tags
and full branch heads are listed in [HANDOVER](HANDOVER.md).

Tasks 1-13 are Done against the accepted application and hosted evidence in
PROGRESS. Scope is 18 Done; the separately maintained PARITY record owns its
final hosted row. Documentation merge and latest-commit deployment recheck
remain coordinator release steps, not a claim that this unmerged revision is live.
Eight chapters/nine stops,
full referral-cycle guide, queue Compare, scene count-in, healthy manual
pharmacy status and S's CSP/focus/motion fixes are merged. R's approved-only
On reasons and manual-resubmission pain fixes merged through PR #33 at
`898cda594d0dcb34376bddab7112edcddb172440`. V's final PR #24 merged at
`be623ab507e871c27e0889e7db6e64a8595ad10b` without changing runtime source.
The original source-pinned manifest at `898cda5` contains 107 reviewed captures/audits:
53 Off and 54 On, all with zero axe violations, overflow and browser/CSP errors.
Its 51 audits with incomplete rules still require human judgement; automated
checks are not complete manual WCAG certification.

Historical main after route-opacity repair #42, quarantine removal #40 and scoped
V refresh #43 is `c687a9eab181b02f4fca0eb667e8ab8f94468620`, with application
source `82c18e49e7d1c765e5392b1bec5c028c8f89fd16`. Only the route opacity fade
was removed to repair intermediate-frame contrast; slide/focus/motion guards
remain. V reproduced 64 settled route images byte-identically (32 Off/32 On):
64 fresh axe reports have zero violations/errors/overflow; 39 retain incomplete
rules. The other 43 stateful images were not rerun. Original 107-image provenance
is unchanged; do not describe all 107 as fresh evidence for the repaired runtime.

Overview has eight chapters/nine stops, including separate Pipeline and Four
cases chapters and cross-page Queue/Claims stops. Operations includes Pharmacy
check, Pharmacy claims/detail and Exception queue; case pack, trace and decision
record preserve all six canonical outcomes. Follow and Switch side retain the
same item. Pharmacy On reasons are operator-approved drafts, labelled as such;
the original history and raw Off comparison are preserved.

The existing Azure App Service F1 in Sweden Central is the owner-selected
hosting target (issue #48 supersedes SWA). Production and local browser tests
use `/`. Root `hosting.config.json`, a portable static server and Git build-info
are emitted into BSA/dist. PM2 runs the server to preserve strict headers;
built-in PM2 serve lacks those headers. Main/manual OIDC deployment uses the
configured five repository variables; no deployment credential in the bundle.
F1 has no slots; PRs get CI/artifacts, not live previews. The
project has no byte/performance budgets. Gzip size, word counts, Lighthouse and
screenshot differences are informational; typecheck, lint, build, units,
crash/control/six-outcome tests and axe block.
The pre-redesign records base was `d1f0bddc736ccec6b9ddbf9836c24188e7c954df`, after recovery
#54 and live evidence #55. Public CI 34705318318 passed at exact head
`8bee3f205d29178177a6fb1ef5e98394c7655d2c`: check, 695 unique units/26 files
(repeated by each shard, not 2,780 unique tests), and 1,055 blocking browsers
partitioned 264/264/264/263, zero quarantine. Observed verdict: 6m25s.
Older 607/1,054 and 1,019-plus-three counts remain historical.
Do not infer CI-wide axe/CSP artifact totals from V's scoped reports.
The coordinator measured the actual deployed seven-file ZIP at clean
`d1f0bddc736ccec6b9ddbf9836c24188e7c954df` (build UTC
`2026-09-12T16:44:36.023Z`): 209,062 bytes, Python independent-resource
`gzip.compress(mtime=0)` default level 9, informational. It is not a rebuild
or a fixed total for later commit metadata; PROGRESS records all seven values.
Historical frontend capture-build evidence is in docs/screens/route-opacity-parity: 203,721 bytes
across all four independently gzipped resources using the original Python
method (previously 203,723). The separately recorded Node level-9 variant is
203,964 bytes; never mix compressor methods. All sizes are informational,
with no budget.

Live URL: https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/.
The clean `b813c6241cc084957a30c6bf48fdd65f623f33f6` artifact passed 13/13 live
checks and 26 matching before/after identities; six actual axe audits
(three Off/three On) had zero violations. A separate unchanged mixed-mode
test passed on the same item/history, four attempts and three human decisions.
Main OIDC 34704994346 and manual OIDC 34705843955 succeeded at `b813c62`;
main 34705915808 succeeded at `d1fbe85`. Durable evidence is in
docs/live-verification and the linked recovery record in INFRA-DONE.
The old SWA token/resource actions are superseded by #48, not outstanding.
No PR live preview is promised on F1. #34 is closed after
removal of all three quarantine tags and the all-blocking pass; #41 is closed
after the route-opacity repair and 32 new frame cases. #35 is closed as not reproduced: its axe error occurred
during timeout teardown after slow navigation, with no actionable axe defect
established. Historical evidence is retained; the unchanged blocking test passed.

Preserve the owner-promoted `last-known-good` at `lkg-2026-09-13`, and never
move existing tags or `cowork-v1`; see
[branch policy](../../BRANCHES.md) and [current branch record](BRANCHES.md).

Read AGENTS first, then this file, DECISIONS, LEARNINGS, PROGRESS, SCOPE and
HANDOVER. N/Q/P/X/V are merged. Changes land through coordinator-serialised
validation; explicit owner requests may authorise direct main commits.
Current acceptance is in PROGRESS; checkpoint sections
in HANDOVER remain historical and all checkpoint tags stay immutable.
Old issue text mentioning size budgets or transfer waiting is superseded by
the current gates and the owner's public-repository resumption.

## Blockers and status

If anything blocks, stops, or needs an action only the owner can take, post it in the chat immediately as a STATUS message with the exact steps, without waiting for the next scheduled update. Never let a blocker sit silently. Every STATUS message includes an 'Owner actions for me' line, or 'none'. ALL DONE is posted only when every task, every scope row and the live-site verification are complete.

Monitor the selected App Service deployment and Actions without printing
credentials. Do not race coordinator local deployment with the main workflow.
OIDC identifiers are repository variables, not a SWA deployment token.
Verify actual build-info commit, root/deep links and strict headers after deploy.
Completed streams remain delivered; do not invent work or rerun accepted tests
merely to describe them as busy.

Latest owner direction: use `bsa-bsa-demo-r2j2l3dxhtohy` in `rg-bsa-bsa-demo`,
subscription `8b02c7be-06b9-4d15-a916-eba62a775f02`. Azure login works; the
coordinator created the deployment identity, main-branch federation, site-only
Website Contributor grant and five GitHub variables. Owner actions for setup:
none. The current strict-header application has actual 20-check hosted acceptance
at clean `1327e65`; earlier `c0203fc` and `b813c62` evidence remains source-pinned. DEPLOYMENT records
startup and commit verification; coordinator owns Azure mutations and the
fresh latest-commit check after each new deployment.

## How changes land

Use one issue per functional change, with explicit file ownership. Branch from
current main, implement the change, run `npm run verify` from `BSA`, and open a
pull request. PR #47 delivered the same entry point for local and four-shard CI,
with an observed successful verdict in 7m45s. Shards must collectively cover
every blocking test; this hosting migration does not alter them.

The App Service workflow deploys main/manual builds using OIDC. F1 has no
deployment slots; PR build artifacts are not live previews. Merge when blocking
checks are green; main deploys automatically, followed by a STATUS message with
the verified live URL and commit. Target issue-to-live time for a small change
is under one hour, not a correctness waiver or a CI timeout gate.

Infrastructure is complete and frozen. No stream spends time on hosting, gates or tooling from here; all effort goes to the application.

This declaration covers the owner-selected App Service scope. INFRA-DONE.md
records actual main/manual OIDC, live checks, CI/setup/artifact
evidence and 82.08-second non-destructive Incremental configuration reapplication
with unchanged tags and post-apply live checks. This is not deleted-resource
disaster recovery, a future availability guarantee or permission to skip release
verification. Final ALL DONE remains the coordinator's post-merge/latest-deploy
and fresh-URL verdict.
Revisit hosting only for an explicit owner decision or functional
requirement, with a decision record; do not weaken the strict CSP for speculation
about future features.