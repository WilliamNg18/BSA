---
title: Chapter 2 calculator verification
description: Local production verification, default provenance and selected calculator screenshots.
ms.date: 2026-09-10
---

## Scope

Chapter 2 only: pure baseline arithmetic, validated live inputs, comparison,
memory-only route persistence, reset and reusable assumptions disclosure.
No new pharmacy, queue or case views, simulation, backend, dependency,
analytics, Git/account action or deployment. The original PDF/DOCX,
source registry, canonical fixtures/rules/gate and unrelated files are untouched.

## Verification

### Cross-page focus follow-up

Hosted calculator checks found that the Pharmacy and Queue tour destinations
did not focus their headings. Both headings are now focusable tour targets,
with forward/back, mouse/keyboard and input-focus regressions. The focused
suite passed eight checks. The historical record comparison also exposed a
test-harness whitespace mismatch, not a change to saved decisions.

Current post-fix results come from raw local logs, not the earlier 222/327
implementation totals. Typecheck, lint and build pass with the existing Vite
large-chunk warning. The full unit run passes 239 tests in nine files, including
107 baseline/model-copy tests. The console-only production Chromium run passes
345 tests in 4.2 minutes with exit 0. Independent targeted review confirms
107 unit tests and 38 calculator/assistance browser tests passing with exit 0.
See the [final scoped review](../../../../.copilot-tracking/pr-calculator/final-review.md)
for evidence boundaries; this documentation update did not rerun tests.

| Final check | Result |
|---|---|
| `npm run check` | Exit 0; typecheck and lint clean; [raw log](../../../../.copilot-tracking/pr-calculator/fix-evidence/check.log) |
| `npm test` | Exit 0; 239 tests in nine files; [raw log](../../../../.copilot-tracking/pr-calculator/fix-evidence/unit-final.log) |
| Full production Chromium | Exit 0; 345 tests, 4.2 minutes; [raw log](../../../../.copilot-tracking/pr-calculator/fix-evidence/full-browser.log) |
| Axe, all default rules | 48 unique audits, zero violations: 40 existing plus eight expanded/invalid calculator audits; 96 JSON files include attachment duplicates |
| Independent targeted review | Exit 0; 107 unit tests and 38 browser tests; not a new full-suite run |
| Selected screenshots | Eight PNGs, both states/themes at desktop and phone widths |

No Git command, account change or deployment was performed for this docs-only
update. Existing test evidence and source PDF/Word documents were not modified.

The post-fix check reports 889.18 kB JavaScript (277.72 kB gzip) and 123.80 kB CSS
(19.40 kB gzip), plus bundled fonts. The large-chunk warning was not hidden
or its threshold raised. Private-source bundle checks pass: nine emitted
files and three served files scanned, zero private matches.

The browser suite covers live edits, invalid input, zero/large values,
On/Off, reset/cancel, route persistence, retained history and tour navigation.
Existing Chapter 2 audits run in both themes/states. Additional full-rule axe
audits inspect expanded calculator/source disclosures and invalid field states.
No axe rules are disabled. Existing tour captures now write to per-test output
instead of overwriting the historical tour-foundation screenshots.

### Historical runs and retained failures

The original implementation run passed 222 units in eight files, including
90 baseline tests. Its first full browser run passed 326/327: the reload test
used the slashless /BSA entry, which Vite preview returns as 404. The test was
changed to the supported /BSA/ entry, not a routing fix. A repeat passed all
327 tests but exited 1 during HTML report writing with EBUSY; the lock owner
was not established. The implementation's subsequent console-only repeat
passed 327/327 in 4.2 minutes with exit 0, no failures, skips or retries.
Its historical build was 888.32 kB JavaScript (277.43 kB gzip) and 123.72 kB
CSS (19.36 kB gzip). These are not the current post-fix totals.

The unchanged [prior review](../../../../.copilot-tracking/pr-calculator/review.md)
then recorded F1-F3, another HTML-reporter failure and a console rerun with
326 passed/one pharmacy navigation failure. Three isolated repeats passed;
the failed full run remains failed. Initial fix validation also retained
[238 passed/one failed unit test](../../../../.copilot-tracking/pr-calculator/fix-evidence/unit.log)
and [35 passed/three failed targeted browser tests](../../../../.copilot-tracking/pr-calculator/fix-evidence/targeted.log).
The latter failures concern a menu-trigger assertion in the navigation helper.
Later passing evidence supersedes the scoped findings, not the historical
outcomes or dates. Console success does not establish an HTML-reporter fix.

## Default provenance and formulas

Volume is the O23 approximately 85,000 monthly referred-back subset, used only
as a scenario proxy. It is not total exceptions or exactly 1,000,000/12.
Gathering/judging are invented 5/2-minute assumptions. Pharmacy candidates are
B and the missing-invoice filler, 2/12. Clearances are E and the cleared filler,
2/10 remaining. Abstentions are D and the abstained filler, 2/8 uncleared.
Historical F and the recorded filler stay historical in the residual scaling
pool. No filler model run or new actual decision is generated.

P = round(V*p); C = round((V-P)*c); A = round((V-P-C)*a);
B = V-P-C-A. Percentages are converted to fractions. Rounding is nearest
integer, halves up. Default cohorts: 14,167 / 14,167 / 14,167 / 42,499.
Today operator minutes = V*g + V*j. With agent operator minutes = A*g + (A+B)*j.
Divide by 60 for hours: 9,916.7 and 3,069.5 displayed respectively, not measured
savings. Assembly is the mean synthetic engine latency for active recommended
A/B/C (34.8 seconds/item displayed). Built expected time before decision = j + assemblySeconds/60; abstained
= g+j. Machine latency is never added to operator hours.

Only the three active recommended canonical packs supply the 3/3 validated
citation sample. This is not all decisions or all scaled built items. D has
no provision and E no citation/model call. See [the specification](../../SPEC.md#chapter-2-baseline-model).

## Limitations

Local Windows production Chromium under /BSA/, not hosted verification or CI.
No Firefox/WebKit, Lighthouse, manual screen-reader or complete WCAG claim.
The model excludes pharmacy effort, queue delay, parallelism and additional
failed-assembly latency. All efficiencies remain assumptions needing NHSBSA
validation; the permanent on-screen note requires replacing estimates.

## Selected screenshots

Eight local full-page captures cover 1440 px and 360 px, light/dark, On/Off.
Desktop light/dark On, phone light On and phone dark Off were visually reviewed.
The input default retains the full-precision 2/12 percentage; disclosure rounds
its default display but provides exact numerators and denominators.

| View | On | Off |
|---|---|---|
| Desktop light | [On](month-1440-light-on.png) | [Off](month-1440-light-off.png) |
| Desktop dark | [On](month-1440-dark-on.png) | [Off](month-1440-dark-off.png) |
| Phone light | [On](month-360-light-on.png) | [Off](month-360-light-off.png) |
| Phone dark | [On](month-360-dark-on.png) | [Off](month-360-dark-off.png) |

