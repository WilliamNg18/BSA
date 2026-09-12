---
title: Account-transfer scope checkpoint
description: Current implementation and acceptance status, frozen before repository transfer.
ms.date: 2026-09-12
---

# Scope register

**Resumption authorised:** transfer cancelled, repository public and ownership
remains WilliamNg18. The checkpoint record is preserved; its paused status is
historical. Streams resume from HANDOVER without waiting for a transfer.
Application main at the checkpoint was
`98c888184db1df9c03539413b5e3b1db47f1ebfe`; checkpoint documentation is pinned
by annotated tag `checkpoint-2026-09-12`. See [HANDOVER](HANDOVER.md) for
full branch heads, commands, dependencies and evidence boundaries.

**18 rows: 3 Done, 15 In progress, 0 Not started.**
Done is bounded implementation with accepted proof. In progress can mean
already-merged implementation awaiting the complete integrated acceptance or
final visual/narrative work. No implementation is described as missing when
it has actually merged. No unfinished work is unowned.

| Item | Current status / commit / owner | Test or evidence that proves it, or remains pending |
| --- | --- | --- |
| A1 Scene: three public figures, On count-in, single Sources | **Done**, main `98c8881`, Scene #27 / merged PR #31 | Combined check/591 units; 14 scene units; six scene browsers plus unchanged calculator retry; two axe reports clear. `scene-count-in.spec.ts`, `baseline.test.ts`, `tour.test.ts`. Public figures remain attributed/unverified, not animated invented facts. |
| A2 Month: seven steps, fixed judging, three defined shares, Sankey, shared scene | **Done**, `ad7d5d8`, `96bf097`, retained on `98c8881` | `baseline.test.ts` conservation/fixed-V*j/shared-selector guards in recorded unit passes; initial V month/scene images. No measured-savings claim. |
| A3 Separate six-stage pipeline with phase-related pain | **In progress, paused**. Implementation merged `c95ff1d`, Tour #26 / PR #30; final R #14 / PR #33 | T selected browser evidence passed across first run/retry. R fixed final split-chapter phase assertions at `696f077`; corrected three-test run passed. Complete corrected-head run interrupted for transfer. |
| A4 Separate Four cases: Off pain, On results, both actions | **In progress, paused**. Implementation merged `c95ff1d`; R final acceptance | `agent.test.ts` fixes six outcomes; `tour-cycle.spec.ts` order/actions; R now checks D on `/#cases` while pipeline remains `/#pipeline`. Full final proof pending. |
| A5 Two places: long Off/short On loops and pharmacy referral experience | **In progress, paused**. Implementation merged `c95ff1d`; R/V final acceptance | Seven manual/five assisted steps per place, eight/six referral steps, human decisions retained. T semantic and real-cycle tests passed; final integrated run/images pending. |
| A6 Queue chapter at `/queue` | **In progress, paused**. Chapter six merged `c95ff1d`; R #14 | `tour-cycle.spec.ts` cross-page Next/Back and `queue.spec.ts` logical scrolling/sweep/day coverage; corrected-head full run pending. |
| A7 Claims chapter: referral, correction, resubmission, re-check, synthetic paid | **In progress, paused**. Guide merged `c95ff1d`; R #19/#29 fixes only PR #33 | T both-mode real human/code cycle tests passed. R approval/history/manual-pain fixes and new tests are checkpointed, not merged; final acceptance and V captures pending. |
| A8 Where it ends | **In progress, paused**. Chapter eight merged `c95ff1d`; R/V | Eight-chapter unit/order/browser checks passed within T; final integrated navigation and story refresh pending. |
| Rail: Next/Back, cross-page, dismiss/restore | **In progress, paused**. T `c95ff1d` + S `22ec345` merged; R final proof | Scoped tour navigation and S focus-restoration checks passed. R's stale heading test corrected/passed; full corrected-head run incomplete. |
| B Pharmacy check: Today pain/timeline, staged check, exact fix, receipts, three scenarios, shared submit | **In progress, paused**. Foundation `a131bad`/`7bdc199`/`d9e06e1`, healthy status `ff00b3e`; R | Helper proof: 26/29 initial plus three unchanged rechecks, 12 axe outputs clear. Three specific timing cases under #34; new A/B/D status guards remain blocking. Full integration pending. |
| C Claims: selector/states/list/detail/history/actions, manual pain and approved On reasons | **In progress, paused**, R #19/#29, PR #33 | Base exists on `d9e06e1`; final two presentation fixes remain on R checkpoint `500e883`. Eight approval cases and four comparison cases passed in scoped runs; 16 component-state unit cases. Complete current acceptance/merge pending. |
| D Queue: virtual month, following counter, sweep counters, 17:00 summary, Compare, local toggle | **In progress, paused**. Base `034121f`; Compare `11ea042` merged; R/V | Queue projection units and scoped eight Compare browser cases/four axe outputs clear; combined check/577 units at Queue closeout. Full final run and Compare captures pending. |
| E Case views: empty assisted slots Off, trace/pack assembly On, full record/July replay | **In progress, paused**. `36db32a`, S `22ec345`; R | Original manual/assisted implementation retained. Off qualifies the synthetic comparison, not real NHSBSA record absence. Canonical controls/scoped checks passed; full corrected-head proof pending. |
| F Shared lifecycle: seven states/both labels, actors, five pharmacies/six cases, Reset | **Done**, integrated `d9e06e1`, retained `98c8881` | `lifecycle-store.test.ts`, revisions/bridge/agent guards in passing unit suites. Immutable history, agent transition rejection and original fixtures retained. Tasks 8-13 overall acceptance is separate. |
| G Off-then-On round trip, global Follow/Switch side, both-side UI assertions | **In progress, paused**, R #14 / PR #33 | Mixed-mode and canonical focused tests passed; three final chapter corrections passed. Exact current full fallback interrupted; no complete pass. Two-minute story and elapsed time are informational, not a performance gate. |
| H Site: one-row header 360-1920, grouped controls, default/Reset Off, concise truthful copy, synthetic notice, motion/pain/accessibility | **In progress, paused**. S `22ec345` merged; R/V | S 183 scoped Linux cases, 247 axe/183 CSP reports clear; affected 38/40 plus two unchanged passes, nine keyboard checks, seven axe/nine CSP reports clear. R final failed-run artifact has 673 axe/193 CSP reports clear but three test failures. No full WCAG claim. |
| I Hosting and gates | **In progress, paused**. Config `d9e06e1`, budgets removed `b23e478`, strict-header server `22ec345` | Config/build/unit contracts implemented. SWA resource/token/live URL unverified; GitHub replacement job refused before tests by billing/spending restriction. Free has three concurrent previews; triggers do not prove live deployment. |
| J Documentation/memory/progress/screens/known issues | **In progress, paused**, V #16/#25 draft PR #24, D #17 | Main transfer records updated; V checkpoint has 103 original images and prepared 107-image harness, not executed on final code. Numeric audit 33/4/29/0. D readiness only; final task ticks/report pending R then V merges. |

