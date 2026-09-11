---
title: Thirteen-task implementation progress
description: Authoritative task checklist, commit references and actual validation gates.
ms.date: 2026-09-10
---

## Checklist

* [x] Task 1: synthetic baseline model, calculator and shared scene estimates (ad7d5d8)
* [x] Task 2: local copy, attribution, default-Off and shared motion checks (b7c4451)
* [x] Task 3: shared scene estimates and six-stage pipeline with individual pain markers (96bf097)
* [x] Task 4: a131bad and P1 correction 7bdc199; supplied Azure/CI gate PASS
* [x] Task 5: bounded virtual month, queue sweep and shared-clock day projections
* [x] Task 6: manual case views, gated assisted assembly and immutable record comparison (local gate)
* [ ] Task 7
* [ ] Task 8: Shared case lifecycle and append-only history in the store
* [ ] Task 9: Pharmacy claims view (/pharmacy/claims) with claim detail and actions by state
* [ ] Task 10: Live round trip with Follow this item banner and Switch side
* [ ] Task 11: Tour chapter "What the pharmacy sees" after the queue; two-places chapter updated
* [ ] Task 12: Navigation, case header Pharmacy view link, header still one row
* [ ] Task 13: Verification of Tasks 8 to 13 in both toggle states (Vitest, Playwright, axe, screenshots)

## Current gate and contract freeze

Task 6 starts on stream-a-core at 034121f. The supplied Task 5 gate confirms
check PASS, 475 units and 436 full browsers, CI 34580827129 SUCCESS, Azure deploy
in 2m16s and hosted virtual-volume 0/1/billion, sweep and day PASS. These remote
results are the user's handoff, not independently repeated during Task 6.

Task 5 starts on Stream A from Task 4 correction 7bdc199. The supplied handoff
confirms check PASS, 436 units, 409 browsers, Azure PASS, 17 hosted checks and
CI 34535055333 SUCCESS. Both a131bad and 7bdc199 remain published history.
These remote results are user-supplied, not independently rerun in Task 5.

## Task 5 Stream A implementation and completed gate

Queue-only virtual month, manual evidence dialogs, visible-row sweeps and shared
08:00-17:00 day comparisons are implemented. The new queue memory store follows
the pharmacy adapter's three-slice Reset detection. Frozen store, lifecycle,
routes, case navigation, shell/rail copy and claims remain untouched. The user
explicitly authorised one Stream D exception: the mobile navigation sheet's
exit/Presence race, its overlay and focused regression coverage only.

The month uses calculator volume through one billion, deterministic on-demand
cohorts, at most ten mounted model rows and 1,000-position physical segments.
Logical scroll counters, direct jumps and keyboard controls reach the final item.
All twelve seed examples remain independently pinned, explicitly excluded from
model cohort counts. At volumes below twelve, extra examples are individually
labelled outside projection. No N-sized allocation or N-sized engine sweep occurs.

Generated rows contain generic model classification, not invented rule evidence.
Only existing canonical packs use the existing agent engine; E remains code-only.
Sweeps snapshot only visible rows, retain at most 32 items, animate six phases
over two seconds, and never write recorded state. Off, input regeneration, route
exit and Reset cancel presentation work. D never becomes case-ready. Today
dialogs expose seven manual tasks; full manual case workflows remain Task 6.

Day comparisons use the same twelve examples, a shared clock, Pause, Step and
Jump controls, and two columns at 1280px or wider. Reduced motion is paused
step-through. Aggregate Today capacity is volume-capped floor(540 / (g + j)).
Built and abstained work share one proportional time budget, rounded down;
code-cleared work excludes review and judging. Historical decisions remain
read-only. Calculator judging keeps its constant reference denominator; day
judging counts only projected operator work. These are explicitly different.

First direct full verification: check exit 0, 475 units in eleven files passed,
430 browsers passed and two failed, full browser exit 1. One Today dialog opened
its first pain tooltip automatically, intercepting Escape; initial focus now
targets the dialog heading. The existing chapter-three tooltip assertion raced
focus-induced scrolling; it now scrolls first while retaining all assertions.
The next full run had 434 passes and one failure among 435 tests: the 960px dark
header retained closed sheet content beyond five seconds. Three isolated repeats
passed without a fix. Under the explicit ownership exception, navigation-only
content and overlay now use no closing animation and zero closing duration.
Radix still owns unmount, focus restoration and scroll cleanup; opening motion
remains unless reduced motion is requested. Other sheets retain their defaults.

