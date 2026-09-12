---
title: Durable project facts
description: Read first at each task; correct facts in place rather than appending history.
ms.date: 2026-09-12
---

## Purpose and principle

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
* Calculator: volume V; gathering g is seven steps; judging j is constant across
  both columns; pharmacy-caught P, rule-cleared C, abstained A and built B are
  sequential bounded cohorts. Pharmacy catch is items, not minutes. Deficient
  built and abstained shares determine referral assumptions. Risk includes all
  abstentions. Zero residual means Not established, not 100% accuracy.
* Lifecycle contracts: submitted, in_review, information_requested,
  referred_back, resubmitted, paid, escalated. Distinct from existing case states.
  Implemented shared lifecycle, immutable revisions and five-pharmacy seeds.
  Paid is synthetic, attributed to existing pricing.

## Six canonical cases

| Case | ID | Fixed behaviour |
| --- | --- | --- |
| A | EX-24107 | Sufficient, complete endorsement |
| B | EX-24112 | Initialled, not dated; August refer back; July sufficient |
| C | EX-24119 | Quantity conflict surfaced, request information |
| D | EX-24123 | Abstain: poor capture, disagreement, no provision; gate NOT_RUN |
| E | EX-24101 | Cleared by deterministic rules without a model call |
| F | EX-24088 | Already decided; historical record preserved |

Scenario edits must clone data, never change these fixtures or gate semantics.
The agent never changes a lifecycle state. Human-approved drafts are labelled
as such; no automatic approval, referral, correction or payment.

## Presentation and storage

Header is one row with Overview, Operations and How it works groups. Default
and confirmed Reset are Agent Off. Opt-in On is reversible. Reset restores
seeded in-memory data and local controls. Only presentation preferences persist.
Use stable Zustand slices; derive arrays with useMemo or useShallow.

Copy uses UK English, no em dashes, no vendor/product/document names outside
the permitted Architecture mapping. Narrative panels are under 25 words;
structured labels are not a hiding place for prose. One Sources line in chapter
one; documentary audit stays outside the client. Synthetic operational citations
remain visible. Keyboard, focus, contrast, reduced motion and non-colour status
are requirements. Shared two-second animation is presentation, not processing.

## Public repository and current state

Transfer is not proceeding: the enterprise identity is an Enterprise Managed
User and cannot join or own this external repository. Owner remains WilliamNg18.
The repository is public for Actions capacity and is to return to private when
the demo is done. Actions billing/entitlements belong to the repository owner.
The owner has explicitly authorised all streams to resume from HANDOVER.

Reference documents are public by the owner's decision and remain committed.
Use the reference material directly for the aim, problem and outcomes while
preserving attribution and uncertainty. Naming documents in working docs and
code comments is allowed; document names remain prohibited in the website UI.
No deletion or history rewrite was performed. Secret scanning and push
protection are enabled, `.env*` is ignored, and no actionable credential was
found in the local tree/reachable-history scan. The owner should reset the
Azure deployment token and put it only in the repository secret.

Git root contains the nested application `BSA`. Application main at freeze is
`98c888184db1df9c03539413b5e3b1db47f1ebfe`; annotated
`checkpoint-2026-09-12` pins the main handover/tracking commit. Stream tags
and full branch heads are listed in [HANDOVER](HANDOVER.md).

Tasks 1-12 are Done. Task 13 has complete application verification but remains
In progress for hosted release verification under #37. Eight chapters/nine stops,
full referral-cycle guide, queue Compare, scene count-in, healthy manual
pharmacy status and S's CSP/focus/motion fixes are merged. R's approved-only
On reasons and manual-resubmission pain fixes merged through PR #33 at
`898cda594d0dcb34376bddab7112edcddb172440`. V's final PR #24 merged at
`be623ab507e871c27e0889e7db6e64a8595ad10b` without changing runtime source.
The original source-pinned manifest at `898cda5` contains 107 reviewed captures/audits:
53 Off and 54 On, all with zero axe violations, overflow and browser/CSP errors.
Its 51 audits with incomplete rules still require human judgement; automated
checks are not complete manual WCAG certification.

Current main after route-opacity repair #42, quarantine removal #40 and scoped
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
Public CI 34696637977 passed at exact head
`f295d7f19363cd101af7401f0ba03188ee7d0b2b`: check, 607 units/22 files,
1,054 all-blocking browsers in 15.1 minutes, zero quarantine. Source/tests
match accepted main `82c18e4`; V #43 is documentation-only. The earlier
1,019 blocking plus three informational result is historical, not current.
Do not infer CI-wide axe/CSP artifact totals from V's scoped reports.
Historical frontend capture-build evidence is in docs/screens/route-opacity-parity: 203,721 bytes
across all four independently gzipped resources using the original Python
method (previously 203,723). The separately recorded Node level-9 variant is
203,964 bytes; never mix compressor methods. All sizes are informational,
with no budget.

Azure workflow 34692328300 built `be623ab` but failed its explicit missing
deployment-token prerequisite. No actual live URL, resource provisioning or
PR preview is verified. Owner token reset/secret setup and hosted checks remain
#37; follow DEPLOYMENT.md without exposing credentials. #34 is closed after
removal of all three quarantine tags and the all-blocking pass; #41 is closed
after the route-opacity repair and 32 new frame cases. #35 is closed as not reproduced: its axe error occurred
during timeout teardown after slow navigation, with no actionable axe defect
established. Historical evidence is retained; the unchanged blocking test passed.

Never alter last-known-good, lkg-2026-09-09 or cowork-v1 refs; see
[branch policy](../../BRANCHES.md) and [current branch record](BRANCHES.md).

Read AGENTS first, then this file, DECISIONS, LEARNINGS, PROGRESS, SCOPE and
HANDOVER. R/S/V are merged; D's documentation goes through coordinator-serialised
PR merge, not self-merge. Current acceptance is in PROGRESS; checkpoint sections
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
none. The old live artifact returns HTTP 200 without CSP; that is not acceptance
of the new strict-header package. DEPLOYMENT records the actual startup and
commit-verification steps; coordinator owns Azure mutations.

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

Infrastructure closure is tracked in INFRA-DONE.md. Do not write "complete and
frozen" until every checklist item has actual evidence. The current missing
verified-release/recovery evidence cannot be made true by documentation.
Revisit hosting only for an explicit owner decision or functional
requirement, with a decision record; do not weaken the strict CSP for speculation
about future features.