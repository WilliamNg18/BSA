---
title: Thirteen-task implementation progress
description: Authoritative task checklist, commit references and actual validation gates.
ms.date: 2026-09-12
---

## PR build artifact execution and keyboard readiness correction

CI 34701455982 at 261cbfe published `pr-build-49`, artifact ID 10299839601,
204,991 bytes, with seven-day retention. The actual download link was written
to shard one's job summary and independently downloaded: index.html, hosting
JSON and two fingerprinted CSS/JS files. This is a build, not a live preview.

The run passed 645 unique unit cases in every shard but completed 1,053 browser
passes/one failure. Artifact publication did not conceal the keyboard readiness
failure described in LEARNINGS. Coordinator authorised a narrow test-only fix
in that function; the policy import and application code remain unchanged.
The exact case repeated three times passed 3/3 in 58.3 seconds, exit 0; typecheck
and targeted lint passed. Port 4173 was released. Full replacement CI remains
required; retain the original failed-run result rather than relabelling it.

## PR build artifact follow-up

The artifact-only proposal adds one best-effort seven-day PR build upload on
verification shard one and a guarded job-summary download link. No production,
runner, e2e body, permissions or blocking check changes. Workflow YAML parsed;
38 runner/workflow unit cases and typecheck passed after the CRLF-aware test
correction. Actual artifact publication still requires the proposal's PR run.
No local full browser rerun was started for this workflow-only addition.

## Issue #46 measured four-shard verification

