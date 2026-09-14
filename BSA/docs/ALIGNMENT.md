---
title: Vision alignment register
description: Current main and in-flight branch drift, correction ownership and evidence.
ms.date: 2026-09-14
---

# Vision alignment

The latest owner brief aligns Tasks 25-37 around four playable synthetic cases.
This register distinguishes inspected source, implementation commitments and
actual live acceptance. No pending correction is marked aligned merely because
an owner has received it.

Baseline main: `5e8fb35d5a849cfaaefa4bc45ba95a042a50e945`.
Its deployment succeeded, public identity matched and strict CSP was unchanged.
Its CI failed two navigation checks. The isolated source repair has two passing
targeted browsers; it is not yet merged or proof of the whole application.

| Item | Aligned or drifted | What changed or remains | Stream | Commit |
| --- | --- | --- | --- | --- |
| Vision and decision authority | Aligned | Owner's Vision and standing authority recorded; routine choices do not wait for owner approval | Coordinator | Authority `09278ce`; Vision in this revision |
| One toggle and one operational state | Drifted | Main has one operational store; F initially added a presentation Zustand store, now removed in favour of G's existing-store field; final integrated equality still required | G, F, V | Main `5e8fb35`; G `22e1b47`; F correction in flight |
| Four playable cases | Drifted | Replace earlier ten-item proposal with complete EPS, missing-date EPS, wrong-information EPS and unreadable paper; C/F background, E represented within complete EPS Today; remove other playable seeds and links | G, O, P, V | Earlier G foundation `22e1b47` still has ten seeds |
| Eleven focused Today/With steps | Drifted | D's unmounted core exists; replace readable-paper scenario with unreadable-paper submission, followed by its separate Type 1 hand-off; mount real compact panels after their owners land | D | Draft #88, `4b37254` |
| Automatic versus human release | Drifted | Real source-bound gates and human release provenance implemented in early G; Off human release keeps proposed gates none; current main still scaffolding | G, O, P | `22e1b47`, not accepted |
| Wrong information never auto-released | Drifted | Keep Gate 1 format success separate from Gate 2 independent mismatch; verify actual UI submission and attempted release in both perspectives | G, O, P, V | Early G has 16 new targeted unit passes; latest four-case integration pending |
| Pharmacy Paid and NHSBSA completed | Drifted | Group actual releases into normal-schedule Paid/completed presentation with explicit existing-pricing wording; never invent payment calculations, authority or a successful failed-gate transition | G, O, P, F | Correction assigned against `5e8fb35` |
| Operator panel acts | Drifted | Shared Apply and final controls authored; actual G eligibility used, human draft retained across toggles, Apply does not approve; full current case/field flow still being verified | O, G | O `50d0646` with G `22e1b47`; targeted checks in flight |
| Pharmacy panel acts | Drifted | Shared revision-bound correction/confirmation, source-aware submission and immutable receipts authored; newest four-case selection and full resubmission cycle pending | P, G | P in flight against G `22e1b47` |
| Follow same item across sides | Drifted | Explicit buttons, temporary Both restoration and historical human labels authored; initial four desktop variants and eight axe audits passed, before final single-store seam | F, G, V | F `cded3c1`, `d018b2a`; early G cherry-pick `e11aaa0` |
| Numbers and assumptions | Drifted | Preserve Task 28 defaults and shared arithmetic; recheck two tiles/sentence, editable tagged assumptions and matching queue/pharmacy figures under newest layouts | D, O, P, V | Main Task 28 implementation; new presentation pending |
| Desktop-only scope | Aligned | Active mobile/tablet layouts/tests/screens removed; verify 1280/1440, new captures 1440 only; historical bytes remain in Git | Step 0, V | `5e8fb35` |
| Header controls remain reachable | Drifted | Remove only redundant Agent focus tooltip which blocked Next; preserve accessible description and shared tooltip behaviour; fixed regression now registers at suite scope | D, V | `91da78c` + `ca2f126`; two targeted browsers pass, unmerged |
| Prose and neutral words | Drifted | Under 25 words per ordinary panel; How it works alone under 60; one mapping-table vendor exception, with explicit source scan and forbidden-copy checks | D, O, P, F, S, V | New enforcement pending |
| How it works and system design | Drifted | New page, contents rail, complete design document, rendered diagrams, capability mapping, honest scale/cost assumptions and 12-15 questions | S | New stream started from main `5e8fb35` |
| Final current live acceptance | Drifted | Latest main must pass eleven steps in both modes, four full case cycles, perspective/Follow hand-offs, real human actions, mismatch rejection, headers and axe; fresh URL within ten minutes | V, Coordinator | Not yet executed for Tasks 31-37 |

## Evidence boundaries

Tasks 25-30's original failed review and interrupted repaired review remain
historical, never relabelled passed. Their runtime is the starting point for the
current four-case desktop acceptance. Non-blocking historical checks retain
their actual results; check, Vitest, crash/dead-control/canonical-outcome
Playwright and axe remain blocking, alongside the explicitly requested final
live checklist. No manual WCAG certification is inferred from zero axe findings.

All drifted rows have a current stream owner. No larger follow-up or human-only
blocker has been identified at this checkpoint.