Six repeats each of the original failure and a new live-motion/paused-animation
regression passed: 12 tests in 51.8 seconds, exit 0. The regression checks Escape,
Close, navigation, removal of both layers, lock cleanup and external keyboard
focus. The shared navigatePrimary helper still requires zero mounted dialogs.
Check passed (exit 0), and 475 units in eleven files passed (exit 0). The complete
436-test production Chromium run subsequently passed. Task 5 is ticked and
published at 034121f; its supplied CI, Azure and hosted gate is recorded above.

### Stream D integration handoff

The inherited shell still visibly says "5. The queue · Simulation planned" and
"Workload simulation remains planned". This contradicts Task 5's local interface.
Stream D must update its owned chapter-five shell/rail copy and corresponding
tests during integration. Stream A does not hide the notice with CSS or edit
shell ownership. Task 5 screenshots intentionally retain it. At that boundary, no Task 6-13,
PR, Git/account action, rebase or deployment is performed; the main agent owns
the later contract-required rebase before PR creation.

## Task 6 Stream A implementation and verification

The three case views now distinguish the synthetic manual comparison from
assisted evidence assembly. Manual trace uses all seven current baseline
durations and their sum, human tags, stopwatch icons and unresolved pain markers.
Clause, requirements, alternative and confidence slots explicitly say not
recorded in this scenario. E additionally exposes its unchanged deterministic
clearance trace, with no agent call; seven assumed manual steps do not replace it.

Off pack has the raw form, captured fields, four missing-field markers and a
single reasoned human decision panel. Sufficient is an explicit human ACCEPT,
never an automatic recommendation: recorded recommendation stays NONE. Existing
recordDecision is the only state-writing action. The frozen lifecycle methods
are not called. The unchanged store labels manual decisions as overrides even
without a recommendation. That counter caveat is visible in pack and record;
Stream B must resolve it during integration, not through this presentation work.

On pack sequences image/fields, evidence, clause/requirements, conflicts,
recommendation/signals/gate and the decision panel last. Replay, Pause, Step,
Show all and Clear are presentation-only. Live reduced motion cancels timers;
reduced mode is explicit step-through. The default reduced-motion view exposes
the complete pack immediately. A read-only manual comparison is side by side
at 1280px, stacked below that width, with no duplicated decision form or buttons.

Off record hides assisted fields only in the comparison. Existing historical
rule versions are acknowledged and retained. Replay is disabled Off; records
without a rule use the explicit no-recorded-version note. On keeps the full
record and July B counterfactual with an animated outcome, compared against the
recorded recommendation rather than a recomputed current recommendation.
No history is rewritten by flag changes, replay, page controls or route changes.

Initial units passed: 488 in twelve files, exit 0. Initial check caught a Fast
Refresh warning from a hook exported alongside components; separating the hook
fixed it. Corrected check passed with the existing large-chunk warning only.
First full Chromium run completed: 454 passed, nine failed in 7.3 minutes,
exit 1. Failures covered definition-list structure in missing slots, nested
phone trace scroll focus, render-dependent timer drift and obsolete Off label
test assumptions. Repairs retain strict axe, two-second and no-agent assertions.
The first corrective run passed 463 and failed two tests in 8.1 minutes, exit 1.
One live-motion test exposed a media-notification race; callbacks now check the
current preference before advancing and the test awaits the disabled Play state
before advancing virtual time. The unrelated existing pipeline tooltip test
also failed once; its source and assertions remain unchanged.

Final verification completed: check exit 0; all 465 production /BSA/ Chromium
tests passed in 7.3 minutes, exit 0, zero failures, skips or retries. The earlier
488-unit run passed in twelve files; no domain/policy code changed afterward.
All 84 unique all-default-rule axe audits passed with zero violations, including
twelve Task 6 audits. Copy checks covered 84 states, including five new Task 6
interactive states, with zero failures. Attachment copies are excluded from
these counts. Twelve screenshots cover pack, trace and record, On/Off, at
1440px light and 360px dark. Six representative images were visually reviewed.
The terminal returned TASK6_VERIFIED_CHECK_EXIT=0 and TASK6_VERIFIED_BROWSER_EXIT=0;
no verification remains running or pending.

