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
## 2026-09-10: Frozen lifecycle records

Freezing each lifecycle record, its history array and every event turns a stray
caller mutation into a thrown error that a unit test can assert, instead of a
silent shared-state change. Copying a precheck snapshot at submission proved
necessary: a caller that edited its own snapshot afterwards would otherwise have
rewritten an appended event. Seeded and live events share one builder, so the
synthetic month and session actions cannot drift apart.

## 2026-09-10: Offline dependency install

The committed lock file resolves packages from an internal feed that this
environment cannot reach, so `npm ci` fails on name resolution. Installing with
`npm install --no-package-lock` from the public registry restored the toolchain
and left the lock file untouched. Check, 400 units and lint then ran locally.
