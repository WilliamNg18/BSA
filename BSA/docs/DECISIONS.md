---
title: Architecture and product decisions
description: Append-only decisions with reasons and rejected alternatives.
ms.date: 2026-09-10
---

## 2026-09-11: Issue 27 scene-only estimate count-in

Animate only the five derived scene estimates over the existing two-second
presentation duration. Public context figures, qualifications, the Sources line,
calculator arithmetic and shared AnimatedNumber remain unchanged. Use the
existing UK formatter for intermediate and exact final values.

Expose the final value as one accessible named graphic while its visual text is
hidden from assistive technology; do not put animation frames in a live region.
Off and reduced motion are immediate. A new scenario identity cancels and
restarts presentation even if one resulting metric is unchanged. Unmount, Off,
Reset and live reduced motion cancel scheduled frames and media listeners.
No animation writes to application state or implies processing speed.

## 2026-09-11: Remove all performance and size budgets

No performance or size budgets on this project; a static demo with no back end has no reason to fail a build on bytes. Functional and accessibility checks only.

This supersedes the 350,000-byte advisory policy and all older hard caps.
Delete the measurement plugin, byte-budget script and budget-only tests.
Disable Vite chunk-size warnings and compressed-size reporting; one non-blocking
CI summary line reports independent-resource gzip size without a threshold.
Check is exactly typecheck, lint and build. Vitest, crash/dead-control/six-outcome
browser regressions and zero-violation axe are the only other blockers.
Word counts, Lighthouse, screenshot differences and all other quality metrics
are informational. Quarantine proven flaky checks with a tag and linked issue;
run them separately without turning them into a silent pass.

Hosting is settled: Azure Static Web Apps Free at the root, no additional
services and no future hosting redesign. All further effort goes into the
application, except a proven functional defect such as CSP-blocked modal styles.
Keep the strict CSP and remove incompatible style injection in code.
No route adds access restrictions; asset caching is immutable only for hashed
assets. Every PR triggers preview upload and close triggers cleanup.

Provider quotas are facts, not configurable project gates: Free has three
concurrent previews, 250 MB per environment and 500 MB total. Do not claim
unlimited previews or account minutes. Actions is enabled with all actions
allowed; billing usage does not establish remaining entitlement. No billing
change or deletion of existing artifacts is authorised by this code change.
Cancel superseded CI runs and make failed-run artifact uploads best-effort with
one-day retention, so optional evidence storage cannot fail a workflow.
The absent deployment token is expected and does not block any stream.

## 2026-09-11: Current hosting and acceptance policy supersedes historical gates

The user explicitly replaces every historical strict payload/score/copy/visual
threshold below. The complete independent-resource gzip budget is 350,000
decimal bytes and advisory at, below and above the threshold. Incomplete or
unavailable size reports are explicit advisories, never success claims.
Word counts, Lighthouse scores and screenshot differences cannot fail a build,
unit run or browser run. Keep their measurements and positive audit controls.
No Lighthouse or screenshot-difference assertion is currently configured;
future tooling must follow this policy.

Blocking checks are check (typecheck, lint, actual production build), Vitest,
Playwright crash/dead-control regressions and zero-violation axe. Preserve
functional assertions inside mixed copy/browser tests rather than marking
whole suites continue-on-error. Eager offline navigation remains a functional
contract, not a size optimisation to weaken.

Azure Static Web Apps Free in West Europe is the single hosting target, with
UK South resource-group metadata. Serve at `/`, copy the root configuration
into the nested app's dist, and retain a self-only CSP. Do not provision
Application Insights, Front Door, custom domains, authentication or other
Azure services. Remove obsolete server-host and identity provisioning hooks;
do not delete any live resource or tenant object as part of this migration.

No default Azure subscription is configured and the CLI is unavailable.
Discovery returned multiple corporate subscriptions, none selected. Do not
guess a subscription or copy a historical account's identity into provisioning.
Document explicit owner-run setup instead; GitHub has no deployment token.

Integrate the preserved feature commits in this dedicated worktree because
integration/tasks-8-13 is checked out elsewhere. It already descends from
remote main, so no conflict/rewrite is necessary. Preserve main's frozen public
types and all six outcomes. Never touch the other checkout or archive refs.

