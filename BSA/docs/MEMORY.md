---
title: Durable project facts
description: Read first at each task; correct facts in place rather than appending history.
ms.date: 2026-09-10
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
  Contracts only until Task 8. Paid is synthetic, attributed to existing pricing.

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

## Branches and task records

Repository root is the parent of the app folder BSA. Main integrates verified
work. Task 3 baseline is 96bf0973724c0ceb34d2532f2fc95dfd88f534c4; user confirmed
386 units, 386 browser tests, Azure PASS and CI 34526886080 SUCCESS.
Azure Static Web Apps Free is the only hosting target; production and local
browser tests use `/`. Root configuration is emitted into BSA/dist. The
project has no byte/performance budgets. Gzip size, word counts, Lighthouse and
screenshot differences are informational; typecheck, lint, build, units,
crash/control/six-outcome tests and axe block.
Provisioning and the deployment token require owner setup in DEPLOYMENT.md;
no current hosted URL is verified. The integrated lifecycle is implemented
but Tasks 8-13 stay unchecked until the R/S/V/D acceptance streams conclude.
Never alter last-known-good or cowork-v1 branches/tags; see
[branch policy](../../BRANCHES.md).

Read this file first, then [progress](PROGRESS.md), [learnings](LEARNINGS.md),
[decisions](DECISIONS.md) and [parallel contracts](parallel-contracts.md).
Every task commit updates progress. Append surprises to learnings and decisions
to the decision record. Correct this file in place; Stream E owns final updates
during parallel integration. No task beyond the authorised increment is complete.