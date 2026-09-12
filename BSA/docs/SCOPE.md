---
title: Requested scope and implementation ownership
description: Eighteen-row implementation register for the latest eight-chapter demonstration request.
ms.date: 2026-09-12
---

# Scope register

**Snapshot:** main `98c888184db1df9c03539413b5e3b1db47f1ebfe`, 12 September
2026, includes S #22, Helper #23, T #30, Queue #32 and Scene #31. R #33 and V #24 remain unmerged. Baseline
evidence still names its original revision rather than being relabelled as a
fresh run. **Eight chapters/nine stops are now implemented on main.**
Their combined-artifact browser acceptance remains separate from earlier
branch-local proof and is still R-owned.

**Totals: 3 Done, 15 In progress, 0 Not started, 18 rows.** Every incomplete
row has an active implementation or verification owner. Newly identified
missing increments are linked to #27, #28 and #29, not hidden by the aggregate
In progress status. Those issues were assigned after discovery. T #26 owns
the separate chapter and whole-cycle gaps.

Done means the listed bounded implementation has concrete named passing
evidence on the stated main lineage. It does not mean the entire application,
new chapter arrangement or hosted deployment is accepted. In progress means
implementation, a required correction or its acceptance is unfinished; a test
file's existence alone is never a PASS. Not started would require a linked
new issue with no implementation underway. Owner names below resolve to exact
branches/PRs in the owner register.

## Evidence keys

* **U:** V's actual `npm test -- --maxWorkers=2` at application source
  `d9e06e1`: 560 tests in 20 files passed. The named unit tests below were
  included. The first default-worker run had 559 passes and one 5,000 ms
  budget-CLI timeout; that failed run is not relabelled as passing.