## 2026-09-10: Meet today first

Default and Reset are Agent Off so the audience meets the manual scenario first.
Reject default On: it hides the baseline and implies an already-deployed service.

## 2026-09-10: Constant judging and item-based pharmacy catch

Hold judging constant across calculator columns to isolate evidence gathering.
Count pharmacy catches as items that never reach the queue, not saved minutes.
Reject inferred judgement savings and pharmacy handling-time claims without data.

## 2026-09-10: Payment and lifecycle authority

Paid is a synthetic state attributed to existing pricing; no money is calculated
or approved here. The agent never changes a lifecycle state. Reject automatic
state transitions from recommendations; operator actions remain authoritative.

## 2026-09-10: Attribution and concise copy

Use one Sources line and no documentary filenames in the interface. Keep the
full documentary register offline. Reject repeated citations and paragraph-heavy
panels; preserve synthetic operational rule references and meaningful evidence.

## 2026-09-10: Parallel contract freeze

Freeze lifecycle types, exact user-provided labels, typed method signatures and
one heading-only claims route before parallel implementation. Methods throw
not implemented, rather than silently succeeding. No lifecycle behaviour or
Task 8 completion is implied. Preserve the existing Exception queue navigation
label to avoid an unrelated rename during the freeze. Methods return void;
operator decisions reuse HumanDecision and drafts are operator-approved strings.
History timestamps are ISO 8601 strings, validated by Stream B, not branded types.

## 2026-09-10: Pharmacy receipt isolation

Task 4 will use a separate in-memory pharmacy store and the frozen precheck
snapshot type. Stream A must not edit Stream B's lifecycle store. Stream B can
later consume the same snapshot via submit/resubmit. Reject queue integration
and throwing lifecycle calls during Task 4. Receipt facts, checks and timestamps
must be immutable; Off records no performed checks.

## 2026-09-10: Ownership and pending integration

Stream A owns existing page tests and new pharmacy tests; Stream E owns new
round-trip tests only. This resolves the plan's overlapping generic test ownership.
Only new cross-stream tests may be tagged pending-integration and temporarily
skipped before integration. Never weaken or skip existing regression tests.
Tasks 5-7 lack a current detailed brief in the repository; Task 4 remains the
only implemented Stream A increment until their exact requirements are available.

## 2026-09-10: Task 5 projections remain separate from evidence

The user supplied the Task 5 brief after the ownership freeze. Keep twelve
canonical/filler examples pinned independently of exact monthly model counts.
Generated rows use a deterministic rotated cohort rank with no agent calls or
fabricated citations. Reject mapping synthetic cohort outcomes onto canonical
identities, which could misrepresent D as built or E as agent-assisted.

Use bounded native-scroll segments plus accessible logical jumps rather than a
billion-row spacer exceeding browser physical scroll limits. Sweeps retain only
visible-row projections. New queue memory follows the existing reset adapter;
it never calls throwing lifecycle methods or writes actual decisions.

## 2026-09-10: Task 5 single-operator day capacity

The day uses one 540-minute budget for built and abstained cohorts together,
allocated proportionally and rounded down. Rule-cleared work bypasses operator
review; pharmacy-caught work is outside the queue. Reject separate full-day
budgets for each cohort and counting code clearances as human decisions.
Keep calculator judging unchanged; its full-reference comparison is not the
day's volume-capped projected operator throughput. Both denominators are labelled.

Stream D retains ownership of the inherited "Simulation planned" shell notice.
Flag its contradiction in progress rather than editing or concealing that text.

## 2026-09-11: User-authorised mobile sheet ownership exception

The user explicitly permits Stream A to repair only Stream D's mobile navigation
sheet exit/Presence race while completing dirty Task 5. The header sheet disables
closing animations on content and overlay, with zero closing transition duration.
Normal opening animations remain; live reduced-motion preference disables them.
An optional overlay class pass-through leaves other sheets' defaults unchanged.

