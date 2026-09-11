---
title: Current limitations and verification boundaries
description: Genuine caveats for the integrated synthetic demonstration, separated from historical results.
ms.date: 2026-09-11
---

## Current scope

The shared lifecycle, pharmacy claims/detail, round trip, seven-chapter tour and
cross-side navigation are implemented. They are not outstanding feature gaps.
Tasks 8-13 acceptance remains separate from implementation and is tracked in
[PROGRESS.md](PROGRESS.md). Stream V owns documentation and captures, not product
or regression-test fixes.

The agent gathers evidence and recommends; deterministic code validates and
calculates; a human decides. Nothing in this demonstration calculates or
approves a payment. `Payment approved (synthetic)` is a lifecycle label for
existing pricing, not evidence of a payment service.

## Deployment is not provisioned

Azure Static Web Apps Free at `/` is the only target. No intended subscription
was selected, no deployment token supplied and no live URL verified.
[DEPLOYMENT.md](DEPLOYMENT.md) is the owner setup procedure. Local production
preview does not establish deployed deep links, response headers, cache policy
or strict-CSP behaviour on Azure.

## Deliberate demonstration limits

| Area | Current limitation |
| --- | --- |
| Interpretation | Scripted case readings and a deterministic typed-field mock, not live model inference or handwriting capture |
| Evidence | Synthetic cases, rule paraphrases, product data and enterprise tool responses, not authentic clinical or tariff evidence |
| History | Append-only within the browser session; reload and confirmed Reset restore seeds, not durable records |
| Offline | Loaded-session navigation is supported; a cold offline load or reload is not guaranteed |
| Queue | Virtual month and sweep are bounded synthetic projections, not a live operational work queue or measured capacity |
| Today | Metadata-only examples show manual tasks, not fabricated prescriptions, retrieved citations or a full operator case |
| Outcomes | C's 56/84 conflict remains unresolved after confirmation; D stays manual with no guaranteed payment |
| Timing and benefits | Gathering, judging, delay and assembly figures are illustrative assumptions, not measured NHSBSA performance |
| Referral projections | Deficient built/abstained shares estimate referrals; the distinct risk residual includes every abstention. Neither the count nor the referral-free percentage measures accuracy |
| Confidence | Five structural signals with synthetic thresholds, not a calibrated probability or clinical assurance |
| Public context | Attributed figures were not independently verified; referrals are not all exceptions; publication frequency is not change frequency |
| Fonts | Synthetic handwriting uses platform cursive fallbacks, so appearance can vary across operating systems |

No capture integration, dispensing-system integration, live retrieval/model,
monitoring, durable audit storage or payment calculation is included. A shared
operational service remains a proposal even though local cross-side history works.

## Reported integration finding

On baseline `d9e06e1`, opening `/pharmacy/claims?caseId=EX-24112` and turning
Agent On displays the seed's **Human decision reason** ("Endorsement initialled
but not dated") alongside **No operator-approved draft**. It does not falsely
claim approval, but the unapproved reason is still pharmacy-visible in On,
contrary to the stricter requirement that every On reason be an operator-approved
draft. R also confirmed the same exposure in expanded pharmacy lifecycle
history. R owns the correction in [#19](https://github.com/WilliamNg18/BSA/issues/19);
V does not modify the product. The explicit approval round trip itself works.

The newer eight-chapter request adds distinct pipeline/Four cases chapters and
a whole-cycle claims chapter (#26). Scene count-in (#27), queue Compare (#28)
and explicit manual claims-resubmission pain (#29) are also active owned
increments, not yet merged acceptance. [SCOPE.md](SCOPE.md) records the
18-item implementation register and named evidence without treating test
presence as completion.

The pharmacy workbench also labels Agent Off as **Agent unable to determine**,
including complete A. This makes an intentionally unchecked manual path look
like an assistance failure. The parity stream owns the status-only correction in
[#20](https://github.com/WilliamNg18/BSA/issues/20); Off must still perform no
precheck and must leave submission available. Refresh pharmacy Off captures
after that correction merges.

## Current local evidence

The initial Stream V capture candidate is Phase 1 `d9e06e1`. `npm run check`
passed, including typecheck, lint and production build. Runtime assets totalled
201,623 gzip bytes. That baseline still reported an advisory threshold; the
subsequent user direction removes all size/performance budgets. Gzip size,
Lighthouse, word counts and screenshot differences are informational only.

The first default-worker Vitest run passed 559 tests and timed out one
`measure-budget-cli.test.ts` test at its 5,000 ms limit. A bounded rerun,
`npm test -- --maxWorkers=2`, passed all 560 tests in 20 files. Retain the initial
timeout as execution evidence, not a product defect or a hidden passing run.

The [integrated screenshot manifest](screens/integrated/manifest.json) records
source revision, actual capture time, 1440px viewport, Agent state, image hashes,
browser errors, overflow and axe results. The adjacent
[capture index](screens/integrated/README.md) distinguishes initial evidence from
post-integration refresh. Visual differences are informational; crashes, broken
controls and accessibility violations remain blocking and must be reported.

Initial captures are local light-theme Chromium evidence, not full manual WCAG
2.2 AA conformance, screen-reader verification, Firefox/WebKit coverage, mobile
coverage, final integration approval, CI or a deployment result. R/S own the
broader regression/accessibility gates; V refreshes after both and the #20
parity correction merge.

## Historical evidence, not current blockers

Historical results remain in [PROGRESS.md](PROGRESS.md),
[LEARNINGS.md](LEARNINGS.md), [qa-pr1.md](qa-pr1.md) and the
[Task 7 capture record](screens/task7/README.md). Their older build sizes,
route layouts, test totals, host assumptions and performance thresholds do not
describe the integrated root-path application.

In particular, the historical Task 7 result was 503 unit tests, 721 browser
tests, 334 axe audits with zero violations, mobile Lighthouse scores 91/91/90
and 199,651 gzip bytes. Those are not a fresh verification of this branch.
The earlier mobile 86 and unchanged-baseline 93 remain historical measurements;
the final median does not prove a causal five-point improvement.

The previously listed missing claims/lifecycle integration, planned queue,
immediate Reset, absent grouped navigation, old 900ms trace without step/pause
and missing tests are obsolete. Manual decisions without a recommendation
are not counted as overrides; the old Stream B integration caveat is not a
current release blocker.
