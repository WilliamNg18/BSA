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