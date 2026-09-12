---
title: Implementation learnings
description: Append-only dated findings, repairs and verification evidence.
ms.date: 2026-09-10
---

## 2026-09-11: Issue 27 count-in isolation

The scene's previous AnimatedNumber only faded a final string. A scene-local
frame controller can interpolate the existing derived value without changing
the shared formatter, calculator or store. Check media state inside each frame
as well as on preference-change events to avoid one stale moving frame.

This worktree initially lacked TypeScript, so the first check stopped with
`tsc` not found. Restoring the existing lockfile with npm ci added no dependency
or manifest change. The subsequent check passed and 565 units passed with two
workers, including twelve count-in cases. Browser acceptance awaits the
coordinator's resource slot; unit interpolation is not browser evidence.

The eventual browser accessibility snapshot includes the `dd` definition role
around the named final-value image. Correct the exact expected tree rather than
removing that meaningful semantic wrapper. All six scene tests passed after
this test-only correction, with two zero-violation axe reports. The unchanged
calculator compatibility test passed both before and after one retained
thirty-second timeout in a combined run. No timeout was relaxed.

Two startup attempts timed out while rebuilding under machine contention,
before any browser test. Completing the production build separately and using
preview-only session configuration removed the startup-timeout coupling.
Keep the failed startup logs separate from actual assertion results and never
report split successful evidence as one clean seven-test run.

## 2026-09-11: Budget removal and acceptance evidence

The latest user direction removes byte budgets completely, including the
measurement plugin/command and their seven unit tests. Check passes with no
compressed-size or chunk warnings; all 553 retained units pass in 18 files
with two workers. This count reduction is deliberate removal of budget-only
tests, not lost application coverage. The payload-only browser test is removed;
route/crash/control/offline and six-outcome checks remain.

The hosting provider documents three concurrent previews on Free, not unlimited
previews. GitHub Actions permissions are enabled, and billing/storage usage is
readable, but neither establishes unlimited entitlement. Best-effort failed-run
artifacts and superseded-run cancellation reduce avoidable resource pressure
without altering account billing or deleting existing evidence.

## 2026-09-11: Root hosting migration preparation

The git root contains a nested BSA application. Hosting workflow paths must use
BSA/dist while infrastructure and the authoritative route configuration live
at git root. Vite explicitly copies that configuration for every build.
The first local check failed because this new worktree lacked TypeScript;
npm ci restored the locked dependencies. This was not an application failure.

GitHub access allows repository writes, but no deployment secret exists.
Azure discovery has no selected subscription and the local Azure CLI is absent.
The exact owner-run commands are in DEPLOYMENT.md. A generated template or
successful Vite preview is not evidence of an Azure resource or hosted CSP pass.

## 2026-09-11: Integrated workflow handoff

Tasks 1-7 form the verified core. Branch `integration/tasks-8-13` now preserves
the unfinished shared lifecycle, pharmacy claims, Follow banner, round-trip
wiring, tour/navigation and regression tests. Fresh validation passed 557 units,
typecheck, lint and content checks. The build still fails its old 200,000-byte
hard cap at 201,179 gzip bytes. The requested 350,000-byte advisory policy and
the then-requested hosting migration are not implemented. Start with those gate-policy changes,
then run the complete production browser and axe suites. Earlier focused browser
passes do not prove integrated acceptance. Reconcile candidate screenshots,
check frozen contracts against main, and confirm deployment before ticking
Tasks 8-13. Keep both archives untouched. Source documents and local settings
are excluded from the checkpoint. No cloud-agent assignment is implied.

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

## 2026-09-11: Lighthouse and screenshot-output verification closeout

The functional gate did not include Lighthouse and could not establish complete
Task 7 acceptance. The actual 13.4.1 CLI measured mobile 86 performance/100
accessibility and desktop 100/100. Mobile script evaluation was 658.9 ms and
style/layout 303.6 ms, with TBT 472.5 ms. Keep Task 7 open; a passing total-byte
budget and zero axe findings are separate from load-time performance.

The first Lighthouse launch failed with Windows EPERM while deleting its profile;
no report existed. Connecting to a separately launched Playwright Chromium port
avoided that cleanup path and both actual CLI runs exited 0. No score is inferred
from the failed attempt. Use explicit nested-app working directories: new async
terminals start at the repository root, not the previous terminal's directory.

