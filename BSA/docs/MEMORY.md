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

## Transfer freeze and current state

The repository is about to transfer from WilliamNg18/BSA to an enterprise
owner whose name has not been supplied. The personal account must remain a
collaborator as requested; verify the actual transferred permissions after
resume rather than claiming they have already been configured.
All streams are stopped. No merge, test or implementation resumes until a
new-owner session says exactly `Resume from docs/HANDOVER.md`.

Git root contains the nested application `BSA`. Application main at freeze is
`98c888184db1df9c03539413b5e3b1db47f1ebfe`; annotated
`checkpoint-2026-09-12` pins the main handover/tracking commit. Stream tags
and full branch heads are listed in [HANDOVER](HANDOVER.md).

Tasks 1-7 are Done. Tasks 8-13 are In progress and paused for remaining
integrated acceptance and final documentation. Eight chapters/nine stops,
full referral-cycle guide, queue Compare, scene count-in, healthy manual
pharmacy status and S's CSP/focus/motion fixes are merged. R's approved-only
On reasons and manual-resubmission pain fixes are on PR #33, not main.
V's draft #24 preserves 103 initial images; its final 107-image harness is
prepared but has not run against the complete final application. D has
completed readiness only and must not tick final tasks yet.

Azure Static Web Apps Free is the only hosting target; production and local
browser tests use `/`. Root configuration is emitted into BSA/dist. The
project has no byte/performance budgets. Gzip size, word counts, Lighthouse and
screenshot differences are informational; typecheck, lint, build, units,
crash/control/six-outcome tests and axe block.
The token is absent, resource/subscription and live URL unverified. Replacement
GitHub CI jobs failed before starting because of an account payment/spending
restriction; no billing change was made. R's local full fallback was
interrupted for transfer, not passed. Prior exact evidence: check/607 units,
Linux 1,016 passes/three stale test failures, then all three corrected tests
passed; 673 axe and 193 CSP reports from the failed run were clear.

Never alter last-known-good, lkg-2026-09-09 or cowork-v1 refs; see
[branch policy](../../BRANCHES.md).

Read AGENTS first, then this file, DECISIONS, LEARNINGS, PROGRESS, SCOPE and
HANDOVER. After authorised resume, merge R (S already merged), then V, then
D's final acceptance record. Old issue text mentioning size budgets or
unconditional autonomous work is superseded by the current gates and freeze.