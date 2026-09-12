---
title: Integrated production screenshot index
description: Fresh 1440px root-path captures, Agent comparisons and human-controlled round-trip evidence.
ms.date: 2026-09-11
---

## Status and scope

Initial Stream V evidence is captured from Phase 1 `d9e06e1`. This is **local
production preview**, not a deployed Azure site or final R/S integration
acceptance. After the coordinator releases all tested R/S, pharmacy-status and
new-scope behaviour merges, V rebases on `origin/main`, rebuilds and refreshes
captures before its PR becomes ready.

The initial matrix contains 103 unique full-page PNGs, all from a 1440 x 1000 viewport,
device scale 1, light theme and reduced motion. These are fresh captures, not
copies of earlier screenshots. Contact-sheet crops used for visual review are
not additional captures and are not committed.

All 103 initial images were reviewed in full-height contact-sheet slices.
The initial On route captures retain the switch tooltip, and some decision
captures retain their notification. The final-refresh procedure moves the
pointer away and uses Dismiss notification so neither obscures the evidence;
it does not mask pixels or alter application styles.

| Coverage | Unique images |
| --- | ---: |
| 31 destinations, Agent Off and On | 62 |
| Seven selected claim states with expanded history, Off and On | 14 |
| Additional pharmacy A and D scenarios, Off and On (B is in the route matrix) | 4 |
| Eight round-trip checkpoints, entirely Off and entirely On | 16 |
| B's original referral replayed under July, On | 1 |
| Operations menu, Reset dialog and Today dialog, Off and On | 6 |
| Total | 103 |

The [manifest](manifest.json) records source revision, capture time, URL,
viewport, Agent state, heading, SHA-256, horizontal overflow, browser errors
and all-default-rule axe violations per image. A non-null `runtimeError` or
non-empty `failures` means the capture run did not finish cleanly.
The final-refresh harness checkpoints this manifest after every image and
records `expectedCaptureCount` and `completed`. An interrupted run cannot be
presented as a complete matrix, and resumed failures are rechecked rather than
discarded. The initial manifest predates those two added completion fields;
its 103 entries were independently counted and hash-verified.

No dark/mobile/cross-browser coverage or full manual WCAG conformance is claimed
by this matrix. Those wider regression gates belong to the coordinated
verification streams. No token is needed for this local evidence.

## Prepared final inventory, not yet captured

The capture script now targets the settled T #26 / PR #30 and queue #28
selectors. **Do not run it against the older seven-chapter build.** Its planned
inventory is 107 images: the existing 103 plus two independent Four cases
captures and two queue Compare captures. The pipeline moves to `/#pipeline`;
Four cases uses `/#cases`. All eight chapters, including the full-cycle claims
guide, are covered through their actual routes.

For the merged scene count-in, the On capture also asserts that all five visual
numbers equal their stable final accessible labels before the screenshot.
It does not replace intermediate text or mask the animation. Reduced motion
remains the stated capture preference; animation acceptance belongs to the
scene stream's normal/reduced-motion tests, not this static matrix.

Queue comparison uses **Jump to 17:00**, then **Compare** in **Queue controls**,
and requires the inline **Today versus With agent** region. Both Agent states
use the same scenario/day, without changing lifecycle or assistance as a side
effect. These four additional images are pending, not missing historical files;
links and final totals will be published only after real captures and review.
The initial manifest remains the 103-image source record until that refresh.

## Exact capture procedure

From repository root, with locked dependencies already installed in `BSA`:

```powershell
Set-Location BSA
npm run check
npm run preview -- --host localhost --port 4193 --strictPort
```

Keep preview running. From a second PowerShell at repository root:

```powershell
node BSA\docs\screens\integrated\capture.mjs
```

The script uses the repository's Playwright Chromium and axe dependencies,
fresh browser contexts and only public UI controls. Each route loads directly
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
Earlier capture-attempt issues were harness-only: an unawaited disclosure
lookup and an ambiguous nested summary. They were corrected rather than
documented as application defects.

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
| Two places | [Off](overview-two-places-off-1440.png) | [On](overview-two-places-on-1440.png) |
| First test | [Off](overview-close-off-1440.png) | [On](overview-close-on-1440.png) |
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

Size, performance, word counts and screenshot differences are informational,
not budgets or approval gates. Functional/accessibility defects found in any
capture still require correction. Historical selected images remain in their
task directories and are explicitly labelled as historical evidence.
