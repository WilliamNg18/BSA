---
title: Integrated production screenshot index
description: Fresh 1440px root-path captures, Agent comparisons and human-controlled round-trip evidence.
ms.date: 2026-09-12
---

## Status and scope

**Provenance after the route-opacity repair:** this 107-image set and its build
report remain pinned to `898cda5`, exactly as captured. They are not relabelled
as new runtime evidence. The [scoped route comparison](../route-opacity-parity/README.md)
records **64/64 byte-identical** route reproductions on the later `82c18e4` build and retains
the remaining 43 state images at their original source. Normal-motion frame
contrast safety is proved by the new held-frame regression, not these
reduced-motion settled photographs.

**Complete:** 107 fresh images and 107 individual axe JSONs, 53 Off / 54 On.
The final continuation exited zero at `2026-09-12T11:50:58.433Z`. Every PNG's
SHA-256 and 1440px width was checked and every full-height image was visually
reviewed. The manifest reports zero axe violations, horizontal-overflow
captures and page/console/CSP errors. The initial harness interruption is
retained separately below; this is not an uninterrupted-first-attempt claim.

The final matrix targets accepted application source
`898cda594d0dcb34376bddab7112edcddb172440`, with unchanged runtime on the rebased
V documentation branch. It uses the root-path production build and actual
emitted global security headers on localhost:4193, not Vite development mode
or a claimed Azure deployment.