Historical Task 3-6 tests still wrote directly into documentation screenshot
folders. Redirecting only capture paths to testInfo.outputPath preserved every
assertion. All 36 affected browsers passed; before/after SHA-256 comparison kept
all 36 historical images identical. The Task 7 generated matrix is now ignored,
with twelve reviewed case images copied into a separate selected folder.
New budget-command tests raised the unit total to 497; final check retained
199,636 gzip bytes and the exact accepted production assets.

## 2026-09-11: Distinguish sampling, simulation and repeat variance

Lighthouse's simulated long task and the corresponding observed trace callback
are different quantities. The original report has a 429 ms simulated bundle
task; fresh baseline trace locates an 85.534 ms observed React Scheduler callback.
Do not label the entire callback a duplicated baseline computation. Overview
has one scenario selector; its other tooltip providers do not calculate data.

Number.toLocaleString with options repeatedly constructs locale formatting
machinery. Reusing Intl.NumberFormat preserves UK rounding and grouping while
avoiding repeated construction. Vitest's constructor spy needed an explicit
implementation forwarding to the genuine Intl constructor; otherwise its
constructed object lacked format. The initial one-test failure is retained.

Three candidate mobile scores of 91/91/90 meet the median criterion, but a
fresh unchanged baseline score of 93 exposes material environmental variance.
Keep original 86, baseline 93 and every candidate result visible; report
threshold attainment separately from a causal performance improvement claim.

Two initial desktop screenshot pairs differed only during the existing switch
colour transition. Waiting for that control's animation completion, without
disabling animations or masking pixels, yielded eight byte-identical pairs.
Screenshot stabilisation must stay separate from cold load and offline audits.

## 2026-09-11: Final evidence counts and local acceptance boundaries

Read the completed raw log and last-run status before closing a gate. The latest
run is 721 passed in 10.2 minutes, not the earlier 12.1-minute run. Final units
are 503 in sixteen files, not the historical 497. Check reports 199,651 gzip
bytes with 349 bytes of headroom. No rerun is needed for a docs-only closeout.

Count axe-core JSON outputs once, excluding attachment directories: 334 audits,
zero violations, including 248 route-matrix and two notification-state audits.
Distinguish unique screenshots from retained copies: 248 matrix images, 24 font
comparisons, twelve earlier selections and 124 new hash-matched selections make
408 PNG files in the Task 7 screenshot tree, not 408 independent test captures.
The formatter's eight comparison pairs remain in a separate tracking directory.

A delegated summary claimed an absent report and incorrect image totals. Direct
file checks and the existing audit script established the counts above. Report
artifact-backed facts, not an unverified execution summary.

User permission covered targeted shared performance, not cross-stream features.
Local acceptance does not imply CI, hosting or Tasks 8-13 integration. Preserve
the historical mobile 86 and fresh unchanged baseline 93 alongside final median
91; threshold attainment is not proof of a causal five-point improvement.

## 2026-09-11: Header-enforced accessibility exposes blocked modal CSS

Vite preview does not apply `staticwebapp.config.json`. The initial real-header
Reset test had zero axe violations but one `style-src-elem: inline` violation
and a matching browser console error. Passing axe alone missed the broken
scrollbar stylesheet. Check actual response headers, CSP events, console errors,
modal scroll compensation and cleanup together.

React's individual CSSOM style assignments, including dynamic positions, are
not the same as injecting a style element or setting a raw style attribute under
CSP. Preserve working dynamic geometry; replace the demonstrated stylesheet
injection rather than removing focus/scroll containment or weakening policy.

Radix menu keys update focus asynchronously. Wait for the expected menu item
and destination heading to receive focus before issuing the next keyboard
action. An initial unsynchronised test activated the previous item; another
timed out. Agent Off trace has no replay controls, so audit its evidence view
without attempting the On-only Show all action. Two workers and a 60-second
audit timeout accommodate this shared machine without disabling axe rules.