Retain Radix Presence and its focus/scroll cleanup. Reject conditional removal of
SheetContent on mobileOpen, forceMount, hidden inert remnants and relaxed dialog
count assertions. No frozen store, routes, case header, claims, rail or other
Stream D behaviour is changed. The planned-simulation copy handoff still applies.
This exception authorises no Git, account, deployment or Task 6 work.

## 2026-09-11: Task 6 manual records and frozen lifecycle boundary

The user separately authorised Task 6 on 034121f after the supplied Task 5 gate.
Manual Sufficient is an explicit human ACCEPT with a mandatory eight-character
reason and recommendation NONE. The existing recordDecision method still marks
that record as an override. Show the stored flag and explain its limitation;
reject changing Stream B's store or hiding the counter to simulate integration.
The throwing recordOperatorDecision contract is never called by this increment.

Missing assisted slots describe only the synthetic manual comparison. Historical
records with actual rule versions retain them underneath and acknowledge them
in the Off view. Reject claiming a historical rule never existed merely because
assistance is Off. Counterfactual replay compares with the recorded outcome,
never replaces history, and is disabled in the manual comparison.

Keep E's deterministic pre-check and clearance evidence alongside the seven
manual assumed steps, not disguised as seven engine actions. On slots depend
on actual engine phases and final PASS; FAIL withholds proposals and D keeps
its abstention evidence. Read-only comparison columns share one decision panel.
Only explicit human recording changes session state; playback is presentation.

## 2026-09-11: Approved Task 7 shared performance ownership

The user explicitly permits targeted shared performance work by Stream A on
36db32a after the supplied Task 6 postcommit gate. Root providers, font loading,
bundle configuration and performance-only shell imports are in scope. Reject
new navigation features, changes to the frozen store or lifecycle, and work
owned by Streams B/C/D/E. No Git, account or deployment actions are authorised.

Keep immediate offline first navigation and all eager routes. A strict decimal
200,000-byte total gzip failure gate covers every emitted resource, not only
the entry script. Reject 200 KiB, deferred chunks, service-worker readiness waits,
selective font accounting and hiding unused-page payload from the measurement.

Choose system fonts, static reachable-source CSS and safe Terser compression.
Synchronous LazyMotion alone remained too large; native CSS expresses the three
simple entrance/opacity effects without an animation engine. MotionConfig and
all presentation clocks remain. Use the platform select for three replay months.
Replace only the two decision toasts with a polite, keyboard-dismissible live
region that clears on Reset. No business explanation or gate predicate changes.

Reject Lightning CSS after its measured 201,081-byte payload failed the gate.
Keep esbuild CSS and a separate 650 kB raw warning, with the stricter complete
gzip gate authoritative. Production fault tests target the exact case and exact
prescriber syntax rather than generated symbols; duplicate markers are errors.

## 2026-09-11: Scoped Task 7 accessibility corrections

The user extends Task 7 scope to accessibility defects on applicable pages.
Keep amber semantic labels but use amber-700 behind white text. Use the theme
foreground only for the two rose case-pack alert descriptions; do not darken
global muted text. Preserve uncertainty, full evidence and all gate outcomes.

Audit all seven shared Table usages before removing its internal scroll wrapper.
Each call site already supplies a named region with tabindex zero. One scrolling
element now owns focus and its contextual name, avoiding nested duplicate regions
or resize observers. Remove the obsolete trace overflow override. Make the
architecture preformatted flow a named, focusable region without changing text.
Keep full default-rule axe and the strict complete-payload budget unchanged.

## 2026-09-11: Separate payload acceptance from Lighthouse performance

Retain the strict 200,000-byte independent-resource gzip gate and add the named
measure-budget command to check. Do not reinterpret 199,636 bytes as a load-time
pass: actual Lighthouse mobile performance is 86, below the user's 90 target,
despite desktop performance 100 and accessibility 100 on both presets.
Task 7 stays unchecked. Reject weaker throttling, best-of-repeat reporting,
deferred route code and frozen-store changes to obtain a passing score.

Run the pinned Lighthouse CLI from npx cache, leaving runtime dependencies alone.
After Windows profile cleanup failed, attach the CLI to installed Playwright
Chromium over a local debugging port. Keep failed and completed outcomes distinct.
Generated historical-task screenshots belong in ignored test output. Only
explicitly selected Task 7 images are retained as source-controlled evidence.