[Public CI 34700392502](https://github.com/WilliamNg18/BSA/actions/runs/34700392502)
at `a55b66df2ff433bcb58f97208f078b8258f733a9` completed successfully.
Created at `2026-09-12T14:49:09Z`, its final job completed at
`2026-09-12T14:56:54Z`: **7 minutes 45 seconds end to end**, including queue,
checkout, dependencies, browser installation, verification and post-job work.
This actual run meets the under-fifteen-minute target without adding a timing gate.

| Shard | Blocking Chromium passes | Browser duration | Complete job duration |
| --- | --- | --- | --- |
| 1/4 | 264 | 5.0 minutes | 368 seconds |
| 2/4 | 264 | 5.0 minutes | 373 seconds |
| 3/4 | 263 | 2.9 minutes | 247 seconds |
| 4/4 | 263 | 6.4 minutes | 463 seconds |

The total is **1,054 distinct blocking browser cases**, not four whole suites.
All four jobs ran check and **643 units in 23 files** successfully: 643 unique
units repeated four times, not 2,572 distinct tests. Every shard's verification
entry exited 0; empty informational quarantine selections succeeded. Gzip
appeared once, on shard one, and remained informational. There was one CI
workflow run for this PR head, not duplicate feature-push and PR verification.

Rebase onto parent main 03bc583 retained its cloud-agent setup, INFRA-DONE,
MEMORY and documentation changes. Git diff confirms verification scripts,
package scripts, unit/e2e tests, CI workflow and application source are identical
to the measured head. Historical hosting references below describe that run;
the coordinator separately owns the subsequently requested App Service migration.

## Issue #46 unified verification implementation

The proposed `npm run verify` runner and four-shard CI preserve the same
blocking functional/accessibility checks and run informational reports without
failing acceptance. It reuses the strict-header artifact configuration after
one build, validates shard arguments and avoids duplicate feature-push/PR runs.
No application code, existing e2e body, timeout or hosting policy changed.

Local `npm run check` passed, exit 0; `npm run test -- --maxWorkers=1` passed
643 tests in 23 files (607 existing plus 36 runner/CI cases), exit 0. Actual
Playwright lists prove the four partitions contain 264/264/263/263 unique cases,
exactly the complete 1,054-case union with no overlap or omissions.
CI YAML parsing, informational gzip execution and invalid-shard CLI exit 2
were independently checked. No redundant local full browser run occurred.
The exact proposed head still needs a complete public sharded CI run and
measured end-to-end duration; under fifteen minutes is a target, not a gate.

## Current acceptance refresh: 12 September 2026

Main after #42, #40 and V #43 is
`c687a9eab181b02f4fca0eb667e8ab8f94468620`; accepted application/test source is
`82c18e49e7d1c765e5392b1bec5c028c8f89fd16`. #42 removes only the route
opacity fade to repair intermediate-frame contrast and adds 32 frame cases.
#40 restores three quarantined cases to blocking; #43 is documentation-only.

[CI 34696637977](https://github.com/WilliamNg18/BSA/actions/runs/34696637977)
at exact head `f295d7f19363cd101af7401f0ba03188ee7d0b2b` passed check,
**607 units in 22 files and 1,054 all-blocking Chromium tests in 15.1 minutes,
zero quarantine**. Source/tests match the accepted application. The workflow's
`--grep-invert @quarantine` command excludes no current tagged cases.
#34 and #41 are closed following these repairs; #35 is closed as not reproduced,
not as a newly proven axe defect. The earlier 1,019-plus-three run and tag-removal
proposal below are historical, not the current gate or open follow-ups.

V's [scoped route ledger](screens/route-opacity-parity/route-equivalence.json)
completed `2026-09-12T14:05:50.955Z`: **64/64 settled route screenshots
byte-identical, 32 Off/32 On**, with 64 fresh unrestricted axe reports,
zero violations/page-console-CSP errors/overflow and 39 incomplete audit sets.
These light/reduced-motion route captures do not replace normal-motion frame
regressions or establish manual WCAG conformance. The original 107 PNGs and
audit ledger retain source `898cda5`; **43 other stateful images were not rerun**.
Do not relabel the original 107 audits as current-source captures or combine
old and fresh counts into a new full-CI audit total.

[Current build evidence](screens/route-opacity-parity/build-evidence.json):
**203,721 bytes**, sum of all four independent resources using Python
`gzip.compress(data, mtime=0)` at default level 9, comparable with the old
203,723-byte record. Node level 9 gives a separately recorded **203,964 bytes**.
Different compressor results are not interchangeable; all sizes are informational,
with no budget. No code build/browser tests were rerun for this records refresh.

Tasks **1-12 remain Done; Task 13 hosted release remains pending #37**.
Scope I and parity row 31 are unchanged: no verified live URL or PR preview.
The two owner actions in HANDOVER/DEPLOYMENT and MEMORY's permanent Blockers
and status policy remain in force. Initial D documentation merged as #39;
this scoped refresh awaits coordinator merge. The acceptance/transfer records
below are preserved as history, not current pending work.

## Historical issue #34 timing follow-up: tag-removal proposal

Fresh main 58c3879 was built successfully with `npm run build`, exit 0.
The exact existing tagged subset ran with:
`npm run test:e2e -- --config tests/e2e/production-artifact.config.ts assistance.spec.ts pharmacy.spec.ts --grep @quarantine --repeat-each=3 --workers=1 --reporter=dot`
and an explicit session output directory outside OneDrive.
Actual result: 9 passed in 2.0 minutes, exit 0, six unique axe reports with zero
violations. Port 4173 was released after the run. Raw evidence is retained in
the R session artifacts as `issue34-controlled.log` and
`issue34-controlled-results`; original failure trace timings are in LEARNINGS.

Only the three conditional quarantine instances in the two owned test files
are proposed for restoration to blocking status. No assertion, timeout, fixture,
application code or workflow change. Full public CI on the proposed revision
is pending; earlier accepted 1,019-plus-three counts remain historical evidence.

## Historical initial application acceptance: 12 September 2026

Main after R, V and final parity PR #38 is
`a031fc49f4f616efc3a3a33baa0510e6b82eb880`.
R PR #33 integrated application acceptance at
`898cda594d0dcb34376bddab7112edcddb172440`; V PR #24 delivered final
documentation/captures from head `5660bbc` without runtime changes.
V's merge is `be623ab507e871c27e0889e7db6e64a8595ad10b`; parity is also
documentation-only.
Transfer is cancelled; public ownership/reference approval and scanning/push
protection remain unchanged. Protected branches and checkpoint tags are intact.

* [x] Task 8: shared lifecycle and append-only history (`d9e06e1`; accepted `898cda5`)
* [x] Task 9: claims/detail/actions and approved On reasons (`d9e06e1`, R #19/#29; accepted `898cda5`)
* [x] Task 10: complete human-controlled round trip, Follow and Switch side (`d9e06e1`; accepted `898cda5`)
* [x] Task 11: eight chapters/nine stops and full referral-cycle guide (`c95ff1d`; accepted `898cda5`, captured by V)
* [x] Task 12: grouped one-row header, same-item links, focus and seven widths (`22ec345`, `c95ff1d`; accepted `898cda5`)
* [ ] Task 13: application verification complete; actual hosted release remains pending #37

Tasks: **12 Done, 1 In progress, 0 Not started**. Scope: **17 Done,
1 In progress, 0 Not started**; scope I is hosting #37, J is this completed
documentation deliverable. Documentation still requires coordinator PR merge.

### Exact accepted evidence and limits

[Public CI 34689966621](https://github.com/WilliamNg18/BSA/actions/runs/34689966621)
tested `6e424ac75c4980380c31f9e3aab23243a9a013d0`. Runtime source/configuration
matches `898cda5` and `be623ab`; documentation changes do not imply a new code run.

| Evidence | Actual result |
| --- | --- |
| `npm run check` | Passed typecheck, lint and production build |
| `npm test` | 607 passed in 22 files |
| Chromium, `--grep-invert @quarantine` | 1,019 blocking tests passed in 17.7 minutes |
| Separate informational quarantine execution | 3 passed in 16.4 seconds; not added to the blocking count |
| Final V manifest | 107 actual PNGs/audits, 53 Off and 54 On, captured at `2026-09-12T11:50:58.433Z` against application source `898cda594d0dcb34376bddab7112edcddb172440` |
| V axe/overflow/browser-console-CSP results | Zero violations/errors across 107 audits; 51 audits have incomplete axe rules requiring human review |
| Capture conditions | Root-path production with configured strict headers, 1440x1000, light, reduced motion; full-page images reviewed, hashes and width checked |
| Independent gzip, all four emitted resources | 203,723 bytes; informational only, no size/performance budget |

The manifest and individual audit files are in [screens/integrated](screens/integrated/);
[build-evidence.json](screens/integrated/build-evidence.json) records each resource.
Successful CI audit artifacts were not uploaded, so a deduplicated full-CI axe
or CSP total (including an On/Off split) is unavailable. The 107 V audit counts
are separate evidence, not inferred CI totals. Neither local strict-header
testing nor zero axe violations establishes hosted behaviour or full manual
WCAG conformance. Phase 1's 560 units/19 browsers/201,623 bytes are historical.

### Explicit remaining work

**No verified live URL or PR preview.** [Azure run 34692328300](https://github.com/WilliamNg18/BSA/actions/runs/34692328300)
built main `be623ab` but failed the named missing
`AZURE_STATIC_WEB_APPS_API_TOKEN` prerequisite. #37 owns token reset/repository
secret and any resource setup, then actual deployment, home/deep links, headers,
both modes and preview creation/closure. Owner commands are in DEPLOYMENT.md;
no resource creation or intended subscription is inferred.

#34 retains three quarantined pharmacy timing cases; their informational pass
does not remove quarantine. #35 was closed after trace review established
that its error surfaced during teardown after navigation exceeded the deadline;
no actionable axe defect was reproduced in final blocking acceptance.
These retained timing records are not failed final
blocking tests or new missing application features. [PARITY](PARITY.md), merged
through #38, records 33 rows: 22 Preserved, 10 Changed with decision, zero
Changed without decision, zero Missing and one Not yet verified. That is
32/33 accepted, not all 33; row 31 is hosted acceptance #37. Historical totals
below are not current acceptance.

## Historical account transfer checkpoint

**Current outcome:** transfer cancelled; repository public, owner WilliamNg18.
Work is authorised to resume from HANDOVER. Checkpoint `b7e63ac` and all stream
tags preserve the historical freeze. The statuses below retain unfinished
acceptance honestly; "paused" refers to the checkpoint, not a new hold.
GitHub scanning/push protection are enabled; references stay public by decision.

**Frozen on 12 September 2026.** Resume only on the new owner's exact
`Resume from docs/HANDOVER.md` message. [HANDOVER](HANDOVER.md) is the
authoritative branch/head/next-action record. Application main at freeze is
`98c888184db1df9c03539413b5e3b1db47f1ebfe`; this documentation is pinned by
`checkpoint-2026-09-12`. No feature merges occur during the freeze.

| Task | Current status | Completed implementation / remaining acceptance |
| --- | --- | --- |
| 1 | Done | `ad7d5d86aedc0d07378f3b77622dbd72874f512c` |
| 2 | Done | `b7c4451e64d27e4c7c410d9e5647722f7f6ee64b` |
| 3 | Done | `96bf0973724c0ceb34d2532f2fc95dfd88f534c4` |
| 4 | Done | `a131bad4c312d8e1b583f43ab4ce95e94c5abd56`, correction `7bdc1990f7c16a843ccebd86620d92c6d3a13fae` |
| 5 | Done | `034121fe45b74ea024d6f6e1d2f6b76a676747d4` |
| 6 | Done | `36db32af9db823d1e32e6daf9f32d008a5c98a44` |
| 7 | Done | `79bd2832f5f27e47af7022fc7899fe494356f206`; old performance budgets are superseded |
| 8 | In progress, paused | Lifecycle implementation merged `d9e06e1`; final integrated acceptance/D tick pending |
| 9 | In progress, paused | Claims foundation merged `d9e06e1`; #19/#29 fixes on R PR #33, not main |
| 10 | In progress, paused | Shared round trip/Follow implemented; complete corrected-head browser acceptance interrupted |
| 11 | In progress, paused | Eight-chapter/full-cycle implementation merged `c95ff1d`; final R/V acceptance pending |
| 12 | In progress, paused | Navigation and S focus/reflow merged `22ec345`/`c95ff1d`; final acceptance pending |
| 13 | In progress, paused | R full suite, V final 107 captures, D final report unfinished |

Tasks: **7 Done, 6 In progress, 0 Not started**. Scope: **3 Done, 15 In
progress, 0 Not started** across the 18 rows of [SCOPE](SCOPE.md).
These bounded scope completions do not prematurely tick Tasks 8-13.

R checkpoint `500e883d1f48a03b32ae0864751a44705b996382` preserves source
`696f077`, check/607 unit passes, inventory 1,022, a failed Linux run
1,016/3 and all three corrected-test passes. Its exact-head full Windows
fallback was stopped for transfer without final counts. Replacement CI
never started because of an account payment/spending restriction. No
full corrected-head, hosted or final V capture acceptance is claimed.

All sections below are retained historical stream evidence. Statements such
as "merge pending", old seven-chapter arrangements, old size budgets and
then-current running commands below are superseded by this table and HANDOVER.

## Issue 27 independent scene count-in stream

Based on main 8c05b18. The scene now composes a local numeric count-in using
the existing derived estimates, UK formatting and two-second presentation
duration. Final accessible values remain stable; Off/reduced motion are
immediate and stale frames are cancelled on input changes, Off/Reset and
unmount. No public figures, source qualifications, lifecycle, domain arithmetic,
shared number helper or T26-owned navigation files changed.

Initial implementation 9e8fb7f: check passed; all 565 units in nineteen files passed
with two workers, including twelve new count-in cases. Two later SSR accessible
markup assertions passed with all fourteen targeted units, typecheck and lint;
this is not an inferred new full-suite total.

Production source 4a71d48 passed all six new scene browsers on the granted
4193 slot with one worker, plus the unchanged calculator "all seven live steps"
test in an isolated retry. Two retained default-rule axe reports have zero
violations (47 normal-motion and 46 reduced-motion passing rules).
No claim of one clean seven-test run: the first completed run was six passes
and one incorrect new ariaSnapshot assertion, corrected to include the actual
definition wrapper; the next was six scene passes and a thirty-second timeout
in the unchanged calculator test, which then passed unchanged in isolation.
Two earlier server-start timeouts ran no tests. A separate production build
passed before testing its exact artifact. All logs, failure traces and axe JSON
are retained outside OneDrive in this session's files folder.

Port 4193 is released. The coordinator accepts this bounded browser evidence;
no further browsers are authorised. On 12 September, the final rebase onto main
11ea042 completed cleanly, preserving all append-only documentation. At rebased
code head ac36e2d, one combined check/full-unit run passed: typecheck, lint and
production build, then 591 units in 21 files with two workers. Owned scene source
and tests are unchanged from browser-accepted c902c6e. PR #31 is ready for the
coordinator's merge; this scope does not tick Tasks 8-13 or claim hosted acceptance.

## Checklist

### Issue 26 implementation stream

Eight explicit chapters now separate the pipeline and Four cases. Both places
show longer manual evidence-gathering sequences and shorter proposed assisted
preparation, preserving human decisions and abstention. The claims composition
includes a five-stage explanatory referral cycle alongside, not instead of,
actual recorded state and existing pharmacy/operator controls.

New `tour-cycle.spec.ts` covers exact navigation, mode-dependent sequences,
the actual human/code referral-to-synthetic-pricing journey and responsive axe.
Unit contracts cover chapter order and complete canonical narratives.
Local check passes and all 563 units in 18 files pass. The coordinator-approved
one-worker production selection covers ten tests: six new tour-cycle tests,
three affected pipeline tests and the calculator navigation/reset test.
The first run had seven passes and three failures in 10.8 minutes; the narrowed
three-test retry passed in 2.9 minutes, preserving the first run's evidence.
Both real human/code referral cycles pass. Responsive axe is zero violations
at 360 and 1440 in both modes. Port 4173 was verified released after execution.
R owns existing tour expectations; S owns shell focus/metadata.
No domain/store mutation, hosting change or integrated acceptance claim.

Parent review tightened the comparison to one qualified paragraph and scoped
the paid-stage human decision to referred items, not rules-cleared Case E.
Eight additional server-rendered contracts check all seven lifecycle states
in both modes and unknown claims, with frozen inputs and no invented progress.

The first browser failures were a blank-page initial navigation timeout,
a page-fixture timeout, and a menu-to-dismiss focus race in the new test.
The latter now asserts completed route heading focus and menu closure before
focusing and keyboard-activating Dismiss. Two existing Case D assertions now
navigate from pipeline to Four cases while preserving NOT RUN/open-pain checks.
The coordinator-requested copy-length diagnostic is informational; all
calculated-value, timing, control-state and reflow assertions remain intact.
Raw logs and first-run trace/results copies are retained in this session's
files directory. This is narrow local acceptance, not the final full-suite
integration gate or a hosted deployment claim.

2026-09-12 integration update: rebased onto merged Stream S at `22ec345`.
Append-only decisions/learnings retain both streams' evidence. AppShell
canonical chapter metadata, focus handling, strict-CSP controls and styles
remain identical to main. Combined check passes and all 567 units in 19 files
pass with two workers. No browser matrix was rerun; the earlier ten-scenario
results remain historical narrow evidence. Final integrated Linux acceptance
is still required.

Final 2026-09-12 rebase includes the merged pharmacy status fix at `ff00b3e`.
Both streams' appended records are retained. Tour-cycle assertions use claim
lifecycle labels, not the former workbench Off status. Combined check and
567 units in 19 files pass again; no redundant browser run was performed.

* [x] Task 1: synthetic baseline model, calculator and shared scene estimates (ad7d5d8)
* [x] Task 2: local copy, attribution, default-Off and shared motion checks (b7c4451)
* [x] Task 3: shared scene estimates and six-stage pipeline with individual pain markers (96bf097)
* [x] Task 4: a131bad and P1 correction 7bdc199; supplied Azure/CI gate PASS
* [x] Task 5: bounded virtual month, queue sweep and shared-clock day projections (034121f)
* [x] Task 6: manual case views, gated assisted assembly and immutable record comparison (36db32a; supplied postcommit gate PASS)
* [x] Task 7: owned Stream A scope complete (79bd283); historical 503 units/721 browsers/334 axe clear
* [ ] Task 8: In progress, paused; lifecycle implemented, final integrated acceptance pending
* [ ] Task 9: In progress, paused; claims implemented, R #19/#29 unmerged
* [ ] Task 10: In progress, paused; round trip and Follow implemented, full proof interrupted
* [ ] Task 11: In progress, paused; eight chapters/cycle merged c95ff1d, final R/V acceptance pending
* [ ] Task 12: In progress, paused; navigation implemented, final integrated acceptance pending
* [ ] Task 13: In progress, paused; final suite/captures/report incomplete

## Stream R: root-route regression preparation

Corrected exact root-path assertions in routes, tour stops and rapid keyboard
history; strengthened the existing Off-to-On round trip with immutable blind
submission and no-automatic-transition assertions. Product code is unchanged
in this regression preparation.

The initial check exited 1 because TypeScript was missing. Locked dependency
restoration made the tools available but stalled without output and was stopped;
no successful npm ci completion is claimed. Subsequent npm run check exited 0,
and npm run test -- --maxWorkers=2 passed 560 tests in 20 files, exit 0.
The final regression edits also passed npm run typecheck and npm run lint,
exit 0. The full production run collected 783 tests with two workers on root
port 4173, zero retries; its completion evidence is pending, not a passing gate.

This run retains Phase 1's then-current payload test. Coordinator policy now
removes all byte budgets and measurement tests; it will apply after rebase, not
by changing the artifact during the running suite. No Azure acceptance is
claimed, and Tasks 8-13 remain unchecked.

## Stream R issue #19 implementation, browser verification pending

The baseline Chromium probe reproduced unapproved seeded EX-24112 reason text
in both the current Operator response and expanded pharmacy history with On.
The scoped fix hides raw manual reasons only on the On pharmacy surface,
preserves labelled approved notes and leaves Off/NHSBSA history unchanged.
Eight new seeded/new-response browser tests plus the updated Task13 round-trip
assertions cover that policy. Typecheck and lint passed, exit 0.

The initial full suite still serves its unchanged pre-fix production artifact.
No #19 browser pass or final acceptance is claimed until a coordinated slot
rebuilds and exercises this revision. The coordinator owns merge sequencing.

## Stream R issue #29 implementation, browser verification pending

Added a claims-specific unchecked-resubmission comparison and reused the existing
pain marker. Off names a synthetic possible repeat cycle; On resolves only a
current Ready result with an actual approved instruction. No lifecycle or
precheck code changes. Four new browser cases cover keyboard, mode reversals,
unchecked snapshots, edit invalidation and default-rule axe on two viewports.
Typecheck and lint passed, exit 0. Runtime verification awaits the coordinated
browser slot; the running baseline production artifact remains unchanged.

## Stream R obsolete full run interrupted by coordinator

`npm run test:e2e -- --workers=2 --reporter=dot` collected 783 tests at the root
on port 4173, zero retries. On 11 September at 19:42 local time the coordinator
requested termination of this obsolete seven-chapter run so implemented changes
could be validated. Only its owned shell/process tree was stopped; port 4173
was verified released. This is INTERRUPTED, with no final runner exit code.

The saved reporter output contains 629 pass markers, ten timeout markers and
one failure. These are partial markers, not final test counts or a full pass.
The known skip-link failure exposed the stale first-Tab assumption corrected
above. Timeout artifacts remain unclassified; no assertions were quarantined.
Raw log, full results/traces and the original dist are preserved under the
Stream R session artifacts as r-full-browser-1.log, r-full-browser-1-results
and r-full-browser-1-dist. The earlier four-timeout report was interim only.

Final full production acceptance remains required on the integrated eight-chapter
build, preferably through exact Linux CI evidence. Neither this interrupted run
nor the pending focused #19/#29 browser cases establish that acceptance.

### Rebased Stream R check and unit evidence

Source revision 7515c51 rebased cleanly onto origin/main 87923d7. From BSA,
`npm run check` passed typecheck, lint and production build, exit 0.
`npm run test -- --maxWorkers=2` passed all 553 tests in 18 files in 14.62 seconds,
exit 0. This uses the coordinator's no-budget policy; the earlier 560-test
Phase 1 result included seven subsequently removed budget tests.

The branch contains separate approved-response (#19) and unchecked-resubmission
comparison (#29) commits, root-route corrections and the keyboard skip regression.
Its draft PR is not merge-ready: focused browser verification awaits the next
coordinated slot, and eight-chapter tour expectations await integration of #26.
No hosted acceptance or final full-suite pass is claimed.

While awaiting the browser slot, sixteen server-rendered component tests covered
every enabled/approved/check-status combination of the #29 comparison using
existing React/Vitest dependencies. All sixteen passed, then typecheck and lint
passed and `npm run test -- --maxWorkers=1` passed the complete 569-test suite in
19 files in 40.47 seconds, exit 0. This adds no production code and does not
replace keyboard, lifecycle or axe browser verification.

Coordinator policy also replaces only the mixed-mode round trip's 120-second
elapsed-time assertion with an informational JSON timing artifact. Every
functional assertion, test timeout and deterministic phase-clock check remains.
The narration target is not a strict runtime acceptance claim.

## Completed Stream R seven-chapter Linux baseline

CI 34636865707 at 2f398b5 completed check and 569 units successfully, then the
full production browser command completed with 761 passed and 33 failed
(794 total) in 23.3 minutes, exit 1. Independent CI 34636861657 at the same SHA
reported the same counts in 22.6 minutes. These completed failures supersede
neither the retained interrupted local run nor the final eight-chapter gate.

Thirty-two failures are the existing phone case-pack overflow owned by Stream S:
two case-presentation, ten route and twenty Task7 cases. One is the new desktop
resubmission test capturing the outgoing NHSBSA status before pharmacy navigation
committed. The latter is repaired by awaiting the destination heading and exact
pharmacy status before history capture. Both same-revision runs failed it; no
passing-repeat or quarantine claim is made. Approved-response tests passed.

The first focused 21-case local attempt exited 1 before executing tests because
the existing 120-second webServer deadline terminated its contended build.
A separate explicit production build then exited 0; the preview-only session
configuration uses that exact artifact without changing test/expect timeouts.
Focused execution and correction verification are recorded after completion.

The actual 21-case focused run on the rebuilt artifact completed 20 passed and
one failed in 7.7 minutes, exit 1. All eight response-approval tests, mixed-mode
round trip, corrected skip/revisit tests and six canonical control regressions
passed. The only failure was the phone-dark Off comparison exceeding the
30-second test deadline inside axe analysis; no violation report was produced.

After the On destination-snapshot correction, the bounded four-case comparison
repeat passed 4/4 in 1.3 minutes, exit 0, with unchanged browser/test deadlines
and the same emitted production artifact. Its Off case was unchanged. Follow-up
issue #35 records this transient local axe timeout and both CI passes of the
same case; axe stays blocking and no skip or quarantine tag was introduced.
Logs/results are r-focused-2 and r-focused-3 in dedicated session subfolders.

## Stream R integration on c95ff1d

Rebased onto main c95ff1d containing strict-CSP serving, S's phone overflow fix,
the neutral manual pharmacy status and T's eight chapters. Append-only document
conflicts preserve every stream's entries. Existing tour checks now require
eight chapters/nine stops; pipeline and Four cases remain separately asserted.
The extra pipeline route is included in functional and audit inventories.

On this integrated source, `npm run check` passed, exit 0, and
`npm run test -- --maxWorkers=1` passed 583 tests in 20 files in 13.05 seconds,
exit 0. Two subsequent narrow accessibility-array edits add pipeline only, with
S/coordinator approval. New inventory is collected rather than inferred.
Final rebase onto Queue/Scene and exact-head full Linux CI remain pending.

## Stream R final assembled branch validation

Rebased onto main 98c8881, integrating S, helper, T, Queue and Scene. Tested source
c935764 passed `npm run check` (typecheck, lint, production build), exit 0.
`npm run test -- --maxWorkers=1` passed 607 tests in 22 files in 15.59 seconds,
exit 0. Actual `npm run test:e2e -- --list --reporter=dot` inventory is 1,022
tests in 26 files, exit 0; listing is not execution or a browser pass.

Root routes, eight chapters/nine stops, separate pipeline/Four cases, approved
pharmacy responses and the unchecked-resubmission comparison are now assembled.
Previous focused and failure evidence above remains intact. The exact final PR
head requires complete Linux CI, including blocking crash/control/outcome and
zero-violation axe checks. Coordinator controls merge and release; no hosted
acceptance is inferred from local checks or a successful test listing.

## Stream R first final assembled CI and correction

CI 34687220652 at 1c2a3ba completed 1,016 passed and three failed in 20.8 minutes,
exit 1: 1,019 blocking browsers executed, with three quarantined tests excluded.
All three failures were stale split-chapter assertions described in LEARNINGS.
They are repaired without changing application code, reducing coverage or
quarantining deterministic failures.

The downloaded failure artifact contains 673 unique axe result files with zero
violations and 193 unique CSP violation reports with zero entries, excluding
attachment copies. These are actual file counts for that failed run, not a
claim that the entire run passed. The corrected focused three tests passed
against real production CSP headers in 45.5 seconds, exit 0, one worker and no
retries; typecheck and targeted lint also passed. Port 4183 was released.
The replacement exact-head full Linux run remains required.

## Current handoff: 11 September 2026

### Issue 15: Stream S scoped acceptance passed; coordinator merge pending

Production browser servers now enforce the emitted strict self-only CSP.
The bounded scrollbar adapter fixes the demonstrated Reset inline-style block;
Radix retains focus and wheel/touch containment. A historical-case replay link
now wraps instead of overflowing on narrow screens with wider system-font
metrics. Lifecycle authority and the six outcomes are unchanged.

On Phase 1, check and 564 units passed, including four new scroll-lock tests.
Eight focused Chromium tests passed with no CSP violations, covering both-motion
modals, mobile navigation, menus/tooltips, simulation/sweep and a claim panel.
The initial full matrix was interrupted after concurrent build writes caused
two HTTP 500 responses. A clean retry stalled during shared-machine contention
and was stopped; neither interrupted run counts as passed or as a flaky test.

Completed Linux CI run `34629986842` on `1a103e3` verified the dedicated matrix:
183 browser tests, 247 unique unrestricted axe audits, zero axe violations and
183 unique CSP reports with zero violations. Counts were checked directly in
artifact `10277495935`, excluding attachment copies; no S failure-context file
or failed-test entry exists. All six phone packs and enlarged-text reflow passed.
The overall CI run was **not green**: 760 passed and 205 failed across 965 tests;
the remaining failures belong to the R-owned legacy root/focus regressions.
The healthy one-worker local duplicate was stopped once this completed,
exact-revision evidence was available; its partial results are not added.

Final AppShell Dismiss/Restore focus and Reset reduced-motion fixes were verified
on `32b5342`. The affected 40-test run returned 38 passed and two 30-second
timeouts in 15.1 minutes. Only those two existing tests were rechecked on the
same artifact, one worker and unchanged limits: both passed in 1.6 minutes.
The original failures remain recorded: B's manual-case flow and the 768px dark
header. The coordinator observed 100% host CPU; this is context, not a waiver
or proof of a product flake. No tests were weakened or quarantined.

All nine dedicated keyboard checks passed, including actual animation-name
assertions and tour focus restoration. Their seven unrestricted axe reports
and nine CSP reports contain zero violations. These are follow-up checks on
the final control revision, not additional unique matrix screens. The other
31 checks cover nine dead-control regressions, fourteen header width/theme
combinations, seven canonical case checks and one repeated-view crash test.
The dedicated inventory is now 185 tests; its 247 matrix audits are unchanged.

Final check and 557 units in 19 files passed. The subsequent main rebase is
documentation-only, with no change to the validated runtime or test source.
Port 4183 was confirmed released. Queue/pharmacy/claims chapter labels derive
from shared tour metadata, ready for T's eight-chapter update without duplicate
claims prose.
Tasks 8-13 remain unchecked; no full WCAG, manual screen-reader or hosted
acceptance is claimed.
Post-rebase check and 557 units in 19 files pass on main `b23e478`; the lower
count reflects main's seven removed budget tests. Playwright `--list` confirms
183 tests after removing accidental nested duplication of the phone matrix.
Already-built artifact diagnostics also enforce the header; only the explicitly
development-server configuration excludes the production-only acceptance spec.

Reproducible final commands from `BSA`:

```powershell
npm run check
npm test -- --reporter=dot
$env:PLAYWRIGHT_PORT = "4183"
npx playwright test accessibility-final.spec.ts controls.spec.ts tour.spec.ts routes.spec.ts case-presentation.spec.ts --config tests\e2e\production-artifact.config.ts --workers=1 --reporter=line --grep "accessibility-final.spec.ts.*keyboard|controls.spec.ts|tour.spec.ts.*tour header|routes.spec.ts.*all case views|case-presentation.spec.ts.*(manual trace and raw pack|D keeps)"
npx playwright test case-presentation.spec.ts tour.spec.ts --config tests\e2e\production-artifact.config.ts --workers=1 --reporter=line --grep "case-presentation.spec.ts.*EX-24112 manual trace|tour.spec.ts.*tour header 768 dark"
```

The completed Linux matrix used the default header-enforced CI command:
`npm run test:e2e -- --project=chromium --reporter=dot --grep-invert @quarantine`.
The dedicated equivalent is `npm run test:a11y -- --workers=1`.
Raw CI artifact, extracted counts, local first-run traces and unchanged recheck
logs are retained in the session artifacts. The PR includes a keyboard-focus
viewport screenshot; no new hosted-environment claim is made.

The latest policy overrides the older execution order below: Azure Static Web
Apps Free is the only host, every active browser configuration uses `/`, and
there are no size or performance budgets. Gzip, copy, Lighthouse and visual
metrics are informational only.
Tasks 8-13 remain unchecked until the R/S/V/D acceptance streams finish.
Provisioning is owner-run because no intended subscription or token is configured;
see DEPLOYMENT.md. Historical measurements below are retained as history only.

The work branch is `integration/tasks-8-13`, based on the completed core at
`79bd283`. Tasks 8-12 have implementation and tests in this checkpoint, but
remain unchecked until integrated acceptance is verified. Task 13 is incomplete.
This section supersedes historical pending-gate descriptions below.

| Task | Checkpoint contents | Still required |
| --- | --- | --- |
| 8 | Shared lifecycle model, seeding, transitions, revision handling and store tests | Verify all transitions, immutable history, snapshot validation and operator-only authority end to end |
| 9 | Pharmacy claims list, detail, filters and action panels | Verify every state, correction and confirmation in both Agent modes |
| 10 | Cross-side wiring, Follow banner and round-trip tests | Pass the full production round trip without skipped integration coverage |
| 11 | Claims tour stop and updated chapter navigation | Verify Next/Back and both-mode copy against the final route structure |
| 12 | Cross-side links, header and shared overlay repairs | Verify focus, menu dismissal, same-item links and all seven widths |
| 13 | Regression tests, accessibility checks, bundle experiments and generated screenshots | Complete production suite, axe, screenshot reconciliation, CI and hosted verification |

Fresh handoff validation: 557 unit tests in 19 files passed. Content checking
scanned 139 files without failures. Typecheck and lint passed. `npm run check`
exited 1 because the Vite build still enforces 200,000 gzip bytes; its output
was 201,179 bytes. The full production suite was not rerun in this handoff.
An earlier saved focused run passed 51 browser tests, not the complete suite.

### Next agent execution order

1. Apply the latest requested gate policy: 350,000 gzip bytes is advisory and
	exits zero. Update the build plugin, measurement script and corresponding
	tests consistently. Keep typecheck, lint, build correctness, unit tests,
	crash/control regressions and axe blocking. Record policy in DECISIONS.
2. Make word counts, Lighthouse and screenshot differences advisory without
	hiding functional defects or accessibility violations.
3. Reconcile this branch with current remote main and the parallel work. Keep
	both archive references intact. Review frozen-contract compatibility before
	resolving overlaps; do not discard integrated features or introduce a
	second lifecycle store.
4. Complete the production browser and axe suites under `/`. Fix actual
	product defects; document genuine flakiness and remaining limitations.
5. Reconcile the modified screenshots as candidate integration captures, not
	proof of acceptance. Update MEMORY, LEARNINGS and this checklist accurately.
6. Use only Azure Static Web Apps at the root path with the configuration
	fallback. The previous private-repository host was unavailable. This
	corrects the superseded hosting instruction from the earlier handoff.
7. Publish the integrated revision and confirm CI, Azure deployment, public
	Overview and deep links. Only then tick Tasks 8-13 and report final counts.

Original reference documents, machine-specific editor settings, dependencies,
credentials and local test logs are not part of this application checkpoint.
No hosted-agent assignment or deployment is claimed by committing this work.

## Historical gates and contract freeze

Task 7 owned-scope local verification is complete. Task 7 commit, CI, deployment
and hosted verification remain pending main-agent action. This tick does not
complete cross-stream integration or Tasks 8-13; all six remain unchecked.

Task 7 starts on stream-a-core at 36db32a. The user supplied Task 6 postcommit
check PASS, 488 units, 465 browsers, Azure deployment in 1m15s, sixteen hosted
passes and CI 34586563012 SUCCESS. These results supersede the Task 6 local-only
status below; no remote gate is independently repeated during Task 7.

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
The original Task 6 run was local-only. It is superseded by the user-supplied
postcommit gate at 36db32a: check PASS, 488 units, 465 browsers, Azure 1m15s,
16 hosted passes and CI 34586563012 SUCCESS. No remote checks are repeated here.
At that increment, Task 7+, frozen store, lifecycle types, case header,
navigation, shell and claims were untouched. Shared lifecycle and the manual
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

## Task 7 Stream A performance and verification

The user explicitly extended Stream A ownership to targeted shared performance:
root providers, font loading, bundle configuration and supporting presentation
imports. No lifecycle, frozen store, claims, route definitions, case header or
navigation features change. Tasks 8-13 remain with Streams B/C/D/E. The existing
Stream D planned-simulation notice remains visible, not hidden for this gate.

All routes remain eagerly imported. The final formatter build's complete emitted
payload is 199,651 gzip bytes for the production /BSA/ base, including JavaScript
186,624, CSS 12,623, HTML 404 and zero fonts. This uses decimal 200,000 bytes,
not 200 KiB. Headroom is only 349 bytes; later integrations must meet the same
strict gate or explicitly revisit the budget with the user.

Every Vite build, including check and the production browser server, counts all
emitted files independently with standard gzip, including any extra chunks,
fonts and public assets. Only the empty hosting marker is excluded. It rejects
200,000 exactly, incomplete scans and dynamic chunk imports. A browser test
also compares every emitted payload with served bytes. No asset is delayed,
preloaded behind a readiness wait or excluded because the first scene omits it.

### Measured experiments

The temporary Vite plugin records renderedLength by module and package outside
public output. These are pre-minifier module lengths, not additive gzip shares.
All rows below use the same conservative all-emitted accounting, including font
subsets the baseline scene did not necessarily request.

| Candidate | Total gzip bytes | Outcome |
| --- | ---: | --- |
| Current Task 6 build | 352,235 | Baseline; includes all five font subsets |
| No query provider, synchronous LazyMotion, system font, native replay | 248,001 | Safe intermediate, still over budget |
| Reachable-source CSS and Terser, two passes | 234,276 | Still over budget |
| Native CSS for the three simple effects, MotionConfig retained | 209,368 | Still over budget |
| Small decision-notification provider | 199,789 | Below budget before final minifier pass |
| Lightning CSS experiment | 201,081 | Rejected; hard build gate failed |
| Esbuild CSS and Terser, three safe passes | 199,771 | Initial payload candidate; later accessibility fixes required |
| Accepted accessibility and replay-copy corrections | 199,636 | Historical functional/payload PASS; original Lighthouse mobile 86 failed |
| Formatter reuse, final owned-scope candidate | 199,651 | LOCAL PASS; 503 units, 721 browsers, mobile median 91 |

No runtime explanations, domain predicates or source qualifications were removed
to reach the target. Production CSS scans the complete reachable local source
graph, including conditional UI, rather than docs, tests and unused UI templates.
Development still scans source normally. No blanket side-effect override or
unsafe minifier option is used. The generic 500 kB raw-chunk warning, which
suggested forbidden lazy routes, is replaced by the strict total gzip failure
and a separate 650 kB raw-chunk warning; final raw JS is 626,039 bytes.

The unused query provider is gone. Opacity, number fade and six-pixel entrance
use native CSS media queries; the shared two-second clocks and MotionConfig
remain. Replay uses a labelled native select with the same disabled states,
values and counterfactuals. The two decision messages use a small polite live
region with keyboard dismissal; notices persist until dismissed, replaced or
Reset, rather than depending on a toast engine or an automatic timeout.

### Historical functional verification before mobile continuation

Initial check passed and 494 units passed in fourteen files. The nine targeted
browser tests had eight passes and one failure: the new keyboard test pressed
ArrowDown after Home had already selected July, so it selected August. The
test now uses Home and Enter, retaining the exact July value and Sufficient
outcome assertions. Gate-failure injection, all four immediate-offline variants
and complete payload accounting passed in that run. Fault injection now parses
the production syntax and changes exactly one case's exact prescriber literal,
independent of minified variable names or field order. The actual gate is intact.

The original full run finished: 687 passed and 31 failed out of 718 in 12.6
minutes. Its original log and failed artifacts remain preserved. Thirty failures
were unrestricted axe matrix findings: white on amber-600 (3.19:1), muted text
on the Case D rose alert (4.31:1), unfocusable nested table scroll boxes and the
architecture flow. The remaining failure was aggregate recorded-replay prose;
the existing dirty correction removes redundant copy, retaining full clauses,
requirements and July/August/September outcomes without checker exemptions.

The scoped accessibility correction uses amber-700 badges and local
text-foreground on the two rose alert descriptions, not global muted tokens.
All seven Table call sites already have named, focusable outer scroll regions;
removing the inner scroll wrapper makes those regions actually scroll. The
trace-only workaround is now redundant and removed. The flow gains a named
focusable region. New light/dark phone tests verify actual ArrowRight scrolling
and table-region ownership. Existing notification focus and July fixes remain.
The first corrected targeted run passed 52 of 55 tests, including all 48
affected-page axe checks and notification tests. Two new scrolling checks found
the queue's screen-reader-only Actions header escaped its scroll container after
ArrowRight. A positioned outer region fixes that overflow. The other failure
expected an abbreviated replay label; the exact assertion now checks the full
existing label. All four focused scrolling/replay-copy checks then passed.

The next full run passed 718 of 721, with three stale exact gate-notice strings.
Only those expected words were aligned with the preserved concise FAIL notice;
gate predicates, no-recommendation counts and all withholding assertions remain
unchanged. All three full fault-injection regressions then passed. The final
fresh full run passed 721 of 721 in 12.1 minutes, exit 0, with no retries or
skips. Check and all 494 units in fourteen files exited 0 with no warnings.
Root-base check payload is 199,627 bytes; served /BSA/ payload is 199,636 bytes.

Final artifact counting reports 334 unique default-rule axe audits and zero
violations, including 248 matrix audits and two notification-state audits.
All 248 matrix photographs were generated; 272 Task 7 photographs include the
24 earlier font-comparison images. Selected Case C/D light desktop, Assumptions
light desktop and Architecture dark phone captures were visually reviewed.
The privacy regression checked four emitted files and three served assets
(702,501 raw bytes), with zero private matches. No command remains running.

The new matrix covers all 31 current destinations, both flag states,
both motion preferences, phone/dark and desktop/light. Each has unrestricted
default-rule axe and a current photograph. The existing four-width/two-theme
route suite, seven-width header, tooltip focus, 25-word copy, source/privacy and
canonical outcome regressions all pass. These functional results alone do not
complete Task 7: the original Lighthouse result below failed its mobile target.
No Task 7 CI, hosted or deployment claim is made.

Evidence: [before profile](../../.copilot-tracking/tasks/7/before.json),
[final profile](../../.copilot-tracking/tasks/7/final.json),
[profiler](../../.copilot-tracking/tasks/7/profile.mjs),
[initial targeted run](../../.copilot-tracking/tasks/7/focused.log),
[final check](../../.copilot-tracking/tasks/7/final-check.log) and
[screenshots](screens/task7/README.md).

Accepted evidence: [check](../../.copilot-tracking/tasks/7/accepted-check.log),
[units](../../.copilot-tracking/tasks/7/accepted-unit.log),
[full browser run](../../.copilot-tracking/tasks/7/accepted-browser.log),
[deduplicated audit](../../.copilot-tracking/tasks/7/accepted-verification.json).
Historical failures remain in the original final-browser/full-results paths,
corrected-targeted paths and verified-full paths. The first 218 matrix images
are archived separately under first-matrix-photos, not overwritten as evidence.

### Historical tooling verification and Lighthouse blocker

The named `npm run measure-budget` command is now included in `npm run check`.
It independently scans every emitted resource and fails missing HTML/CSS/JS or
totals greater than or equal to 200,000. Three CLI regression tests cover parity
with the build gate, extra binary payload and incomplete scans. Final /BSA/
check passed without warnings; all 497 units in fifteen files passed, exit 0.
The rebuilt assets retain the exact accepted names and sizes: JS 186,612,
CSS 12,623, HTML 401, fonts 0, total 199,636 gzip bytes, headroom 364.

CSS targets 93 reachable local modules, including 18 of the 45 vendored UI
components. The other 27 templates are not runtime dependencies. Baseline
renderedLength identified motion-dom 290,871, framer-motion 91,037, Sonner
68,153, Radix Select 50,688 and query-core 49,497 pre-minifier bytes. This is
evidence of specific retained dependencies, not proof the entire Radix barrel
was retained. Per-module rendered lengths are not additive gzip savings.

Lighthouse 13.4.1 was installed in the npx cache, not app dependencies. Its
first browser-launch attempt exited 1 with Windows EPERM during temporary
profile cleanup and produced no report. Connecting the actual CLI to the
installed Playwright Chromium over a local debugging port completed both
audits, exit 0, no runtime errors or report warnings. Error reporting was off.
These are cold navigation audits of default-Off Overview on the local /BSA/
production preview, using standard simulated mobile and desktop presets.

| Preset | Performance | Accessibility | FCP / LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mobile | 86 | 100 | 1,933 ms / 1,933 ms | 472.5 ms | 0 |
| Desktop | 100 | 100 | 436 ms / 436 ms | 37.5 ms | 0 |

The mobile performance requirement of at least 90 was not met in this run. The mobile report
attributes 658.9 ms to script evaluation and 303.6 ms to style/layout; its largest
bundle task is 429 ms. Unused-script estimates describe eager offline code, not
permission to defer routes. No altered throttling, best-of-repeat score, hidden
readiness wait or frozen-store change is used to manufacture a passing result.
Task 7 remained unchecked at this point. Print, favicon and metadata additions are not needed
for this scoped performance work and were not introduced.

Automated Task 3-6 captures now use ignored Playwright output paths rather than
overwriting historical screenshots. All 36 affected production tests passed in
56.5 seconds, exit 0; SHA-256 comparison found all 36 historical images unchanged.
The full 721-test accepted run remains the functional baseline; no runtime code
changed afterward, and only the 36 screenshot-output tests needed repeating.
The Task 7 after directory is ignored; twelve explicitly selected captures cover
all six case packs, desktop/light/On and phone/dark/Off, and were visually reviewed.

Evidence: [final tooling check](../../.copilot-tracking/tasks/7/tooling-check.log),
[497 units](../../.copilot-tracking/tasks/7/tooling-unit.log),
[screenshot isolation](../../.copilot-tracking/tasks/7/screenshot-output-verification.json),
[mobile Lighthouse](../../.copilot-tracking/tasks/7/lighthouse-mobile.json),
[desktop Lighthouse](../../.copilot-tracking/tasks/7/lighthouse-desktop.json).
Both audit processes and the local preview were stopped after completion.
No Git, account, deployment, source-document or editor-settings changes occurred.

## Task 7 final owned-scope local verification

The formatter-only candidate passes check without warnings and all 503 units in
sixteen files. All 58 targeted calculator, pipeline and immediate-offline browser
tests pass in 1.6 minutes. The authoritative latest production /BSA/ Chromium
log ends with 721 passed in 10.2 minutes; the last-run report is passed with no
failed tests. No failures, skips or retries are reported. Task 7 is ticked only
for its owned Stream A local scope, not full integration or remote acceptance.

The fresh recount excludes JSON attachment copies: 334 unique default-rule axe
audits, zero violations, including 250 Task 7 audits (248 route-matrix and two
notification states). Eight copy-report files are retained. All 248 matrix
screenshots exist. The screenshot index retains 124 hash-verified copies of all
31 destinations, both flags, desktop/light and phone/dark in reduced motion.
These copies are not extra audits or extra unique captures. The Task 7 screenshot
tree contains 408 PNG files: 248 matrix, 24 earlier font comparisons, twelve
earlier selected case packs and 124 new selected copies. The eight formatter
comparison pairs live separately under tracking and remain byte-identical.

The original mobile report's dominant failing metric is TBT (472.5 ms, score
0.60, 30% performance weight), not LCP (1,933.07 ms, score 0.98) or CLS (zero).
Script evaluation is 658.916 ms, style/layout 303.644 ms, rendering 63.612 ms
and parsing/compilation 9.232 ms. The largest simulated bundle task is 429 ms.
The LCP is the unchanged chapter narrative paragraph at y=339..435 on the
412px phone. Its observed render-delay breakdown (534.217 ms) is not the same
quantity as simulated LCP. The critical network chain is HTML to eager JS,
274 ms observed; CSS completes in 101 ms and has an estimated 150 ms blocking
saving. There are no font requests, external chains or forced-reflow findings.

Actual source inspection finds one Overview baseline selector call, one
AssistanceTransition and no QueryClient provider. Tooltip providers serve the
header and main content separately; neither computes the baseline. The DOM has
151 elements, not an unbounded above/below-viewport list. Fresh trace attribution
places the longest bundle callback in React Scheduler: 85.534 ms observed on the
unchanged build, 87.627 ms on candidate run one. This is a render-work attribution,
not evidence of duplicate providers. No content-visibility, lazy route, readiness
delay, hidden control or fabricated LCP was added.

The only new runtime change reuses Intl.NumberFormat by requested precision in
formatBaselineNumber. It caches locale setup, never arithmetic or scenario
results. Six tests check UK formatting parity, default precision, invalid
precision and formatter construction count. Initial units had 502 passes and
one constructor-spy failure; forwarding the spy to the genuine constructor
fixed the test without changing production behaviour. All 503 then passed.

The complete /BSA/ payload is 199,651 gzip bytes: JS 186,624, CSS 12,623, HTML
404 and fonts zero. Headroom is 349 bytes under the unchanged strict limit.
All routes remain eager and the four immediate-offline variants pass.

Three consecutive candidate audits use actual Lighthouse CLI 13.4.1, fresh
Playwright Chromium per run, normal cache reset and exactly the original
configSettings (asserted by deep equality). Mobile remains 412x823 at DPR 1.75,
150 ms RTT, 1,638.4 Kbps and 4x simulated CPU. No audit is skipped. Reports,
logs and raw traces are retained for every run; desktop follows the three
mobile replicates. All four exit 0, with no report warnings or runtime errors.

| Run | Performance | Accessibility | FCP / LCP / Speed Index ms | TBT ms | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mobile 1 | 91 | 100 | 1,858.262 | 338.5 | 0 |
| Mobile 2 | 91 | 100 | 1,807.348 | 329 | 0 |
| Mobile 3 | 90 | 100 | 1,804.240 | 370 | 0 |
| Mobile median | 91 | 100 | 1,807.348 | 338.5 | 0 |
| Desktop | 100 | 100 | 404.510 | 45 | 0 |

Medians are computed separately per metric, not selected from the best run.
The unchanged baseline also scored 93/100 on a fresh run (TBT 278.5 ms).
Therefore the 86-to-91 comparison does not prove a causal speed-up: host and
run variance are material. The candidate meets the requested three-run median
threshold and demonstrably avoids repeated formatter construction; no guaranteed
five-point improvement or universally stable Lighthouse score is claimed.

Eight Overview pairs cover 360/1440px, both themes and flags. Initial immediate
captures differed in two desktop switch-transition frames. Those originals are
retained. Awaiting only the existing switch animation for screenshot comparison
produced eight byte-identical PNG pairs. That wait is absent from Lighthouse and
offline tests. No app styling changed and no historical screenshots were edited.

Evidence: [candidate audit summary](../../.copilot-tracking/tasks/7/mobile-format/lighthouse/summary.json),
[fresh unchanged baseline](../../.copilot-tracking/tasks/7/mobile-baseline/lighthouse/summary.json),
[trace attribution](../../.copilot-tracking/tasks/7/mobile-trace-diagnosis.json),
[strict check](../../.copilot-tracking/tasks/7/mobile-final-check.log),
[503 units](../../.copilot-tracking/tasks/7/mobile-unit-fixed.log),
[721 full browsers](../../.copilot-tracking/tasks/7/mobile-full-browser.log),
[deduplicated final audit](../../.copilot-tracking/tasks/7/mobile-verification.json),
[58 targeted browsers](../../.copilot-tracking/tasks/7/mobile-targeted.log) and
[eight visual pairs](../../.copilot-tracking/tasks/7/mobile-format/visual-settled-comparison/summary.json).

This closeout changes documentation and evidence only, copying existing matrix
images without rerunning tests or altering application sources. No Git, accounts,
deployment, source-document, lifecycle, claims or navigation feature changes
occurred. Task 7 CI and hosted verification are pending main-agent action.
Tasks 8-13 remain unchecked and require their owners' integration verification.

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
the former private-repository host returned HTTP 422. These historical local tests used the /BSA/ production base;
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

## Issue 28: Queue Compare control

Implemented the missing explicit toolbar Compare action as a read-only inline
Today versus With agent region. It reuses current scenario inputs, monthly
denominators and the shared day projection; no domain or simulation mutations.
Keyboard heading focus, Close/Escape restoration, revision-safe Reset and
invalid-input disabling are included. Existing queue simulations are unchanged.

Check and 563 unit tests pass, including ten new comparison tests. Eight new
focused browser tests cover keyboard/open/close/focus, both assistance states,
edited scenario/time parity, unchanged records and counters, continued playback,
Reset/invalid inputs, reduced motion, responsive layout and axe. Their execution
awaits the coordinator's browser slot. Integration and Tasks 8-13 remain pending.

Coordinator copy review shortened the comparison to one 20-word paragraph and
the caption "Assumed day projections". Cohort fields, manual handling and all
no-write/state assertions are unchanged; only exact-copy expectations changed.

Coordinator-accepted browser evidence: CI 34635510262 at exact source 6d34988
executed 790 tests, with 563 passed and 227 failed, none skipped or unrun.
All eight named Compare tests are in the executed manifest and none are in
the complete failed set. Artifact 10278127926 supplies all four named Compare
axe JSONs with zero violations and their screenshots. This is scoped acceptance,
not a full-CI pass.

Local acceptance retained separately: the first standard-config attempt built
the artifact but timed out starting preview, executing zero tests. The existing
artifact-config retry finished three passed and five timeouts, including two
page-setup timeouts and one axe timeout. Its anomalous 14.4-hour elapsed report
is retained, not normalised into a successful local run. Port 4173 was released.

Rebased onto integrated main 22ec345, preserving S's production CSP server and
both streams' appended records. Combined check and all 567 units in 20 files
pass. No Compare source or assertion changes accompanied the rebase. Final
integrated Linux browser acceptance remains the coordinator's gate.

Final coordinator-released rebase onto c95ff1d includes merged pharmacy status
and tour changes. All streams' appended records and the exact tested Compare
source/specs are preserved. Combined check and all 577 units in 20 files pass.
No additional browser run; the coordinator retains merge and full integration.

## Issue 41: contrast throughout route entrance

The failure in CI `34693827974` on PR #40 `dc95e5b` was genuine intermediate
contrast: 1,021 passed / one failed, with 21 contrast-failing nodes beneath the
opacity-animated route wrapper. It is not quarantined and is not a colour-token
or CSP failure.

Before source edits, WAAPI-held production frames on runtime-equivalent main
`8e49884` measured 75 ms opacity 0.839245, intro `#8a8a8a` on white at 3.45:1
and 21 failing nodes. At 135 ms, eight panel labels still failed. At the
150 ms endpoint, opacity 1 produced `#737373`, 4.74:1 and zero violations.
Original artifact `10297534573`, the failed screenshot/trace and the baseline
three frame audits are retained in S's session evidence.

The runtime fix removes only `motion-safe:fade-in` from AppShell's route
wrapper, preserving the 6 px slide, 150 ms timing, reduced motion and focus.
The new regression samples real paused CSS animation at 0, 75, 135 and 150 ms
across light/dark, Agent Off/On and normal/reduced motion, plus the claims
midpoint before Follow navigation. It asserts opacity 1, original transform
and timing semantics, all axe rules, real hosting headers and no CSP errors.

Local validation on the fixed artifact:

| Check | Actual result |
| --- | --- |
| `npm run check` | Passed |
| `npm test -- --reporter=dot` | 607 passed, 22 files |
| New independently timed frame regression | 32 passed in 6.4 minutes; 40 unrestricted axe reports, zero violations; 32 CSP reports, zero violations |
| Original Follow variants, keyboard/menu/tour-focus and repeated case navigation | 12 passed in 2.7 minutes; 17 axe reports and 11 CSP reports, zero violations |
| Fixed midpoint effective intro | Light `#737373` / white 4.74:1; dark `#a1a1a1` / `#0a0a0a` 7.66:1 |

All counts exclude attachment copies. The earlier development version grouped
five axe scans per test and exhausted the unchanged 30-second deadline; its
interrupted log is retained, not counted as passing. Independent frame cases
keep that deadline, without sleeps, quarantine or weakened contrast assertions.
The optional dev-server configuration excludes this production-header-only
spec; default CI and production-artifact diagnostics include all 32 cases.

Commands from `BSA`, after the production build:

```powershell
$env:PLAYWRIGHT_PORT = "4183"
npx playwright test route-transition-contrast.spec.ts --config tests\e2e\production-artifact.config.ts --workers=1 --reporter=line
npx playwright test accessibility-final.spec.ts routes.spec.ts --config tests\e2e\production-artifact.config.ts --workers=1 --reporter=line --grep "axe claim detail and Follow banner|keyboard navigation, menus|tour dismissal and restoration|all case views can be revisited"
```

Port 4183 was confirmed released. Full PR CI and R's post-integration rerun
remain separate gates; no fresh full-suite or hosted acceptance is claimed here.