Do not build and run a production-server audit concurrently against the same
dist directory: Vite clears it during rebuild and requests can observe missing
files. The first full run hit two HTTP 500 responses from this orchestration
mistake. After stopping it, the clean retry and even a one-page probe stalled
while another stream ran hundreds of browsers. Retain the partial log and
serialise heavyweight validation; keep source work parallel. Neither interrupted
run is an acceptance result or evidence warranting a quarantine tag.

System-font metrics make narrow-layout defects platform dependent. The historical
replay link used a non-wrapping, fixed-height button, appearing only on A/B/C/E/F.
Windows fit it at 16px root text but overflowed by 17px at 18px; Linux CI reported
5px at the standard size. Bound and wrap the control, then verify its full label,
keyboard destination and page reflow rather than hiding horizontal overflow.

Check Playwright's actual `--list` inventory before quoting a planned count.
The phone reflow loop was accidentally nested inside the eight desktop variants,
yielding 351 tests instead of 183. Moving it to top level removes redundant
executions without removing any unique screen/mode/motion combination.

The completed Linux artifact supplied exact-revision evidence while local
validation was CPU-constrained: 247 unique axe JSONs, zero violations, 183 unique
CSP JSONs, zero violations and no S failure contexts. The whole run still failed
205 other regressions; never promote scoped acceptance into a full-CI pass.

Axe does not verify where focus goes when its invoker unmounts, or whether a
reduced-motion preference actually suppresses CSS animation. Add observable
keyboard/focus and computed-animation assertions. Preserve the established
initial tour-heading focus contract; the skip-link test must navigate to the
link by keyboard from that state rather than assume the first Tab starts at body.

Final affected acceptance was 38 passed / two overall-test timeouts, followed by
two unchanged isolated passes. Keep those separate results, not a fabricated
single-run 40/40 claim. The timed-out B case and 768px dark header passed without
source changes, assertion changes or longer limits. Retain the initial traces
and the host-saturation observation without declaring an unproven product flake.

All final dedicated keyboard cases passed, including computed `animationName`
of `none` under reduced motion and `enter` under normal motion, modal
containment/cleanup, and focus after Dismiss/Restore tour. The seven final axe
audits and nine final CSP reports are rechecks, not new unique matrix surfaces.

## 2026-09-11: Issue 20 manual pharmacy status

The workbench used one !enabled branch for both deliberate Off and unavailable
assistance. R reproduced complete A showing "Agent unable to determine" in
both states with submission enabled. Existing pharmacy matrix assertions
encoded that label, so a passing test did not establish a healthy Today view.

Separate display branches retain the existing check and submission data paths.
The A/B/D matrix now expects neutral Off wording; three focused regressions
exercise availability, Off/On/Off, actual results and immutable unchecked
receipts. Browser execution awaits the coordinator's shared-machine slot;
no overlapping browser process has been started.

On main 8c05b18 plus this display-only change, npm run check passes with no
warnings and the full Vitest run passes 553 tests in 18 files. No new unit
helper or domain behaviour was needed for a presentation-only distinction.

## 2026-09-11: Issue 20 cross-suite status expectations

CI 34629999025 on f95ae88 passed check and 553 units, but its complete browser
run failed: 547 passed and 238 failed in 25.7 minutes. Eleven failures directly
exposed incomplete label migration: nine Off/unavailable assistance matrix
states, one global/local availability regression and one advisory-control test.
Their status locators filtered by the old three possible strings, so the new
neutral status disappeared from the locator before the stale assertion ran.
These are deterministic expectation mismatches, not quarantined flakes.

With coordinator approval, use the existing data-pharmacy-status target and
explicitly distinguish Off from unavailable in assistance.spec.ts and the two
approved controls.spec.ts locations. Preserve real On unreadable expectations,
all control/receipt checks and every other test. Typecheck and lint pass after
these test-only edits. The expanded selector lists 29 tests across pharmacy,
assistance and controls; no local browsers started without the shared slot.
The dot CI log does not identify individual passes, so it does not independently
establish that the original 15-test selector passed. Retain the failed run and
obtain explicit focused results rather than inferring success from omission.

## 2026-09-11: Issue 20 first focused browser result

Coordinator granted one worker on isolated port 4193. The unchanged production
configuration, with only port and artifact destination overridden in an ignored
temporary config, ran the 29-test selector on 5ec240a: 26 passed, three failed,
exit 1 in 20.2 minutes. All three new Issue20 transition tests passed.
The failures were complete A Off/local available timing out on the global
switch click, D Off/light timing out during axe analysis, and B On/light
timing out on initial navigation. No status-text assertion failed.

