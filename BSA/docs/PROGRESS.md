---
title: Thirteen-task implementation progress
description: Authoritative task checklist, commit references and actual validation gates.
ms.date: 2026-09-10
---

## Checklist

* [x] Task 1: synthetic baseline model, calculator and shared scene estimates (ad7d5d8)
* [x] Task 2: local copy, attribution, default-Off and shared motion checks (b7c4451)
* [x] Task 3: shared scene estimates and six-stage pipeline with individual pain markers (96bf097)
* [ ] Task 4
* [ ] Task 5
* [ ] Task 6
* [ ] Task 7
* [x] Task 8: Shared case lifecycle and append-only history in the store (Stream B)
* [ ] Task 9: Pharmacy claims view (/pharmacy/claims) with claim detail and actions by state
* [ ] Task 10: Live round trip with Follow this item banner and Switch side
* [ ] Task 11: Tour chapter "What the pharmacy sees" after the queue; two-places chapter updated
* [ ] Task 12: Navigation, case header Pharmacy view link, header still one row
* [ ] Task 13: Verification of Tasks 8 to 13 in both toggle states (Vitest, Playwright, axe, screenshots)

## Current gate and contract freeze

Task 3 commit 96bf0973724c0ceb34d2532f2fc95dfd88f534c4 is confirmed from local
main. Final check, 386 units and 386 production browser tests passed. The user
confirmed Azure-host PASS and CI run 34526886080 SUCCESS. These remote gates
are the supplied handoff, not newly executed remote checks.

The current Step 0 increment freezes types, exact labels, throwing store
signatures and a heading-only claims route. It completes no Task 4-13 behaviour.
Contract check passed (exit 0), with 386 units in nine files passing (exit 0).
The existing Vite large-chunk warning remains. The contracts-only commit follows
these local checks; its immutable hash will be posted in the stream issues.
See [contracts](parallel-contracts.md)
for ownership, signatures, branch names and integration order. Stream A proceeds
with Task 4 only after this freeze; its local gates are not yet run.

## Task 8 gates and implementation

Stream B implemented the frozen lifecycle slice in the store with a deterministic
seeding module and its unit tests. No page, navigation or claims file changed.
Local check exit 0 with the existing large-chunk warning, and 400 units in ten
files passed, including seventeen store tests. Stream B owns no browser tests;
the browser suite remains Stream E's integration gate.

The seeded synthetic month covers the five existing pharmacies and distributes
the six canonical cases under their own contractor codes, alongside the six
queue fillers. Submissions fall in August and arrivals follow the existing
received times. Case E is released to existing pricing by code without a model
call, case F stays referred back by an operator, and A, B, C and D await an
operator in review.

Transitions are validated: a pharmacy submits, resubmits after a refer back or
confirms after a request for information; code routes into review; an operator
records the decision. Accept and amend reach the synthetic paid state. No event
carries an agent actor. Precheck snapshots are copied, records and history are
frozen, history is append-only and Reset restores the seeded month and clears
the followed case. Invalid identifiers, empty text, short reasons and disallowed
transitions leave state and history unchanged.

## Task 1 gates

Task 1 commit ad7d5d8. User-reported CI 34515828351 and 27 hosted checks passed.
Local check exit 0; 383 units in nine files; 371 production Chromium tests in
4.5 minutes, exit 0. The 48 axe audits had zero violations. Vite's existing
large-chunk warning remains; no zero-warning performance claim.

See [verification](../../.copilot-tracking/tasks/1/verification.json) and
[model formulas](task-1-baseline-model.md). Azure hosting was approved after
private Pages returned HTTP 422. Local tests retain the /BSA/ production base;
they do not verify Azure deployment.

## Task 2 gates and implementation

Task 2 commit b7c4451e64d27e4c7c410d9e5647722f7f6ee64b on main.
User-reported CI 34521892212 and 62 hosted passes followed the local gate.
Check exit 0; 383 units/nine files; 376 production Chromium tests in 4.7 minutes,
exit 0, no skips or retries. The 48 unique axe audits had zero violations.
298 screenshots were retained; desktop light On and phone dark Off were reviewed.

The client scan covered 103 files with zero forbidden matches. Copy checks
covered 31 routes in each flag state, expanded disclosures and 921 narrative
panels. Numeric words count; positive controls reject split prose, label/badge/link
evasions and unmarked prose. This is not exhaustive coverage of every interactive
state or a 25-word total-page limit.