## 2026-09-11: Bounded formatter optimisation and repeated audit acceptance

Cache Intl.NumberFormat instances by precision in the existing display helper.
Do not cache mutable scenario results, change formulas or touch the frozen
store. Six new tests verify output parity and construction reuse. The candidate
adds 15 gzip bytes, leaving 349 bytes under the unchanged 200,000-byte gate.

Use three consecutive cold mobile CLI runs and report every score: 91, 91, 90,
median 91. Desktop is 100 and all accessibility scores are 100. Deep-compare the
entire configSettings object to the original report, preserving device, CPU,
network, cache reset and audit selection. Keep all raw reports and traces.
The unchanged baseline rerun scored 93, so do not attribute the old 86-to-91
difference entirely to this patch. Full-browser verification remains required.

Reject speculative offscreen containment: the measured DOM has 151 elements,
the dominant callback is React Scheduler and no forced-reflow insight identifies
a defect. Preserve all content, CSS layout and eager offline navigation. Await
switch colour transitions only when comparing final screenshots, never when
running Lighthouse or immediate-offline checks.

## 2026-09-11: Close Task 7 locally without crossing integration ownership

Accept only the user-authorised Stream A performance and accessibility scope:
final check without warnings, 503 units, 721 full production browsers in
10.2 minutes, 334 unique axe audits with zero violations and 199,651 gzip bytes.
The three mobile scores are 91/91/90, median 91; desktop and accessibility are
100. This supersedes the earlier local mobile blocker, not its retained history.

Retain 124 hash-verified reduced-motion matrix copies for all 31 destinations,
both Agent states and both desktop/light and phone/dark pairs. Keep the earlier
twelve case-pack selections and historical screenshots unchanged. Copies do not
increase the 248 unique matrix captures or the 334 unique audit count.

The user's shared-performance permission does not authorise new navigation,
claims, frozen store/lifecycle changes or Tasks 8-13. Tick Task 7 LOCAL PASS only;
leave integration unchecked and Task 7 CI/hosted gates pending main-agent action.
This closeout performs documentation and report work only: no source edits,
Git commands, account changes, deployment or feature implementation.

## 2026-09-11: Stream S verifies the deployed CSP without relaxing it

Keep root `staticwebapp.config.json` unchanged. Production browser servers read
the emitted configuration and apply its actual global headers to every response.
Default Playwright uses port 4173; `PLAYWRIGHT_PORT` supports isolated runs and the
dedicated accessibility configuration defaults to 4183. The local server covers
static assets and SPA deep links, not every Azure platform routing behaviour.

Reset and mobile navigation use Radix scroll locking. Its upstream scrollbar
component injects a style element that `style-src 'self'` blocks. Alias only the
`react-remove-scroll-bar` entry consumed by Radix to a local component. Preserve
Radix focus trapping, dismissal, wheel/touch containment and constant subpath
imports. Apply measured compensation with individual CSSOM properties and
external CSS, retaining nested-lock counting and previous property priorities.
Do not add unsafe-inline, nonces, hashes, a runtime service or a different host.

The dedicated unrestricted axe matrix covers the specified screens, both Agent
states, both motion settings and both themes. Phone claims also cover all seven
lifecycle states. Keyboard checks assert observable effects and focus, not just
successful key dispatch. This is local Chromium evidence, not full WCAG 2.2 AA
conformance, manual screen-reader testing or verified hosted acceptance.

Keep source work parallel, but temporarily serialise heavyweight browser runs
on this shared machine. Stop only this stream's owned stalled process and retain
its partial log as interrupted; wait for R's existing run before starting S's
final matrix. Do not classify contention timeouts as product failures or flaky
tests without evidence, and do not count interrupted runs as passing.

The historical replay link is present for A/B/C/E/F, but not escalated D. Allow
its existing label to wrap with bounded width and automatic height. Preserve
the label, destination and layout; do not conceal overflow. Linux CI reported
5px overflow at 360px. Windows reproduced 17px with the root text size enlarged
from 16px to 18px, establishing the same intrinsic-width defect.