Retain issue20-focused-29.log and all three traces in session artifacts. Trace
inspection found no error-like browser events; slow setup/teardown alone does
not prove a flake or excuse the failed tests. The owned preview stopped and
port 4193 had no remaining listener. Do not mark the PR ready until these
failures are resolved or the coordinator accepts explicit further evidence.

## 2026-09-11: Issue 20 exact failure rerun and bounded quarantine

One coordinator-authorised rerun of exactly the three failed instances passed
3/3, exit 0 in 2.8 minutes, with unchanged application, assertions and timeouts.
Retain the first 26/29 outcome and separate rerun; do not claim a single-run
29/29 pass. The first run produced ten unique axe reports with zero violations;
the retry produced two more zero-violation reports for the unfinished captures.
Port 4193 was confirmed released after each run; R's port was untouched.

Coordinator-reported CPU saturation and the exact unchanged rerun support a
bounded timing-flakiness follow-up, not an assertion that every failure was
environmental. Issue #34 tracks investigation and removal criteria. Apply
@quarantine only to assistance complete-A/global-Off/local-available and the
pharmacy D-Off/light and B-On/light matrix instances. All three new Issue20
guards and the other 23 focused cases remain blocking; no assertion is removed.

## 2026-09-11: Issue 26 chapter split integration surfaces

The old tour had eight stops but only seven chapters. Pipeline and case cards
shared one home branch, and canonical narrative metadata omitted calculator
and queue chapters. Chapter count alone therefore did not establish independent
chapter content. Tests now pin the exact nine-stop route/label sequence and
the complete eight-entry narrative mapping.

Moving the pipeline also requires updating pipeline and calculator browser
destinations, not Four cases destinations. Shell chapter labels/prose and
existing tour expectations are coordinated with their separate owners.
The fresh worktree initially lacked tsc; npm ci restored locked dependencies.
No local browser is started before the coordinator grants a resource slot.

An explanatory referral guide may also be visible for a rules-cleared claim.
Scope its human-decision requirement to referred items rather than implying
that Case E requires an operator. Server-rendering against frozen lifecycle
inputs verifies that every state label remains unchanged in both modes and
that an unknown claim never acquires an invented status or action link.

The first selected browser run's pipeline timeout never left about:blank:
newPage took 6.1 seconds and browser cleanup took 161.8 seconds. A separate
mobile failure timed out creating the page, before application assertions.
Do not relabel those failures as passes because the server returns HTTP 200.
Both passed the unchanged-bound retry; first-run logs and traces are retained.

After keyboard chapter selection, assert the new route heading owns focus and
the menu has closed before activating another control. The Off test initially
pressed Dismiss while the shell was still moving focus to the claims heading.
Keep keyboard activation and the missing-rail assertion, not a sleep or retry
loop. Splitting chapters also means pipeline tests must navigate to Four cases
before asserting the actual Case D card; neither assertion should be removed.

## 2026-09-11: Issue 28 comparison evidence

Existing side-by-side day columns do not provide an operable Compare action.
A native-button disclosure adds that action without modal focus trapping,
inline styles, animation or new scroll-lock machinery under the self-only CSP.
The shared clock continues while the disclosure is open; the comparison must
read that clock rather than capture a misleading frozen or restarted snapshot.

The fresh worktree lacked dependencies: the first check stopped at missing tsc.
Restoring the unchanged lockfile with npm ci allowed check and all 563 units
to pass, including ten new comparison presentation tests. Browser acceptance
is separately scheduled with the coordinator; no browser pass is implied here.

The later completed exact-head Linux run provides scoped browser evidence:
790 scheduled tests equal 563 passed plus 227 failed, with no skipped/unrun
tests. All eight Compare tests are present in the source manifest and absent
from the complete failed set; four named axe artifacts each contain zero
violations. The coordinator accepted this complete accounting, not absence
from a failure list alone. Do not label the overall CI run successful.

Keep the local zero-test startup timeout and subsequent three passes/five
timeouts separately, including anomalous elapsed timing. Never weaken assertions
or repeat a CPU-bound local run solely to duplicate exact-source remote proof.

