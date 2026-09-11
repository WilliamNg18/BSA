---
title: Requested scope and implementation ownership
description: Eighteen-row implementation register for the latest eight-chapter demonstration request.
ms.date: 2026-09-11
---

# Scope register

**Snapshot:** main `8c05b184f6c68ca1420fece3bfa8f46b15112f6c`, 11 September
2026. Its application source is unchanged from `d9e06e1`; subsequent branch
work below is not represented as merged. This latest request has **eight
chapters**, not the currently implemented seven chapters/eight stops.

**Totals: 2 Done, 16 In progress, 0 Not started, 18 rows.** Every incomplete
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
* **V:** [Initial capture manifest](screens/integrated/manifest.json):
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
  not a full pass. R owns remaining regression failures. S stopped its
  duplicate local run and is implementing the later AppShell focus and Reset
  computed-motion corrections; those affected checks remain pending.

## Eighteen requested items

Paths are relative to `BSA`. Row IDs, not the number of sub-requirements or
tests, are the denominator for the totals.

| Item | Status and revision/owner | Actual implementation and missing increment | Proving test or explicit pending proof |
| --- | --- | --- | --- |
| **A1 Scene:** three attributed figures, On count-in, one Sources | **In progress · Scene #27**; foundation on main `8c05b18` | Three qualified cards and one footer exist. `AnimatedNumber` only crossfades the final formatted value; numerical count-in is absent. New scene-only implementation is active, without changing public figures or calculator arithmetic. | **U/P** `baseline.test.ts`: `pins exactly three public context figures...`; `tour.test.ts`: `retains the single exact sourcing statement`. **V** `overview-scene` both states. Count-in/intermediate/final/Off/reduced-motion proof must be supplied by #27; none claimed yet. |
| **A2 Month:** seven steps, constant judging, three plain shares, Sankey, shared scene values | **Done · main `8c05b18`** (unchanged source from `d9e06e1`) | `baseline.ts`, baseline calculator/flow and scene share the selector. Seven gathering inputs, three sequential share inputs with denominator hints, four disjoint flow cohorts and fixed `V*j` judging are implemented. Values remain assumptions, not measured savings. | **U/P** `baseline.test.ts`: `conserves default rounded cohorts and separates gathering, judging and machine latency`, `judging remains V*j on both sides...`, `shared scene/calculator selector has no separate values or stale invalid fallback`. **V** `overview-month`/`overview-scene` Off and On show the controls and flow. |
| **A3 Separate six-stage pipeline chapter:** phase-resolving pain | **In progress · T #26**; current pipeline on main | Six stages and bounded phase-resolving markers exist, but the current `/#cases` chapter also contains the Four cases cards. T is separating pipeline to `/#pipeline`; source presence is not proof of the requested separate chapter. | **V** `overview-pipeline` shows current combined content. `pipeline.spec.ts`: `shared two-second clock sequences kernel phases, resolves built pain only, and cancels safely` is **R pending**. T must prove independent chapter reachability and preserved phase behaviour. |
| **A4 Four cases chapter:** Off pain, On result, both actions | **In progress · T #26** | A-D cards, Open case and Follow actions exist inside the pipeline chapter. A separately reachable Four cases chapter is missing on main and is active T implementation. | **U/P** `agent.test.ts` pins canonical outcomes; **V** current combined A-D view. `tour.spec.ts`: `documentary scene figures are invariant; A–D match runAgent and off is neutral manual work` is **R pending** and does not establish the new split. T's new exact-order/action proof pending. |
| **A5 Two places:** long Off/short On, pharmacy referral experience | **In progress · T #26** | Current diagrams have four steps Off and five On on each side, the opposite length contrast. The three round-trip links do not themselves depict the pharmacy referral experience. T owns both gaps. | **V** `overview-two-places` both states; `tour-diagrams.tsx` provides the exact step-count evidence. Existing tour tests cover diagrams/links, not the newly requested long/short referral experience. New T content/interaction proof pending. |
| **A6 Queue chapter and `/queue`** | **In progress · T #26 + R #14** | The queue and cross-page chapter exist. Its ordinal changes from five to six in the eight-chapter structure; final navigation and queue acceptance remain pending. The separate Compare gap is row D. | **U/P** queue-model guards; **V** `queue` Off/On. `queue.spec.ts`: `Task5 native scroll, keyboard, segment and direct jumps follow logical position` is **R pending**. T must prove chapter-six Next/Back routing. |
| **A7 Claims chapter:** whole referred-back/corrected/resubmitted/rechecked/paid cycle | **In progress · T #26 + R #19/#29** | The claims route, detail and real human-controlled lifecycle exist. Main has a short chapter introduction and links, not an explicit whole-cycle chapter experience. T owns that content; R owns transactional approval and manual-pain corrections. Synthetic paid must remain attributed to existing pricing. | **V** eight round-trip checkpoints per mode plus mixed-mode rehearsal prove existing actions, not the missing chapter content. `task13.spec.ts`: `Task13 complete same-case roundtrip Agent On/Off` is **R pending**. T's full-cycle chapter proof pending. |
| **A8 Where it ends** | **In progress · T #26** | Current `/#close` is chapter seven, `Decide on evidence`, with discovery/assumptions. The requested chapter-eight closing arrangement is not yet implemented. Keep human authority and uncertainty, not just a title rename treated as completion. | **V** `overview-close` both states. **U/P** `tour.test.ts` currently pins seven chapters, which is evidence of the mismatch, not proof of eight. T's chapter-eight content/order proof pending. |
| **Rail:** Next/Back across routes, dismiss/restore | **In progress · T #26 + S #15 / PR #22** | Existing rail crosses pharmacy/queue/claims and supports dismiss/restore. Eight-chapter mapping is T-owned; S owns the separately identified AppShell dismiss/restore focus and Reset computed reduced-motion gaps. | **U/P** guarded Alt shortcut tests; `tour.spec.ts`: `@tour-focus tour forwards and backwards...` and `dismissal is session-only; principle remains; restore resumes; reload restores defaults` are **R pending**. New focus/motion acceptance remains S-owned. |
| **B Pharmacy:** split pain, timeline, staged check, gap/correction/receipt, A/B/D, shared submission | **In progress · Helper #20 / PR #23 + R #14** | Workbench, seven-step/manual context, receipt/timeline and shared submission exist. Neutral intentional-Off/unavailable labels and affected assistance expectations are prepared. Helper is now running its granted one-worker browser slot, not idle. | **U** `pharmacy.test.ts`: `finishes only at two seconds...`, `collapses B only after correction...`, `stores detached frozen receipts alongside exactly one authoritative submission revision`. **V** A/B/D both states. Prior PR #23 candidate `f95ae88` reports check + 553 units; current `5ec240a` has 29 focused browsers running, not yet passed. |
| **C Claims:** selector, seven states, one list action, plain history/state panel, Off blind-resubmit pain, On approved exact fix | **In progress · R #19 + #29** | Selector/list/detail and immutable actions exist. Main leaks raw unapproved On reasons and lacks the explicit blind-resubmission pain comparison. R reports #19 persisted at `2eb49b4` and #29 source prepared in `claims-resubmission-comparison.tsx`, resolving only for current Ready plus approved instruction. Neither correction has final runtime proof yet. | **U** `lifecycle-store.test.ts`: `operator API approval is explicit...`, `manual NONE ACCEPT is reasoned human judgement, not an override`. **V** all seven expanded states and round trip are baseline evidence. R's new response tests and four #29 keyboard/axe tests are prepared, not passed. |
| **D Queue:** virtual month, following counter Off, sweep counters On, 17:00 summary, Compare, local toggle | **In progress · Queue #28 + R #14** | Virtualisation/counter, local `Queue assistance` switch, sweep/step/cancel and `Jump to 17:00` summaries exist. An operable Compare control is absent even though day columns are shown. #28 owns only that missing read-only control, not a duplicate toggle or new arithmetic. | **U/P** `queue.test.ts`: `billion-item classifications are repeatable and call no engine`, `clock boundaries and all seeds stay consistent in both comparisons`, `never writes actual cases, records, lifecycle, receipts or events`. `queue.spec.ts` shared-day and visible-sweep tests are **R pending**. New Compare keyboard/no-write/axe proof pending #28. |
| **E Trace/pack/record:** Off absent assisted slots/Today, On assembly/replay/full July record | **In progress · R #14 + S #15 / PR #22** | Manual trace/pack and missing assisted fields are implemented; On assembles/replays and the original B record replays July. Off says `Not recorded in this synthetic manual comparison; this does not describe real NHSBSA records`, not a false absolute assertion that real records do not exist today. Full acceptance and narrow pack wrapping remain pending; no new missing-feature issue is inferred from wording alone. | **U** `case-presentation.test.ts`; **V** all six packs/traces/records in both modes and `roundtrip-july-sufficient`. `case-presentation.spec.ts`: `Task6 trace slots follow phases; Clear, Step and Show all never create a record`, `Task6 full pack assembles in two seconds...` are **R pending**. |
| **F Lifecycle:** seven states/both labels, transition actors, five pharmacies/six cases/Reset | **Done · main `8c05b18`** (unchanged source from `d9e06e1`) | Seeded lifecycle, labels, immutable revisions and Reset are implemented. Only pharmacy/code/operator actions change lifecycle. Same-state agent trace events may exist; they are not agent transitions or payment authority. All five pharmacies and six canonical outcomes remain. | **U** `lifecycle-store.test.ts`: `all seven lifecycle states at $name`, `retains all canonical mappings, original fixtures and historical F record`, `rejects unknown, stale and reasonless decisions, and agent transitions`, and Reset/follow guard. **P** revision/bridge and six-outcome guards; **V** seven-state history captures. |
| **G Round trip:** two-minute Off then On, Follow everywhere/Switch side, one UI test asserting both sides each step | **In progress · R #14** | Shared same-ID actions and global Follow banner work in the existing public-control rehearsal. Full timed Off-then-On browser proof and explicit both-side assertions at each transition still require R's tested result; the existence of routes is insufficient. | **V** mixed Off/On/Off rehearsal and 16 checkpoints, not a full timing benchmark. `lifecycle-ui.spec.ts`: `Task9/10 complete Off referral to approved On correction and human sufficient uses one shared case` includes the 120-second assertion; its strengthened run and `task13.spec.ts` both-side coverage are **R pending**. |
| **H Global:** one row 360-1920, menus/toggle/no presenter, Reset Off, concise/source-safe copy, synthetic/motion/pain/WCAG | **In progress · S #15 / PR #22 + R #14** | Core shell/default-Off exists. Strict-CSP and narrow-link fixes have passing S slice evidence, but later AppShell focus and Reset computed-motion corrections remain active. No claim of complete screen-reader/WCAG conformance from automated results. | **U** `store.test.ts`: no presenter/discussion state and Reset Off. **V** 1440px modes/overlays only. **S accepted slice:** `1a103e3`, 183 CSP/247 axe reports, zero violations; later affected focus/motion checks pending. R seven-width header regressions remain pending. |
| **I Hosting/gates:** SWA root/fallback/headers/previews, no budgets, functional+axe gates | **In progress · Coordinator main `b23e478` + S PR #22** | Root build/config/workflow and informational-only size reporting exist. S's header-enforced slice passes, but its branch and follow-up corrections are not integrated. Provisioning/actual hosted URL remain unverified/user-owned; absent token is not a local stream blocker. | **U** `hosting.test.ts` build/config contracts; initial check passed and emitted root config. Main policy change reports check + 553 units. **S accepted slice** proves tested local/CI headers, not deployed Azure behaviour. Free tier permits three concurrent previews, not unlimited previews; see DEPLOYMENT.md. |
| **J Documentation:** progress/memory/learnings/decisions/story/screens/known issues | **In progress · V PR #24 + D #17** | V committed current-source story/spec, 103 initial images, numerical reconciliation and this latest-scope register. Those images show the old seven-chapter arrangement; they are not the final eight-chapter evidence. D remains intentionally paused for final memory/progress/task acceptance. | V hashes/dimensions/links verified; #25 has 33 claim families reviewed, four corrected, 29 retained, zero deferred narration fixes. Final screenshots/docs must follow all tested behaviour merges, including T/Scene/Queue/R claims changes; D then records exact integrated tests and hosting limits. |

## Owner register

These are work branches, not claims that their current unmerged contents passed.

| Owner | Exact branch / PR | Current responsibility |
| --- | --- | --- |
| T | `williamng18-eight-chapter-tour-and-referral-cycle`, #26, no PR yet | Eight chapters, pipeline/Four cases split, two-places contrast, whole-cycle claims chapter |
| Scene | `williamng18-scene-estimate-count-in`, #27, no PR yet | Active implementation confirmed; code/units before a browser slot |
| Queue | `williamng18-queue-comparison-control`, #28, no PR yet | Active inline read-only Compare implementation; preserve local toggle/day controls |
| R | `williamng18-production-round-trip`, #14/#19/#29, no PR yet | Full browser regressions, approved-only pharmacy reasons and claims manual-pain comparison |
| S | `williamng18-accessibility-strict-csp`, PR #22 | Strict CSP, narrow pack link, full accessibility, AppShell focus and Reset motion |
| Helper | `williamng18-parity-verification-and-owned-applicatio`, PR #23 / #20 | Healthy Off/unavailable workbench labels and affected assistance expectations |
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
