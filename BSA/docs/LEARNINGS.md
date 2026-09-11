---
title: Implementation learnings
description: Append-only dated findings, repairs and verification evidence.
ms.date: 2026-09-10
---

## 2026-09-10: Stable Zustand selectors

A selector returning a fresh filtered array caused React error 185 in production
case views. Selecting the stable store slice and deriving with useMemo, or using
useShallow, stopped the render loop. Production Playwright route coverage guards
the repair; the Task 3 handoff confirms 386 browser tests. Never assume a
development render proves production store stability.

## 2026-09-10: Verification evidence

Earlier delegated command summaries disagreed with raw logs, and HTML reports
hit OneDrive locks. Use the dot reporter, read actual completion output and exit
codes, and never interrupt a running browser suite with another terminal command.
A started or background run is pending, not a pass. Keep prior failures as history.

## 2026-09-10: Task 5 bounded scrolling and modal focus

One billion logical positions cannot safely share a native billion-row spacer.
Task 5 limits each physical segment to 112,000 pixels and each mounted slice to
ten rows, with explicit jumps between segments and to the logical end.

A controlled dialog without a DialogTrigger needs explicit focus restoration.
Autofocusing its first pain marker also opens a tooltip, which can consume the
first Escape. Focus the dialog heading initially and restore the captured opener
on close. Keyboard assertions remain in the browser suite.

The delegated focused-run summary reported exit 0 while the retained Playwright
last-run record contained four failures. Direct full output established 430
passes and two remaining failures after initial corrections. Raw artifacts and
actual exit codes, not delegated success prose, govern the final gate.

## 2026-09-11: Mobile sheet Presence exit race

The subsequent 435-test run had 434 passes and one 960px dark header failure.
Its trace showed closed sheet content remaining mounted beyond five seconds;
three isolated repeats passed, so isolation alone did not establish a repair.

The installed Radix Presence implementation waits for an animation end/cancel
when animation names change on close. Computed animation-name none takes its
immediate unmount path instead. Zero duration alone still names an animation.
The overlay has separate Presence and scroll locking, so it needs the same
navigation-only closing policy. Radix remains responsible for focus restoration.

Under the explicit narrow Stream D ownership exception, the regression changes
reduced motion live on the mounted sheet, verifies normal opening motion, pauses
content and overlay animations, then closes through Escape, Close and navigation.
Raw selectors require both layers to be absent, scroll/pointer locks cleared,
Escape/Close focus restored and external keyboard controls usable. The existing
navigatePrimary zero-dialog assertion is unchanged. Six repeats of this test and
the original 960px dark header test passed: 12 tests, exit 0. Check passed and
475 units in eleven files passed; the existing large-chunk warning remains.
Full-suite completion is recorded separately in progress after its actual exit.

## 2026-09-11: Task 6 structure and presentation timing

The first Task 6 full run completed with 454 passes and nine failures. A pain
button beside dt/dd invalidated the definition-list group; it belongs inside
dd. A focusable outer trace region did not make the vendored table's separate
inner scroll area keyboard accessible. Scope overflow to the outer region on
this page without editing the shared table primitive.

Chaining the next timer from each React effect introduced render delay. Schedule
all remaining milestones against one start time so the final decision pane
appears at two seconds. Cancel every pending milestone on Pause, Off, identity
change, route unmount or live reduced motion. Keep the exact timing assertion.

The existing generic-label audit clicked Show all for Off trace and expected
assisted metadata in Off historical records. Replace those obsolete assertions
with seven manual steps, zero agent trace and disabled replay, retaining the
vendor scan and the historical-rule preservation assertion. Earlier failures
remain evidence, not a passing gate; final results belong in progress.

The corrective 465-test run exposed a live matchMedia notification race: virtual
time advanced before React received the preference update. Each callback now
checks current media state; the regression also awaits disabled Play before
advancing virtual time. The unchanged pipeline tooltip test failed once in that
run and passed in the final full suite. No assertion or pipeline code changed.
Final check and all 465 browsers passed; 488 units passed. Unique artifact
counting excludes attachments: 84 axe audits, zero violations, twelve Task 6
audits, 84 copy states without failures and twelve selected screenshots.

## 2026-09-11: Task 7 performance experiments and exact accounting

The current-build profile revealed five emitted font subsets, not one. Counting
all emitted payload gives 352,235 gzip bytes; this is deliberately more than
the initial scene necessarily downloads. After optimisation, no fonts or late
route chunks remain. The complete /BSA/ payload is 199,771 bytes, only 229 below
the strict decimal target. Root-base output differs slightly because URLs differ.

Provider removal, synchronous LazyMotion and system fonts alone were insufficient.
The remaining simple opacity/entrance effects fit native CSS; MotionConfig and
the two-second presentation clocks need not change. Static import-graph CSS
scanning avoids unused templates without omitting conditional runtime branches.
Replacing the two-message toast engine supplies the final material saving.

An apparently suitable CSS minifier made the build larger: 201,081 bytes. The
new hard gate correctly failed; that experiment and its direct dependency were
reverted. Keep measured comparisons rather than assuming a minifier is smaller.
The final safe Terser configuration does not use unsafe transformations or blanket
side-effect declarations. Gzip each asset separately; combining buffers would
artificially improve compression compared with independent HTTP resources.

The initial keyboard replay regression pressed Home then ArrowDown. Native
select skips the disabled placeholder, so Home already selects July and the
extra arrow selects August. Use Home and Enter, retaining exact selected-value
and replay-outcome assertions. Eight other targeted tests passed, including
three exact fault injections and four cache-disabled immediate-offline variants.
Final full-suite evidence is recorded in progress only after actual completion.

## 2026-09-11: Expanded matrix finds actual scroll and colour defects

The original 718-test run finished with 687 passes and 31 failures. Thirty
matrix tests failed axe; deduplicated artifacts contain 334 audits and 34 rule
violations. A test can fail more than one rule, so those counts are different.
Only 218 of 248 matrix photographs were produced because capture follows axe.
Preserve the failed run and its images separately before corrected verification.

A focusable ancestor does not make an inner overflow box keyboard-scrollable.
All seven table usages already have labelled outer scroll regions; remove the
inner box instead of adding redundant tab stops. Test actual ArrowRight movement,
not just tabindex. White on amber-600 measured 3.19:1; muted grey on the light
rose alert measured 4.31:1. Local colour corrections avoid global theme changes.

The preserved notification tests also exposed three TypeScript callback errors:
role locators can resolve HTMLElement or SVGElement. Explicit button callback
types retain programmatic click semantics and all focus assertions. The first
corrected check stopped before build; no passing unit or payload result followed
that failed check. See progress for subsequent verified results.

Keyboard scrolling also revealed that removing a positioned table wrapper can
let an absolutely positioned screen-reader header escape the scrollport. Keep
position: relative on the queue's actual scroll region. Both theme regressions
now verify scrolling and the unchanged one-pixel page-overflow maximum.

Exact replay assertions must use the existing complete recommendation labels,
not abbreviated names. Exact gate-notice assertions must follow reviewed concise
copy without dropping the FAIL, withholding or no-recommendation checks. Preserve
failed runs: 52/55 targeted, then 718/721 full; follow-up 4/4 and 3/3 passed.
Final check and 494 units passed, then all 721 browsers passed in 12.1 minutes.
All 334 unique axe audits have zero violations and all 248 matrix images exist.
Accepted /BSA/ payload is 199,636 gzip bytes with 364 bytes headroom. No global
token changes, test exemptions, relaxed thresholds or late loading were needed.