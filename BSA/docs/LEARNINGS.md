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
## 2026-09-10: Task 9 test locators

`CardTitle`/`CardDescription` render as plain `div`s, not headings, so
Playwright specs for claims detail must match by text, not `getByRole("heading")`.
Ambiguous text matches (a badge and its history-event wording sharing a
substring) need a more specific string, not a parent-scoped locator, to avoid
strict-mode violations across sibling elements.