The client content scan checked 123 files with zero forbidden matches. Production
privacy scanned nine emitted files and three served assets, 961,088 bytes, with
zero private matches. JS is 834.53 kB, 255.61 kB gzip; CSS 125.80 kB, 19.67 kB gzip.
The existing large-chunk warning remains; no performance or zero-warning claim.
Task 6 is ticked for local verification only. No Git, accounts, CI checks or
deployment were performed. Task 7+, frozen store, lifecycle types, case header,
navigation, shell and claims remain untouched. Shared lifecycle and the manual
override counter still require Stream B integration.

Evidence: [initial check](../../.copilot-tracking/tasks/6/check.log),
[units](../../.copilot-tracking/tasks/6/unit.log),
[corrected check](../../.copilot-tracking/tasks/6/check-fixed.log) and
[first full browser run](../../.copilot-tracking/tasks/6/full-browser.log),
[corrective run](../../.copilot-tracking/tasks/6/final-browser.log),
[final check](../../.copilot-tracking/tasks/6/verified-check.log),
[final full Chromium](../../.copilot-tracking/tasks/6/verified-browser.log),
[unique evidence counter](../../.copilot-tracking/tasks/6/count-evidence.mjs) and
[screenshots](screens/task6/README.md).

## Historical contract-freeze gate

Task 3 commit 96bf0973724c0ceb34d2532f2fc95dfd88f534c4 is confirmed from local
main. Final check, 386 units and 386 production browser tests passed. The user
confirmed Azure-host PASS and CI run 34526886080 SUCCESS. These remote gates
are the supplied handoff, not newly executed remote checks.

The preceding Step 0 increment froze types, exact labels, throwing store
signatures and a heading-only claims route. It completes no Task 4-13 behaviour.
Contract check passed (exit 0), with 386 units in nine files passing (exit 0).
The existing Vite large-chunk warning remains. The contracts-only commit follows
these local checks; its immutable hash will be posted in the stream issues.
See [contracts](parallel-contracts.md)
for ownership, signatures, branch names and integration order. Task 4 local
gates now pass below. The lifecycle signatures and other streams remain untouched.

## Task 4 P1 corrective finding

The published Task 4 commit a131bad is user-reported and is not rewritten here.
Review found that substituting BB in Scenario B could pass an unrelated clause:
the known endorsement-required boolean did not establish validated type coverage.
The previous local gates below did not cover this substitution and are historical,
not verification of this correction.

Pharmacy coverage now stops non-NCSO types at endorsement type, with unable status
and no retrieved version, clause or requirement checks. Original D still stops
at capture. Date correction requires Scenario B, typed NCSO and initials; it
never manufactures an endorsement. Continue with submission remains available.
Plain and dated BB/XP regressions cover both readiness and illustrative referral
handling; browser regressions first establish Ready to catch stale result reuse.
The combined poor-scan caption is shortened without removing synthetic or read
confidence labels, with a dedicated 25-word browser assertion.

Fresh sequential verification completed: check exit 0, 436 units in ten files
passed (exit 0), and all 409 production /BSA/ Chromium tests passed in 6.1 minutes
with the dot reporter (exit 0). No failures, skips or retries were reported.
This includes eleven new unit cases and five new browser cases. The combined
D caption contains 19 words and its dedicated browser assertion passed.
The terminal returned P1_CHECK_EXIT=0, P1_UNIT_EXIT=0 and P1_BROWSER_EXIT=0;
no final test execution remains pending.

The client scan checked 115 files with zero forbidden matches. The production
privacy check scanned nine emitted files and three served assets, 928,929 bytes,
with zero private matches. JS is 803.69 kB, 246.50 kB gzip; the existing Vite
large-chunk warning remains. Historical screenshot and audit counts below were
not independently recounted for this correction.

The earlier runner was not interrupted: the only remaining test runner before
validation was the stale 13:31 process, with no children or port 4173 listener.
Frozen store, navigation, gate and other streams are untouched. No Git, account
or deployment actions were performed. The main agent owns the follow-up commit
without rewriting published history; no CI or hosted result is claimed here.

## Task 4 historical local gate and integration boundary

Before the corrective finding, Task 4 local gates recorded check exit 0, 425 unit tests
in ten files and 404 production /BSA/ Chromium tests in 5.8 minutes, exit 0.
No skipped tests or retries. All 64 unique axe audits passed with zero violations,
including twelve Task 4 A/B/D, On/Off, light/desktop and dark/phone combinations.
Rendered copy checks covered 75 states with zero failures, including expanded
pharmacy panels, receipts and invalid assumptions. The 25-word narrative checks
and positive evasion controls remain intact; this is not a total-page word cap.

