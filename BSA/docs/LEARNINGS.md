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

## 2026-09-10: Stream E authoring before B/A/C/D exist

Only the contracts commit and stream-e-verify existed locally; B/A/C/D branches
were never fetched and their store/UI work is not present. Writing Task 10/13
round-trip tests against real pharmacy/queue/claims UI and a live store would
either fail or, worse, silently pass against nothing. Split the new files:
frozen-contract assertions (empty lifecycles, null followedCaseId, the six
methods throwing, the seven states and labels) run immediately as real
regression coverage; the pure round trip and the whole Playwright file are
tagged pending-integration and skipped until B's store and A/C/D's UI merge.
Never assume a skipped scenario proves the feature works.