* **P:** [PARITY.md on audited main](https://github.com/WilliamNg18/BSA/blob/8c05b184f6c68ca1420fece3bfa8f46b15112f6c/BSA/docs/PARITY.md) records the separate six-file, 353-test
  targeted pass at `b23e478`, including baseline, queue, tour, agent,
  lifecycle-revision and lifecycle-bridge guards. This is received recorded
  evidence, not another run by V. Main's later 553-unit total reflects removal
  of seven budget tests, not lost application assertions.
* **V:** [Initial capture manifest pinned before V merge](https://github.com/WilliamNg18/BSA/blob/bd4a6e7/BSA/docs/screens/integrated/manifest.json):
  103 unique, hash-verified, visually reviewed 1440px light/reduced-motion
  production images from `d9e06e1`, with zero recorded axe/overflow/page-console
  errors. Capture labels below identify the actual images, not motion or
  cross-browser tests. A separate public-control mixed Off/On/Off B rehearsal
  preserved three attempts, July Sufficient and the human disposition.
* **R pending:** the corrected production suite collected 783 tests on R's
  branch. At this snapshot its full run is still advancing; there is no final
  aggregate PASS. Listed browser test names identify required coverage, not
  completed results unless explicitly stated otherwise.
* **S accepted slice:** coordinator-verified Linux CI
  [34629986842](https://github.com/WilliamNg18/BSA/actions/runs/34629986842),
  artifact `10277495935`, at S commit `1a103e3`: 183 unique CSP reports and
  247 unrestricted axe audits, zero violations and no S error contexts,
  including phone-pack reflow. Overall CI was **760 passed / 205 failed**,
  not a full pass. R owns remaining regression failures.
* **S merged:** PR #22 merged as `22ec3459` from final head `39652c721532dcd5291b17f26950d7591171f291`.
  Later AppShell focus and Reset computed-motion fixes at `32b5342` passed
  check and 557 units in 19 files. The affected run had **38 passes / two
  overall-test timeouts**, followed by **two passes** on the unchanged artifact,
  assertions, workers and timeouts. All nine owned keyboard checks passed,
  with seven axe rechecks and nine CSP reports showing zero violations.
  The final rebase changed documentation only; runtime/tests/configuration
  were compared to `32b5342`. This is not a clean first-run 40/40 or full CI pass.
* **Helper merged:** PR #23 merged `ff00b3e7` from `258f80349d4b688873155ed7a7189c169eab0bc0`
  onto S main. Its workbench and modified tests match prior tested source,
  but the complete app changed with S. Prior focused run: **26 passed / three
  timeouts**, then **three passed** with unchanged assertions/timeouts. Twelve
  axe outputs had zero violations. All three new Issue20 guards passed first
  run. Exactly three conditional instances are tracked under #34; this is not
  a clean first-run 29/29. Rebase typecheck/lint/configuration checks passed;
  no browser rerun or post-S unit total is invented.
* **T merged:** PR #30 merged `c95ff1da` from `05928f301850d3a878c35567bed0c3acedd6cc39`
  on S+Helper main. Combined check passed and **567 units in 19 files passed**.
  Earlier head `11250cb` had ten selected browser tests: **seven passes / three
  failures**, followed by **three passes** in a narrow corrected rerun. Both
  actual Off/On cycles, navigation and 360/1440 both-mode axe passed in that
  earlier evidence. It is not browser proof for the newly combined artifact;
  integrated Linux acceptance remains pending.
* **Queue merged:** #32 merged `11ea0427` from `180fa6edd414e1e5c0b9646437e4b52828d2885b`.
  Combined check and 577 units in 20 files passed; a later rebase was docs-only.
  All eight Compare tests passed in CI `34635510262` at `6d34988681137663fd8f09b33a3566605b9a629d`,
  with four zero-violation axe outputs in artifact `10278127926`. Full executed
  outcome accounting establishes those passes; overall CI still had 227 other
  failures. Owned source/specs were unchanged at merge. Local startup timeout
  and three-pass/five-timeout attempt remain historical failures.
* **Scene merged:** #31 merged `98c88818` from `e144fd47bb5b388f2e9184f85abb922d5fb07b04`.
  Combined check and 591 units in 21 files passed, including 14 scene units.
  Owned source/specs match accepted `c902c6e`: six new scene browsers passed,
  plus an unchanged calculator compatibility test passed on isolated retry;
  two unrestricted axe reports had zero violations. Earlier build-start
  timeouts, a corrected snapshot expectation and calculator timeout remain
  disclosed. This is not a single uninterrupted seven-test pass or full CI pass.

## Eighteen requested items

Paths are relative to `BSA`. Row IDs, not the number of sub-requirements or
tests, are the denominator for the totals.

| Item | Status and revision/owner | Actual implementation and missing increment | Proving test or explicit pending proof |
| --- | --- | --- | --- |
| **A1 Scene:** three attributed figures, On count-in, one Sources | **Done · main `98c88818`** | Scene-specific count-in now presents five derived estimates without changing the three qualified public cards or one Sources footer. Off/reduced motion are immediate, accessible final values stable, and stale frames cancelled. | **U/P** named public-figure/source guards; **Scene merged** 14 units and six scene browsers cover intermediate/final values, stable accessibility, Off/Reset/navigation, reduced motion and extreme inputs. Two axe reports are zero. Initial V images are historical; final visual replacement remains J. |
| **A2 Month:** seven steps, constant judging, three plain shares, Sankey, shared scene values | **Done · main `8c05b18`** (unchanged source from `d9e06e1`) | `baseline.ts`, baseline calculator/flow and scene share the selector. Seven gathering inputs, three sequential share inputs with denominator hints, four disjoint flow cohorts and fixed `V*j` judging are implemented. Values remain assumptions, not measured savings. | **U/P** `baseline.test.ts`: `conserves default rounded cohorts and separates gathering, judging and machine latency`, `judging remains V*j on both sides...`, `shared scene/calculator selector has no separate values or stale invalid fallback`. **V** `overview-month`/`overview-scene` Off and On show the controls and flow. |
| **A3 Separate six-stage pipeline chapter:** phase-resolving pain | **In progress · R acceptance; T merged `c95ff1da`** | Pipeline is now independently reachable at `/#pipeline`, retaining six stages and bounded phase-resolving markers. Final combined-artifact browser acceptance is pending, not implementation. | **T merged** check/units and earlier focused runtime evidence; `pipeline.spec.ts` phase/no-write acceptance remains R-owned. **V** initial images still show the old combined chapter and require replacement. |
| **A4 Four cases chapter:** Off pain, On result, both actions | **In progress · R acceptance; T merged `c95ff1da`** | A-D cards now have their own `/#cases` chapter with Open case and Follow actions. The previously missing split is implemented on main. | **U/P** six-outcome guards; **T merged** updated contracts and earlier branch browser checks. Final combined route/action proof and V images remain pending. |
| **A5 Two places:** long Off/short On, pharmacy referral experience | **In progress · R acceptance; T merged `c95ff1da`** | Merged diagrams show seven Off/five On steps plus an eight Off/six On referral loop. Reduction is proposed gathering effort, not guaranteed wait reduction; D keeps manual fallback. | **T merged** mode-specific sequence checks passed on the earlier branch, with initial failures/retry retained. Combined-artifact proof and replacement of baseline `overview-two-places` captures remain pending. |
| **A6 Queue chapter and `/queue`** | **In progress · R acceptance; T merged `c95ff1da`** | The queue is now chapter six in the merged eight-chapter structure. Combined navigation/queue acceptance remains pending; Compare is separately tracked in D. | **U/P** queue guards; **T merged** chapter contracts/earlier browser evidence; `queue.spec.ts` native scroll/keyboard/segment/jump checks remain R-owned. V final images pending. |
| **A7 Claims chapter:** whole referred-back/corrected/resubmitted/rechecked/paid cycle | **In progress · R acceptance/#19/#29; T merged `c95ff1da`** | Main now has the five-stage Referral cycle guide and separate actual Recorded claim state, with action links for the same case. An explanatory guide is not history or an automatic transition. R's transactional approval/manual-pain fixes still await integration. | **T merged** includes earlier actual Off/On cycles through guide links and both-mode axe, not merely link-existence tests. Final combined journey and updated V chapter/claims images remain pending. |
| **A8 Where it ends** | **In progress · R acceptance; T merged `c95ff1da`** | `/#close` is now chapter eight, Where it ends, with qualified discovery/assumption content. The missing arrangement is implemented; combined navigation/focus proof remains pending. | **T merged** updated `tour.test.ts` contracts and earlier eight-chapter browser evidence. Initial V `overview-close` images are historical and need refresh. |
| **Rail:** Next/Back across routes, dismiss/restore | **In progress · R acceptance; T/S merged `c95ff1da`/`22ec3459`** | Eight-chapter/nine-stop mapping, cross-page rail and S's focus/motion corrections are now main. Combined-artifact regressions remain pending. | **S merged** affected focus/motion checks; **T merged** earlier forward/back/menu/dismiss/restore proof. Neither is relabelled as final integrated R acceptance. |
| **B Pharmacy:** split pain, timeline, staged check, gap/correction/receipt, A/B/D, shared submission | **In progress · R integrated acceptance; Helper merged `ff00b3e7`** | Neutral intentional-Off/unavailable labels and affected expectations are now main. Existing workbench, gap/correction, timeline, immutable receipt and shared submission remain. | **U** named pharmacy timing/correction/immutable-receipt guards; **Helper merged** retains 26/3 then3 outcomes, twelve zero-violation axe outputs and #34's exact three conditional cases. Final combined regressions and V replacement images pending. |
| **C Claims:** selector, seven states, one list action, plain history/state panel, Off blind-resubmit pain, On approved exact fix | **In progress · R #19 + #29** | Selector/list/detail and immutable actions exist. Main leaks raw unapproved On reasons and lacks the explicit blind-resubmission pain comparison. R reports #19 persisted at `2eb49b4` and #29 at `d558cc1` in `claims-resubmission-comparison.tsx`, resolving only for current Ready plus approved instruction. Neither correction has final runtime proof yet. | **U** `lifecycle-store.test.ts`: `operator API approval is explicit...`, `manual NONE ACCEPT is reasoned human judgement, not an override`. **V** all seven expanded states and round trip are baseline evidence. R's new response tests and four #29 keyboard/axe tests are prepared, not passed. |
| **D Queue:** virtual month, following counter Off, sweep counters On, 17:00 summary, Compare, local toggle | **In progress · R integrated acceptance; Queue merged `11ea0427`** | Compare now opens the inline same-scenario/day read-only region, with heading focus/Close/Escape and no state writes. Existing local toggle, virtualisation, logical counter, sweep controls and 17:00 summary remain unchanged. The missing increment is fixed; wider integrated queue regression remains pending. | **Queue merged** eight accepted Compare browsers/four axe outputs; **U/P** queue bounds, day clock and no-write guards. R's existing shared-day/sweep/browser suite still needs final integrated acceptance. |
| **E Trace/pack/record:** Off absent assisted slots/Today, On assembly/replay/full July record | **In progress · R #14; S wrapping merged `22ec3459`** | Manual trace/pack and missing assisted fields are implemented; On assembles/replays and the original B record replays July. Off says `Not recorded in this synthetic manual comparison; this does not describe real NHSBSA records`, not a false absolute assertion that real records do not exist today. S's narrow-link wrapping is merged; full integrated acceptance remains pending. | **S accepted slice** covers phone reflow. **U** `case-presentation.test.ts`; **V** all six packs/traces/records and July replay. `case-presentation.spec.ts` phase/no-record/assembly checks remain **R pending**. |
| **F Lifecycle:** seven states/both labels, transition actors, five pharmacies/six cases/Reset | **Done · main `8c05b18`** (unchanged source from `d9e06e1`) | Seeded lifecycle, labels, immutable revisions and Reset are implemented. Only pharmacy/code/operator actions change lifecycle. Same-state agent trace events may exist; they are not agent transitions or payment authority. All five pharmacies and six canonical outcomes remain. | **U** `lifecycle-store.test.ts`: `all seven lifecycle states at $name`, `retains all canonical mappings, original fixtures and historical F record`, `rejects unknown, stale and reasonless decisions, and agent transitions`, and Reset/follow guard. **P** revision/bridge and six-outcome guards; **V** seven-state history captures. |
| **G Round trip:** two-minute Off then On, Follow everywhere/Switch side, one UI test asserting both sides each step | **In progress · R #14 / PR #33** | Shared same-ID actions and global Follow banner work in the existing rehearsal. Two minutes is a story target, not a performance budget. R is preserving functional/hang-timeout checks while recording elapsed time informationally; integrated both-side acceptance remains pending. | **V** mixed-mode rehearsal and 16 checkpoints, not a timing benchmark. R's `lifecycle-ui.spec.ts` same-case journey and `task13.spec.ts` both-side assertions require its tested result. The obsolete strict 120-second wall-clock assertion is not an acceptance blocker. |
| **H Global:** one row 360-1920, menus/toggle/no presenter, Reset Off, concise/source-safe copy, synthetic/motion/pain/WCAG | **In progress · R/T integration; S merged `22ec3459`** | S's strict-CSP, reflow, AppShell focus and Reset computed-motion fixes are merged with scoped evidence. New chapter integration and remaining R regressions still prevent a full-row acceptance claim. No complete screen-reader/WCAG conformance is inferred. | **U** no presenter/Reset Off guards; **V** 1440px only. **S accepted slice** plus **S merged** covers zero-violation matrix and affected keyboard/control/header checks; retain the two first-run timeouts. R/T integrated acceptance pending. |
| **I Hosting/gates:** SWA root/fallback/headers/previews, no budgets, functional+axe gates | **In progress · Coordinator/R integrated gate; S merged `22ec3459`** | Root config/workflow, no-budget policy and S's real-header browser infrastructure are merged. Whole integrated functional CI still needs R/behaviour acceptance. Actual provisioning/host URL remain user-owned and unverified, not a local blocker. | **U** hosting contracts and initial check; **S accepted slice/S merged** prove header-enforced local/CI operation, not deployed Azure parity. Overall CI was not green. Free tier permits three concurrent previews, not unlimited previews; see DEPLOYMENT.md. |
| **J Documentation:** progress/memory/learnings/decisions/story/screens/known issues | **In progress · V PR #24 + D #17** | V committed current-source story/spec, 103 initial images, numerical reconciliation and this latest-scope register. Those images show the old seven-chapter arrangement; they are not the final eight-chapter evidence. D remains intentionally paused for final memory/progress/task acceptance. | V hashes/dimensions/links verified; #25 has 33 claim families reviewed, four corrected, 29 retained, zero deferred narration fixes. Final screenshots/docs must follow all tested behaviour merges, including T/Scene/Queue/R claims changes; D then records exact integrated tests and hosting limits. |

## Owner register

These are work branches, not claims that their current unmerged contents passed.

| Owner | Exact branch / PR | Current responsibility |
| --- | --- | --- |
| T | `williamng18-eight-chapter-tour-and-referral-cycle`, PR #30 merged `c95ff1da` | Implementation merged; combined check/567 units pass, earlier focused browsers retained separately; R owns integrated acceptance |
| Scene | `williamng18-scene-estimate-count-in`, PR #31 merged `98c88818` | Scoped count-in implementation accepted; broader integration remains coordinated |
| Queue | `williamng18-queue-comparison-control`, PR #32 merged `11ea0427` | Scoped Compare implementation accepted; broader queue regressions remain R-owned |
| R | `williamng18-production-round-trip`, PR #33 / #14/#19/#29 | Full browser regressions, approved-only pharmacy reasons and claims manual-pain comparison |
| S | `williamng18-accessibility-strict-csp`, PR #22 merged `22ec3459` | Scoped implementation accepted; later eight-chapter integration remains coordinated work |
| Helper | `williamng18-parity-verification-and-owned-applicatio`, PR #23 merged `ff00b3e7` | Healthy workbench status merged; #34 tracks three exact conditional timeout instances |
| V | `williamng18-visual-reconciliation-and-demo-docs`, PR #24 | Owned narrative, SCOPE and final visual refresh; no application/test changes |
| D | `williamng18-issue-17-stream-d-final-memory-task-acceptance-an-b76afa`, #17, no PR | Intentionally paused until integrated behaviour and V evidence are ready |

## Completion boundary

No size/performance budget or unprovisioned hosting account delays these
implementation streams. Only functional and accessibility gates block; word
counts, Lighthouse and visual differences are informational. The agent gathers
evidence and recommends, code validates/calculates, and a human decides. No
payment is calculated or approved. Preserve all six outcomes, including D
abstention, E no model call and B's July Sufficient replay.

V must receive the coordinator's tested-merge release, rebase, then derive the
final capture inventory from the new structure. Do not blindly reuse the old
103-image count: a separate pipeline chapter and queue Compare surface add
destinations/states. Keep original source and capture revisions explicit.
This register updates ownership and actual acceptance; it does not tick
Tasks 8-13, merge a PR or manufacture a passing result from source presence.