## Frozen owners

Full checkpoint SHAs and exact resumption commands are in HANDOVER. Short IDs
here identify the same commits, not additional unpushed work.

| Stream | Branch | Checkpoint | Delivery / next dependency |
| --- | --- | --- | --- |
| R | `williamng18-production-round-trip` | `500e883` | PR #33 not merged; finish exact full acceptance after resume |
| S | `williamng18-accessibility-strict-csp` | `db7077b` | PR #22 merged; assist only with concrete integration failures |
| V | `williamng18-visual-reconciliation-and-demo-docs` | `b3acc13` | Draft #24; final rebase/107 captures after R |
| D | `williamng18-issue-17-stream-d-final-memory-task-acceptance-an-b76afa` | `76b36b7` | Readiness only; final authoring after R/V |
| Parity/helper | `williamng18-parity-verification-and-owned-applicatio` | `8ca238f` | PRs #21/#23/#36 merged; #34 and final parity remain |
| Tour | `williamng18-eight-chapter-tour-and-referral-cycle` | `462cba6` | PR #30 merged; R owns final chapter tests |
| Scene | `williamng18-scene-estimate-count-in` | `df5d8eb` | PR #31 merged |
| Queue | `williamng18-queue-comparison-control` | `2745498` | PR #32 merged |

No scope row is Not started. Owner-authorised work resumes from this preserved
checkpoint. Do not merge empty checkpoint commits from completed streams as
new features or claim a browser inventory is an executed pass.