## 2026-09-12: Account transfer checkpoint

All eight stream branches were checkpointed and pushed. R's exact corrected-head
full local acceptance was interrupted for transfer after announcing 1,019 tests
and two workers, with no completed counts or final exit in its retained log.
Its earlier Linux result was 1,016 passed/three stale chapter assertions, then
all three corrected tests passed; replacement CI was refused before execution
by an account billing/spending restriction. V's 103 initial images are committed;
the prepared final 107-image matrix has not run. D completed readiness only.

HANDOVER, SCOPE, MEMORY and the current PROGRESS table distinguish merged
implementation, scoped evidence and incomplete final acceptance. Compact logs
and summaries are preserved in Git rather than relying only on session paths.
No feature PR, protected archive reference or account ownership changed during
the freeze.

## 2026-09-12: Transfer cancelled; public Actions resumption

The owner cancelled the transfer because Enterprise Managed Users cannot join
or own this external repository. WilliamNg18 remains owner; Actions capacity
and billing belong to that repository owner. Public visibility was independently
confirmed through the GitHub API. The checkpoint and eight stream tags remain.

A local read-only hygiene scan covered 509 reachable commits, 1,403 unique
blobs and 742 tracked/pending files. No actionable credential was identified.
Extracted reference material was flagged for publication review; the owner
explicitly approved it as non-sensitive/public. It was not removed or rewritten.
Secret scanning and push protection were then enabled and verified. The token
rotation recommendation is precautionary, not a claim of a discovered leak.

The owner authorised resumption from HANDOVER. Historical interrupted and
failed runs remain failures; public visibility alone is not proof that a new
Actions run or Azure deployment has succeeded.

## 2026-09-11: Stream R root assertions and round-trip history

Changing the production base URL did not update escaped regular expressions or
bare prefix arithmetic. The deep-link matrix still required /^\/BSA\//, tour
stop comparisons prepended /BSA, and same-task keyboard history sliced four
characters from every pathname. These obsolete test assumptions are corrected
to exact root destinations without relaxing navigation or crash checks.

The new worktree's initial check exited 1 because tsc was absent; dependency
restoration followed that missing-tool failure. Subsequent check passed and the
bounded full unit run passed 560 tests in 20 files, exit 0. Full production
browser results are recorded in progress only after actual completion.

The mixed-mode round trip includes a seeded attempt plus three user submissions:
blind Off, unaided Off resubmission and corrected On resubmission. Assert four
immutable attempts rather than confusing the seed with a user submission.
Retain the blind snapshot exactly and require explicit human acceptance after
the corrected recommendation; scripted advice is not a lifecycle transition.

## 2026-09-11: Unapproved reason exposure on both pharmacy surfaces

A real Chromium probe of the unchanged Phase 1 production artifact reproduced
issue #19 on seeded EX-24112. Agent On displayed "Endorsement initialled but not
dated." beside "No operator-approved draft." The same raw reason also appeared
in expanded lifecycle history. Correcting only the current response would leave
the second exposure intact.

The repair gates the human reason to Off pharmacy or either NHSBSA mode, while
actual approved drafts retain their label in On pharmacy history and response.
Eight new browser regressions cover seeded B/C and newly recorded manual,
unapproved assisted and approved assisted responses. They compare unchanged
history and attempts across Off -> On -> Off and verify NHSBSA still sees the
original reason. Validation results belong in progress after execution.

## 2026-09-11: Usable manual controls did not explain blind resubmission

The existing textarea and Resubmit claim proved that Off could submit, but the
single "Manual correction" sentence did not expose the missing-check comparison.
Issue #29 adds that explanation without treating manual work as broken.

Reuse the revision-safe result already held by ClaimDetail. Its text equality
guard and edit invalidation prevent stale Ready from resolving the new marker;
approval is independently required. Four new keyboard/axe browser cases cover
phone-dark and desktop-light Off/On, tooltip Escape/focus, immutable mode flips,
unchecked Off snapshots, approved correction and edit invalidation.

## 2026-09-11: Initial focus contract and interrupted obsolete baseline