The client scan checked 115 files with zero forbidden matches. Production privacy
checks scanned nine emitted assets and three served text assets, 928,793 bytes,
with zero private matches. JS is 803.55 kB, 246.46 kB gzip. The existing Vite
large-chunk warning remains; no zero-warning or performance claim is made.

Off permits typed manual submission with no performed precheck, retrieved clause
or check timestamp. This is an explicit scenario assumption, not evidence that
real pharmacies lack checks. On presents a revision-safe two-second scripted
capture, interpretation, date-selected version, clause and requirement check.
No model API is called. B's exact date gap is applied only by the user's action;
canonical B and its July replay remain unchanged. D always stops at capture,
even after plausible typed replacement; all subsequent checks are NOT RUN.
Continue with submission stays enabled while pending, unavailable, missing or
unable. Submission never waits for a successful check.

Receipts are detached, recursively frozen snapshots in the separate
[pharmacy store](../src/lib/pharmacy-store.ts), not the final shared one-case
lifecycle store. They retain text, performed checks, timestamp, version and
assumptions. Task 8 will integrate the lifecycle; no frozen store method is called
and no queue/history state changes. The timeline is presentation only, not an
actual paid transition. Complete A and the explicit corrected-B preset avoid
invented referrals, including corrected B submitted Off without fabricated
checks. D remains unresolved with no payment guarantee.

Global Reset was verified on pharmacy and from another route: receipts and
receipt numbering, edited text, selected scenario, local availability, timeline,
all duration values and invalid field drafts return to defaults. Agent remains
Off, with no stale check. Keyboard Apply/Step, Pause/Jump, cancellation and live
reduced-motion behaviour pass. Baseline duration additions are isolated scenario
assumptions; the existing calculator arithmetic and six canonical cases pass.

The first full run had 400 passed and four failures: three pharmacy light-theme
contrast failures from nested label backgrounds, plus an existing tooltip's
initial route-focus race. Local label contrast and test focus sequencing were
corrected without removing assertions. Failed evidence remains retained.
Screenshot-only scroll positioning was then corrected; all sixteen pharmacy
tests passed again in 32 seconds. Twelve Task 4 images are retained alongside
302 non-attachment full-suite screenshots. See [selected images](screens/task4/README.md).

Evidence: [final check](../../.copilot-tracking/tasks/4/final-check.log),
[final units](../../.copilot-tracking/tasks/4/final-unit.log),
[full Chromium](../../.copilot-tracking/tasks/4/final-playwright.log),
[earlier failure](../../.copilot-tracking/tasks/4/resumed-playwright.log),
[screenshot verification](../../.copilot-tracking/tasks/4/screenshot-verification.log)
and [artifact counter](../../.copilot-tracking/tasks/4/summarise.mjs).

No Git, account, commit, deployment or remote verification action was performed.
Tasks 5-13 remain unchecked; queue simulation, shared lifecycle, claims actions
and round-trip integration are not implemented here. No Firefox/WebKit, manual
screen-reader or full WCAG conformance claim is made.

## Task 1 gates

Task 1 commit ad7d5d8. User-reported CI 34515828351 and 27 hosted checks passed.
Local check exit 0; 383 units in nine files; 371 production Chromium tests in
4.5 minutes, exit 0. The 48 axe audits had zero violations. Vite's existing
large-chunk warning remains; no zero-warning performance claim.

See [verification](../../.copilot-tracking/tasks/1/verification.json) and
[model formulas](task-1-baseline-model.md). Azure hosting was approved after
private Pages returned HTTP 422. Local tests retain the /BSA/ production base;
they do not verify Azure deployment.

## Task 2 gates and implementation

Task 2 commit b7c4451e64d27e4c7c410d9e5647722f7f6ee64b on main.
User-reported CI 34521892212 and 62 hosted passes followed the local gate.
Check exit 0; 383 units/nine files; 376 production Chromium tests in 4.7 minutes,
exit 0, no skips or retries. The 48 unique axe audits had zero violations.
298 screenshots were retained; desktop light On and phone dark Off were reviewed.

The client scan covered 103 files with zero forbidden matches. Copy checks
covered 31 routes in each flag state, expanded disclosures and 921 narrative
panels. Numeric words count; positive controls reject split prose, label/badge/link
evasions and unmarked prose. This is not exhaustive coverage of every interactive
state or a 25-word total-page limit.

