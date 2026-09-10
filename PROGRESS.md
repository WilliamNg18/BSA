---
title: Seven-task implementation progress
description: Task-scoped local validation and deployment gates for the current seven-task brief.
ms.date: 2026-09-10
---

## Checklist

* [x] Task 1: synthetic baseline model, calculator and shared scene estimates
* [x] Task 2: local copy, attribution, default-Off and shared motion checks
* [ ] Task 3
* [ ] Task 4
* [ ] Task 5
* [ ] Task 6
* [ ] Task 7

## Commit references

Task 1 commit: ad7d5d8. The user reports gated CI run 34515828351 and
27 hosted checks passed. Those remote results were not rerun in this session.

Task 2 is implemented on the dirty main working tree. Commit pending;
the main agent handles commit, CI and deployment. Tasks 3-7 remain unchecked.

## Task 1 gates

Local validation completed: final check exit 0; 383 unit tests in nine files
passed; all 371 production Chromium tests passed in 4.5 minutes, exit 0.
The 48 axe audits report zero violations. The existing Vite large-chunk
warning remains, so this is not a zero-warning performance claim.
Screenshots, audit JSON and verification excerpts are retained in
[the Task 1 evidence](.copilot-tracking/tasks/1/verification.json).
See [the model](BSA/docs/task-1-baseline-model.md) for formulas and assumptions.

The user approved existing Azure hosting instead of private GitHub Pages after
the Pages HTTP 422 restriction. Local production tests retain the `/BSA/`
compatibility base; they do not verify Azure deployment. Task 1 remote gates
above are the user's supplied handoff, not fresh remote verification.

## Task 2 local gates

All local gates passed on 2026-09-10: check exit 0, 383 unit tests across nine
files, and all 376 production Chromium tests in 4.7 minutes, exit 0, without
skips or retries. The 48 unique axe audits have zero violations. The final
run retained 298 screenshots; desktop light On and phone dark Off were reviewed.

The client search scanned 103 files with zero forbidden matches. Rendered
copy checks covered 31 routes in each flag state, expanded disclosures and
921 narrative panels total. Numeric words count; positive controls reject
long paragraphs, split prose, label/badge/link evasions and unmarked prose.
Structured values, headings and control labels are not summed as narrative.
This is not a claim that every possible interactive state was exhaustively
word-counted or that the whole page contains only 25 words.

Default and Reset are Off. Opt-in is explicit. The shared presentation
transition lasts two seconds; reduced motion is immediate, including live
preference changes. Pain markers retain keyboard text and abstention.
The existing trace replay is retained, not the Task 3 pipeline.

Domain comparison against ad7d5d8 passed 72 case/month/flag/fault variants.
Gate checks, outcomes, evidence, conflicts, signals, tools, timing and fixture
data are preserved. Reviewed differences are concise prose, synthetic tariff
paraphrases and the consistent evidence-field rename from source to origin.
No evidence fields were dropped. Research was moved unchanged, after newline
normalisation, to [the offline audit](BSA/data/reference/source-audit.ts).
Original supplied documents remain untracked; the client imports no audit.
Nine emitted assets and three served text assets (908,324 bytes) contain zero
private matches. One chapter-one Sources footer replaces documentary UI.

See [verification](.copilot-tracking/tasks/2/verification.json),
[check log](.copilot-tracking/tasks/2/verified-check.log),
[unit log](.copilot-tracking/tasks/2/verified-unit.log) and
[full browser log](.copilot-tracking/tasks/2/verified-playwright.log).
Earlier failures remain retained: initial 367 passed/9 failed; later
375 passed/1 failed due to a disclosure navigation race, then fixed.

The existing Vite large-chunk warning remains (783.59 kB JS, 240.75 kB gzip).
No zero-warning, performance, full WCAG, Firefox/WebKit, manual screen-reader,
Task 2 hosted or CI success is claimed. No Git writes, account or deployment
actions occurred. The Task 2 tick means local checks only.