The root route test assumed the first Tab would focus the skip link. AppShell
intentionally focuses the tour heading on direct entry, a behaviour covered by
the existing tour tests. Preserve that contract: await heading focus, traverse
backwards with a bounded number of real Shift+Tab keys, assert the visible skip
link is focused, then Enter must focus main. Do not replace the keyboard path
with programmatic skip-link focus or weaken the destination assertion.

The coordinator interrupted the obsolete seven-chapter full run after more
than 80 minutes of shared-machine contention. Its retained reporter output has
629 pass dots, ten timeout markers and one failure, not a completed 783-test
summary. Later failure artifacts can exist beyond buffered reporter output;
neither artifact count nor partial dots establish complete acceptance.
No timeout is classified as flaky without a controlled reproduction/repeat.
The new eight-chapter integrated artifact still requires a full production run.

## 2026-09-11: Snapshot the destination after navigation, not the outgoing page

Both Linux CI runs at 2f398b5 exposed the new desktop comparison test reading
the outgoing NHSBSA history immediately after clicking View pharmacy claim.
It saved "Referred back" before the pharmacy route committed, then compared
that with the correct pharmacy label later. Await the exact destination heading
and pharmacy status before capturing history. Keep every immutable-history and
state assertion; do not relax the expected label or add sleeps/retries.

## 2026-09-12: Split-chapter assertions must follow their actual surface

The final assembled CI exposed three remaining obsolete assertions, not an
application failure: two pipeline tests still searched for canonical Case D on
the now-separate pipeline chapter, and a keyboard test used its former heading.
Keep every kernel phase/gathering/referral clock check on /#pipeline, then visit
/#cases and replay the same Off-to-On clock to check D's marker at every phase,
plus its final ABSTAIN and NOT RUN. Do not navigate away during the kernel loop.
The focused three-test strict-header rerun passed without retries or new limits.

## 2026-09-11: Stream V exact-click and capture evidence

Read the rendered navigation adapter as well as routes.tsx: the queue menu item
is NHSBSA queue, even though the route metadata uses Exception queue.
The integrated tour has seven chapters/eight stops, including pharmacy claims.
Reset restores Agent Off. An existing seeded disposition is not an editable
review; append an explicit demonstration attempt and start review.

Rehearsing the mixed-mode B story through public controls preserved the original
undated evidence, July Sufficient counterfactual and three immutable attempts.
Applying the approved date correction invalidates its old advisory result;
re-checking is a separate action. Turning Off after the human sufficient
disposition leaves the synthetic lifecycle and human records unchanged.

An instantaneous count() can miss a disclosure before navigation has rendered
it; awaiting the region and asserting the outer details open attribute avoids
mislabelled "expanded" photographs. Nested advisory snapshots also make a broad
summary locator ambiguous. Both were capture-harness issues, not product bugs.

Initial default-worker Vitest execution timed out one budget-CLI test at 5,000ms
with 559 passing. A bounded two-worker rerun passed all 560 tests. Preserve both
outcomes; do not change application tests to hide host contention.

## 2026-09-11: Stream V numerical distinctions (#25)

Projected referrals use rounded deficient built and deficient abstained shares.
Risk instead contains every abstention plus deficient built items. Both use
the same synthetic cohorts, but they are not interchangeable totals. `V` is a
volume and `g`/`j` are durations, not additional cohorts.

The monthly calculator deliberately keeps `V * j` on both sides. The queue day
shares one operator's elapsed allowance between built and abstained work; its
pharmacy/code-cleared cohorts add no judging time. Shared inputs do not imply
identical denominators or a measured productivity effect.

The reason guard also applies to recommended referrals, information requests
and escalations, not only overrides or manual decisions. Check both the pack
label predicate and store validation before describing a numerical threshold.

## 2026-09-12: Public resumption does not change evidence strength

Application-relative docs/HANDOVER.md is BSA/docs/HANDOVER.md at Git root.
Its public-resumption preface supersedes the retained freeze narrative below.
Repository publication changes access and Actions eligibility, not whether a
new CI run passed or a live deployment exists.

The supplied PDF asks whether assembly effort is material; the research pack's
stronger more-than-judging claim remains an assumption. Capacity, reconstruction
and pharmacy rework are outcomes to test, not measured benefits. Keep that
distinction when using the now explicitly public references in final narration.