Every capture is 1440 x 1000 viewport, device scale 1, light theme, reduced
motion and full page. Images are freshly generated for this source. The old
103-image seven-chapter set remains in the immutable
[checkpoint](https://github.com/WilliamNg18/BSA/tree/b3acc1392dfc5074a943a184e026a4fb856341fc/BSA/docs/screens/integrated),
not mixed into the new manifest. Contact-sheet slices are review aids, not
additional captures. The pointer is moved away and decision notifications are
dismissed through their real control. A focused Agent switch can retain its
normal explanatory tooltip in route captures; it is not hidden or pixel-masked.

| Coverage | Unique images |
| --- | ---: |
| 32 destinations, Agent Off and On | 64 |
| Seven selected claim states with expanded history, Off and On | 14 |
| Additional pharmacy A and D scenarios, Off and On (B is in the route matrix) | 4 |
| Eight round-trip checkpoints, entirely Off and entirely On | 16 |
| B's original referral replayed under July, On | 1 |
| Operations menu, Reset dialog, Today dialog and Queue Compare, Off and On | 8 |
| Total | 107 |

The [manifest](manifest.json) records source revision, capture time, URL,
viewport, Agent state, heading, SHA-256, horizontal overflow, browser errors
and all-default-rule axe violations per image. Its `applicationSourceRevision`
pins runtime; `sourceRevision` pins the rebased documentation checkout used
during capture. A non-null `runtimeError`, non-empty `failures` or false
`completed` means this is not a finished passing matrix.

Each image has its own JSON in [axe](axe), containing actual engine/version,
timestamp, full violations, passing/incomplete rule node counts and inapplicable
rule IDs. No rule filter or disabled rule is used. Incomplete rules are
manual-review candidates, not silently treated as full conformance.
Fifty-one audits contain incomplete results (49 include color-contrast;
smaller overlapping sets include ARIA checks). They remain recorded, not
converted into violations or a claim of full manual conformance.
The final inventory is 53 Off and 54 On images/audits; the extra On image is
B's July counterfactual. These are V's actual capture audits, not a deduplicated
count inferred from the successful CI run, whose artifacts were not uploaded.

No dark/mobile/cross-browser coverage or full manual WCAG conformance is claimed
by this matrix. Those wider regression gates belong to the coordinated
verification streams. No token is needed for this local evidence.

## Final surfaces and evidence boundaries

The 107-image inventory includes independent pipeline `/#pipeline` and Four
cases `/#cases` destinations and both queue Compare states. All eight chapters,
including the full-cycle claims guide, are covered through their actual routes.

For the merged scene count-in, the On capture also asserts that all five visual
numbers equal their stable final accessible labels before the screenshot.
It does not replace intermediate text or mask the animation. Reduced motion
remains the stated capture preference; animation acceptance belongs to the
scene stream's normal/reduced-motion tests, not this static matrix.

Queue comparison uses **Jump to 17:00**, then **Compare** in **Queue controls**,
and requires the inline **Today versus With agent** region. Both Agent states
use the same scenario/day, without changing lifecycle or assistance as a side
effect. The guide shows all five explanatory stages separately from actual
recorded state; the round-trip checkpoints exercise the real actions.

[Build evidence](build-evidence.json) records every emitted resource hash and
its independent gzip size. All four resources total **203,723 gzip bytes**,
informational only. No size threshold or new budget is introduced.
[Capture attempts](capture-attempts.json) retains the harness-only interruption
after the first 32 fresh routes and its same-source continuation. It was a
misplaced completion-count assertion, not an application defect or a successful
first uninterrupted run. No old-source images were resumed.

## Exact capture procedure

From repository root, with locked dependencies already installed in `BSA`:

```powershell
Set-Location BSA
npm run check
$env:PLAYWRIGHT_PORT = "4193"
node scripts\serve-production.mjs
```

Keep that single strict-header server running. From a second PowerShell at repository root:

```powershell
node BSA\docs\screens\integrated\capture.mjs
```

The script uses the repository's Playwright Chromium and axe dependencies,
one sequential worker, fresh browser contexts and only public UI controls. Each route loads directly
under `/`; the global switch is set explicitly after navigation. It waits for
fonts and the two-second presentation window, then captures without hiding
content, overriding styles, disabling rules or changing domain state through
test hooks. History expansion targets the outer disclosure and asserts it is
open, including when nested advisory snapshots exist.

Claim detail captures filter the default synthetic pharmacy by each lifecycle
state, open the first matching claim and expand History and attempts. The
round-trip captures submit B unchanged, start review, record a human referral,
approve the draft only in On, correct/resubmit, explicitly re-open for review,
record a sufficient human disposition and inspect pharmacy history. The On
sequence also compares July with the original August referral.

`--resume` can continue an interrupted run **only at the same source revision**.
It preserves completed route captures and refreshes claim-detail disclosures;
do not use it after rebase or a product rebuild. A fresh run replaces the matrix.
The old checkpoint's disclosure-locator repairs are historical and separate
from the current attempt record.

The mixed-mode exact-click story in [demo-script.md](../../demo-script.md)
is rehearsed separately: Off submission/manual review, On recommendation and
approved correction, then Off again after the human disposition. It preserves
three immutable attempts and the original July counterfactual.

## Overview, operations and reflective screens

| Destination | Agent Off | Agent On |
| --- | --- | --- |
| Scene | [Off](overview-scene-off-1440.png) | [On](overview-scene-on-1440.png) |
| Month calculator | [Off](overview-month-off-1440.png) | [On](overview-month-on-1440.png) |
| Pipeline | [Off](overview-pipeline-off-1440.png) | [On](overview-pipeline-on-1440.png) |
| Four cases | [Off](overview-four-cases-off-1440.png) | [On](overview-four-cases-on-1440.png) |
| Two places | [Off](overview-two-places-off-1440.png) | [On](overview-two-places-on-1440.png) |
| Where it ends | [Off](overview-close-off-1440.png) | [On](overview-close-on-1440.png) |
| Pharmacy B | [Off](pharmacy-b-off-1440.png) | [On](pharmacy-b-on-1440.png) |
| Pharmacy A | [Off](pharmacy-a-off-1440.png) | [On](pharmacy-a-on-1440.png) |
| Pharmacy D | [Off](pharmacy-d-off-1440.png) | [On](pharmacy-d-on-1440.png) |
| Claims list | [Off](claims-off-1440.png) | [On](claims-on-1440.png) |
| Queue | [Off](queue-off-1440.png) | [On](queue-on-1440.png) |
| Evaluation | [Off](evaluation-off-1440.png) | [On](evaluation-on-1440.png) |
| Boundary | [Off](boundary-off-1440.png) | [On](boundary-on-1440.png) |
| Assumptions | [Off](assumptions-off-1440.png) | [On](assumptions-on-1440.png) |
| Architecture | [Off](architecture-off-1440.png) | [On](architecture-on-1440.png) |
| Not found | [Off](not-found-off-1440.png) | [On](not-found-on-1440.png) |

## All six cases: pack, trace and record

Seeded records are shown as they actually exist. A-E have honest empty decision
record views until a human decision is recorded; F retains DR-000871. The
round-trip series below supplies newly created B record states.

| Case | Pack Off / On | Trace Off / On | Record Off / On |
| --- | --- | --- | --- |
| A | [Off](EX-24107-pack-off-1440.png) / [On](EX-24107-pack-on-1440.png) | [Off](EX-24107-trace-off-1440.png) / [On](EX-24107-trace-on-1440.png) | [Off](EX-24107-record-off-1440.png) / [On](EX-24107-record-on-1440.png) |
| B | [Off](EX-24112-pack-off-1440.png) / [On](EX-24112-pack-on-1440.png) | [Off](EX-24112-trace-off-1440.png) / [On](EX-24112-trace-on-1440.png) | [Off](EX-24112-record-off-1440.png) / [On](EX-24112-record-on-1440.png) |
| C | [Off](EX-24119-pack-off-1440.png) / [On](EX-24119-pack-on-1440.png) | [Off](EX-24119-trace-off-1440.png) / [On](EX-24119-trace-on-1440.png) | [Off](EX-24119-record-off-1440.png) / [On](EX-24119-record-on-1440.png) |
| D | [Off](EX-24123-pack-off-1440.png) / [On](EX-24123-pack-on-1440.png) | [Off](EX-24123-trace-off-1440.png) / [On](EX-24123-trace-on-1440.png) | [Off](EX-24123-record-off-1440.png) / [On](EX-24123-record-on-1440.png) |
| E | [Off](EX-24101-pack-off-1440.png) / [On](EX-24101-pack-on-1440.png) | [Off](EX-24101-trace-off-1440.png) / [On](EX-24101-trace-on-1440.png) | [Off](EX-24101-record-off-1440.png) / [On](EX-24101-record-on-1440.png) |
| F | [Off](EX-24088-pack-off-1440.png) / [On](EX-24088-pack-on-1440.png) | [Off](EX-24088-trace-off-1440.png) / [On](EX-24088-trace-on-1440.png) | [Off](EX-24088-record-off-1440.png) / [On](EX-24088-record-on-1440.png) |

## Expanded claim detail and history

| Lifecycle state | Agent Off | Agent On |
| --- | --- | --- |
| Submitted | [Off](claims-detail-submitted-off-1440.png) | [On](claims-detail-submitted-on-1440.png) |
| In review | [Off](claims-detail-in_review-off-1440.png) | [On](claims-detail-in_review-on-1440.png) |
| Information requested | [Off](claims-detail-information_requested-off-1440.png) | [On](claims-detail-information_requested-on-1440.png) |
| Referred back | [Off](claims-detail-referred_back-off-1440.png) | [On](claims-detail-referred_back-on-1440.png) |
| Resubmitted | [Off](claims-detail-resubmitted-off-1440.png) | [On](claims-detail-resubmitted-on-1440.png) |
| Paid (synthetic, existing pricing) | [Off](claims-detail-paid-off-1440.png) | [On](claims-detail-paid-on-1440.png) |
| Escalated | [Off](claims-detail-escalated-off-1440.png) | [On](claims-detail-escalated-on-1440.png) |

## Round trip and overlays

| Checkpoint | Agent Off | Agent On |
| --- | --- | --- |
| Submitted and followed | [Off](roundtrip-1-submitted-off-1440.png) | [On](roundtrip-1-submitted-on-1440.png) |
| Explicit human review | [Off](roundtrip-2-review-off-1440.png) | [On](roundtrip-2-review-on-1440.png) |
| Recorded referral | [Off](roundtrip-3-referral-record-off-1440.png) | [On](roundtrip-3-referral-record-on-1440.png) |
| Pharmacy receives reason | [Off](roundtrip-4-referral-received-off-1440.png) | [On](roundtrip-4-referral-received-on-1440.png) |
| Corrected endorsement | [Off](roundtrip-5-corrected-off-1440.png) | [On](roundtrip-5-corrected-on-1440.png) |
| Resubmitted, human re-check required | [Off](roundtrip-6-resubmitted-off-1440.png) | [On](roundtrip-6-resubmitted-on-1440.png) |
| Sufficient human record and attempts | [Off](roundtrip-7-human-record-off-1440.png) | [On](roundtrip-7-human-record-on-1440.png) |
| Pharmacy synthetic disposition | [Off](roundtrip-8-synthetic-paid-off-1440.png) | [On](roundtrip-8-synthetic-paid-on-1440.png) |
| July counterfactual | Disabled in manual comparison | [July Sufficient](roundtrip-july-sufficient-on-1440.png) |
| Operations menu | [Off](operations-menu-off-1440.png) | [On](operations-menu-on-1440.png) |
| Reset confirmation | [Off](reset-dialog-off-1440.png) | [On](reset-dialog-on-1440.png) |
| Today manual-work dialog | [Off](queue-today-off-1440.png) | [On](queue-today-on-1440.png) |
| Queue Compare at 17:00 | [Off](queue-compare-off-1440.png) | [On](queue-compare-on-1440.png) |

Size, performance, word counts and screenshot differences are informational,
not budgets or approval gates. Functional/accessibility defects found in any
capture still require correction. Historical selected images remain in their
task directories and are explicitly labelled as historical evidence.