Default and Reset are Off. On requires opt-in. The shared two-second transition
respects immediate/live reduced motion. Pain markers retain keyboard text and
abstention. Domain comparison against ad7d5d8 passed 72 case/month/flag/fault
variants. Gate predicates, outcomes, evidence, conflicts, signals, tools, timing
and fixtures remained intact. Reviewed changes were concise prose, synthetic
clause paraphrases and the evidence field rename to origin; no fields were dropped.

The research register moved unchanged after newline normalisation to the
[offline audit](../data/reference/source-audit.ts). Original supplied documents
remain untracked. The client imports no audit. Nine emitted assets and three
served text assets, 908,324 bytes, contained zero private matches. Chapter one
has one Sources footer. JS was 783.59 kB, 240.75 kB gzip, with the existing warning.

See [verification](../../.copilot-tracking/tasks/2/verification.json),
[check](../../.copilot-tracking/tasks/2/verified-check.log),
[units](../../.copilot-tracking/tasks/2/verified-unit.log) and
[browser](../../.copilot-tracking/tasks/2/verified-playwright.log).
Earlier failures are retained: 367 passed/9 failed, then 375 passed/1 failed
from a disclosure-navigation race, repaired before the final passing gate.

## Task 3 final gate and preserved history

Final corrected check exit 0; 386 units; 386 production Chromium tests in
4.9 minutes, exit 0. The [commit-ready log](../../.copilot-tracking/tasks/3/commit-ready.log)
supersedes all earlier pending-run and local-only statements formerly in the root
progress file. Task 3 is committed and its supplied CI/Azure gate is recorded above.

Chapter 3 leads with six stages and retains the A-D operator cards. Existing
scanning, printed extraction and deterministic pricing remain unchanged.
Seven manual gathering steps use the shared Task 1 inputs. Free-text reasons
and weeks-long referral cycles are assumptions, not observed practice.

The two-second clock sequences planning, gathering, retrieval, reconciliation,
assessment and gate presentation without writing domain state. Only built
exceptions receive proposals. Case D stays manual. The B draft is not sent;
exact-fix readiness requires complete presentation, PASS and its own marker.
The pharmacy exit precedes capture; pharmacy, queue and case links work.

Residual risk includes all abstentions plus deficient built items, without
double counting. Referral formulas remain unchanged. The referral-free proxy
is an estimate, not accuracy: zero volume/residual is Not established; positive
residual rounds down, never to 100%. The three public figures remain approximate
1.1 billion annual items, 85,000 monthly referrals and Monthly rulebook publication.
Publication frequency is not rule-change frequency.

Historical pre-correction gate: check exit 0, 385 units/nine files, 385 Chromium
tests in 5.1 minutes, exit 0, no skips/retries. Nine new browser tests covered
stage ordering, shared/zero/tiny estimates, tooltips, keyboard links, reversible
phases, reduced motion, responsiveness and accessibility. Six cases/gate unchanged.
Client scan: 106 files, zero forbidden matches. Privacy scan: nine emitted assets,
three served text assets, 919,617 bytes, zero private matches. JS 794.20 kB,
243.10 kB gzip, existing warning.

Retained historical logs: [check](../../.copilot-tracking/tasks/3/final-check.log),
[units](../../.copilot-tracking/tasks/3/final-unit.log),
[browser](../../.copilot-tracking/tasks/3/final-playwright.log).
Earlier focused 12 passed/2 failed from decimal serialization and tooltip focus;
a TypeScript context-literal error was repaired. Scope correction then passed
386 units and check (JS 794.92 kB/243.29 kB gzip). Its first browser run exposed
an outgoing tooltip locator ambiguity; exact name, focus, visibility and text
assertions were retained and repaired. The former active ID
441adf29-171f-4480-a2be-053d6ad00958 is historical, not a current execution.
Retained scope logs: [check](../../.copilot-tracking/tasks/3/scope-check.log),
[units](../../.copilot-tracking/tasks/3/scope-unit.log),
[browser](../../.copilot-tracking/tasks/3/scope-playwright.log).
Four [selected screenshots](screens/task3/README.md) were visually reviewed.

No full WCAG, manual screen-reader, Firefox/WebKit or performance claim is made.
Archive/rollback references remain untouched. This file is authoritative; the
root progress file is a pointer, not a second checklist.