Use completed Linux evidence on the exact patch instead of repeating a healthy
but slow local matrix: CI `34629986842` on `1a103e3` has all 183 S tests and 247
unique unrestricted axe reports passing. Keep its overall 760 passed / 205 failed
result separate; no full-CI pass is claimed. Retain artifact `10277495935` and
the extracted audit/CSP counts. Stop the owned duplicate, not another stream.

After that matrix, fix two explicit accessibility gaps: Dismiss tour moves focus
to main; Restore tour focuses the remounted chapter chooser. Reset overlay and
content suppress open/closed animations under reduced motion, while preserving
normal motion. Verify computed animation names and keyboard focus, not axe alone.
Use state-qualified reduced-motion classes to match the state animation rules.

AppShell remains the single owner of the claims chapter heading and prose.
Derive chapter numbers/titles from shared tour stops and look up prose by that
number. T's referral-cycle component keeps only its distinct flow subheading.
This avoids duplicated chapter copy and hardcoded 5/4/6 numbering after T merges.

Complete affected-control acceptance without rerunning the full matrix: the
40-test final-artifact run passed 38 and timed out twice at the existing
30-second limit. Recheck only those two on the same artifact and unchanged
configuration; both pass. Retain both outcomes and their traces rather than
reporting a clean 40-test first run. No assertion, timeout or CI gate is weakened.
Observed CPU saturation alone does not establish a product-specific flaky test.
The nine owned keyboard checks, seven follow-up axe reports and nine CSP reports
all pass on the final control revision. Release the owned server before handoff.

## 2026-09-11: Issue 20 distinguishes manual mode from inability

Intentional Agent Off displays "Not checked: manual submission". Agent On
with availability disabled displays "Agent unavailable: manual submission".
Only an actual scripted unable result displays "Agent unable to determine";
ready, missing and pending checks retain their existing wording.

These are display distinctions, not precheck results or lifecycle transitions.
Reject labelling Off as a failed agent check or implying that unchecked text
is ready. Submission stays available; receipts, snapshots and canonical cases
remain unchanged. Coordinator transferred only the pharmacy workbench and
its matching functional regressions from R to the parity stream for this fix.

## 2026-09-11: Issue 26 explicit chapters and honest referral-cycle presentation

Separate the pipeline at `/#pipeline` from Four cases at `/#cases`. The tour
has eight chapters and nine stops because pharmacy precheck remains chapter
five's substop. Preserve scene, calculator, all four case actions and the
closing disclosures. The coordinator approved changing only the canonical
chapter metadata array, not source figures, rules, fixtures or calculations.

Show manual evidence-gathering work explicitly in both places and the referral
loop. Assisted preparation proposes fewer gathering steps, not fewer human
decisions or measured waiting times. Keep Case D's manual fallback visible.

Compose a read-only cycle guide above existing claims controls. Its five steps
describe the workflow, never progress. Separately render the selected claim's
actual lifecycle label and links to its real pharmacy/operator actions. Editing
is a local draft until human resubmission; paid is shown as a recorded state
only when the existing store says paid, with existing-pricing attribution.
The guide never changes lifecycle state or creates approved pharmacy reasons.
S retains the canonical shell chapter heading and focus ownership; R owns
existing tour regression updates. New tour-cycle tests use only public UI.

## 2026-09-11: Issue 28 queue Compare is a read-only disclosure

Use an explicit Compare button in Queue controls to reveal an inline named
region, not another simulation or shared overlay. It consumes the current
scenario selector and existing day projection helper at the shared clock.
Opening and closing never pause playback, switch assistance or write stores.
Focus moves to the comparison heading; Close and Escape return to Compare.
The existing queue revision remount closes the surface on Reset or input edits.

Keep monthly cohort denominators separate from projected daily operator work.
Day judging is not an additional calculator saving; abstention remains manual,
code-cleared cohorts require no operator review, and no payment is calculated.
Existing virtual month, sweep, twelve examples and day summaries remain intact.
No shared primitive, global style, lifecycle, store or algorithm changes.