Default and Reset are Off. On requires opt-in. The shared two-second transition
respects immediate/live reduced motion. Pain markers retain keyboard text and
abstention. Domain comparison against ad7d5d8 passed 72 case/month/flag/fault
variants. Gate predicates, outcomes, evidence, conflicts, signals, tools, timing
and fixtures remained intact. Reviewed changes were concise prose, synthetic
clause paraphrases and the evidence field rename to origin; no fields were dropped.

The research register moved unchanged after newline normalisation to the
[offline audit](../data/reference/source-audit.ts). Original supplied documents
remain untracked. The client imports no audit. Nine emitted assets and three
served text assets, 908,324 bytes, contained zero private matches. Chapter one
has one Sources footer. JS was 783.59 kB, 240.75 kB gzip, with the existing warning.

See [verification](../../.copilot-tracking/tasks/2/verification.json),
[check](../../.copilot-tracking/tasks/2/verified-check.log),
[units](../../.copilot-tracking/tasks/2/verified-unit.log) and
[browser](../../.copilot-tracking/tasks/2/verified-playwright.log).
Earlier failures are retained: 367 passed/9 failed, then 375 passed/1 failed
from a disclosure-navigation race, repaired before the final passing gate.

## Task 3 final gate and preserved history

Final corrected check exit 0; 386 units; 386 production Chromium tests in
4.9 minutes, exit 0. The [commit-ready log](../../.copilot-tracking/tasks/3/commit-ready.log)
supersedes all earlier pending-run and local-only statements formerly in the root
progress file. Task 3 is committed and its supplied CI/Azure gate is recorded above.

Chapter 3 leads with six stages and retains the A-D operator cards. Existing
scanning, printed extraction and deterministic pricing remain unchanged.
Seven manual gathering steps use the shared Task 1 inputs. Free-text reasons
and weeks-long referral cycles are assumptions, not observed practice.

The two-second clock sequences planning, gathering, retrieval, reconciliation,
assessment and gate presentation without writing domain state. Only built
exceptions receive proposals. Case D stays manual. The B draft is not sent;
exact-fix readiness requires complete presentation, PASS and its own marker.
The pharmacy exit precedes capture; pharmacy, queue and case links work.

Residual risk includes all abstentions plus deficient built items, without
double counting. Referral formulas remain unchanged. The referral-free proxy
is an estimate, not accuracy: zero volume/residual is Not established; positive
residual rounds down, never to 100%. The three public figures remain approximate
1.1 billion annual items, 85,000 monthly referrals and Monthly rulebook publication.
Publication frequency is not rule-change frequency.

Historical pre-correction gate: check exit 0, 385 units/nine files, 385 Chromium
tests in 5.1 minutes, exit 0, no skips/retries. Nine new browser tests covered
stage ordering, shared/zero/tiny estimates, tooltips, keyboard links, reversible
phases, reduced motion, responsiveness and accessibility. Six cases/gate unchanged.
Client scan: 106 files, zero forbidden matches. Privacy scan: nine emitted assets,
three served text assets, 919,617 bytes, zero private matches. JS 794.20 kB,
243.10 kB gzip, existing warning.

Retained historical logs: [check](../../.copilot-tracking/tasks/3/final-check.log),
[units](../../.copilot-tracking/tasks/3/final-unit.log),
[browser](../../.copilot-tracking/tasks/3/final-playwright.log).
Earlier focused 12 passed/2 failed from decimal serialization and tooltip focus;
a TypeScript context-literal error was repaired. Scope correction then passed
386 units and check (JS 794.92 kB/243.29 kB gzip). Its first browser run exposed
an outgoing tooltip locator ambiguity; exact name, focus, visibility and text
assertions were retained and repaired. The former active ID
441adf29-171f-4480-a2be-053d6ad00958 is historical, not a current execution.
Retained scope logs: [check](../../.copilot-tracking/tasks/3/scope-check.log),
[units](../../.copilot-tracking/tasks/3/scope-unit.log),
[browser](../../.copilot-tracking/tasks/3/scope-playwright.log).
Four [selected screenshots](screens/task3/README.md) were visually reviewed.

No full WCAG, manual screen-reader, Firefox/WebKit or performance claim is made.
Archive/rollback references remain untouched. This file is authoritative; the
root progress file is a pointer, not a second checklist.