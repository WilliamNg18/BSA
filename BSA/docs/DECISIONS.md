---
title: Architecture and product decisions
description: Append-only decisions with reasons and rejected alternatives.
ms.date: 2026-09-15
---

## 2026-09-15: Live is the product; the local copy is a verified backup

Live is the product; local is a backup built from the same commit; any difference is a defect.

- Question: what establishes completion? Choice: main merge, green deployment and observation of that exact commit on the live URL; a branch or local diagnostic is incomplete work. Tie-breaker: the newest live-first instruction and truthful evidence.
- Question: how do working branches coexist with the live-first rule? Choice: push incomplete branch work at each STATUS and at least every thirty minutes, but never present it as the product or package it as a backup. Only the current main artifact verified on live is eligible. Tie-breaker: preserve the established merge order without a separate local version.
- Question: when are tracking documents updated? Choice: include PROGRESS, SCOPE, ALIGNMENT, DECISIONS and LEARNINGS in the same commit as each described change; retain historical results and state pending gates explicitly. Tie-breaker: the newest repository-currency instruction.
- Question: may a previously running frozen diagnostic become backup proof? Choice: preserve its original outcome and source boundary only; it cannot establish live completion or backup equality. Tie-breaker: immutable evidence and the new release rule.
- Question: what is implemented by this policy change? Choice: record and relay the standing rule now; mark deployment freshness, canonical backup/parity and clean-environment recovery implementation pending rather than claiming unrun checks. Tie-breaker: truthful scope and no false completion.

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

## 2026-09-12: Account transfer checkpoint

Checkpoint before transfer; all branches preserved; no merges during the freeze.

Commit and push unfinished work without waiting for tests. Preserve the eight
stream heads with annotated checkpoint tags and document actual interrupted
results, not inferred passes. Main's handover/tracking checkpoint changes no
application source and does not complete Tasks 8-13. The later owner instruction
determines whether the proposed transfer proceeds.

## 2026-09-12: Public repository and authorised resumption

Reference documents are public by the owner's decision; they contain nothing sensitive.

Transfer not proceeding; repository made public for Actions capacity; state
preserved as checkpoint. The enterprise identity is an Enterprise Managed User
and cannot join or own this external repository. Actions billing sits with the
repository owner, which remains WilliamNg18. Public visibility does not change
the single Azure Static Web Apps root-path hosting target or the six outcomes.
Keep every checkpoint tag immutable and resume all unfinished streams.

No reference document was removed. No ignore rule or CI gate was added to block
docs/reference or extracted reference material. The existing client-only
document-name check remains informational and protects interface copy, not
repository documentation. Reference names in docs/code comments are allowed.

Enable GitHub secret scanning and push protection; both were confirmed enabled
through the repository API. Ignore `.env*`; credentials stay in repository
secrets or Azure, never the static browser bundle. The owner is to reset the SWA
deployment token in Azure and replace its repository secret. No credential value
is requested in chat or source. The repository returns to private when the demo
is done; do not change visibility before that instruction is fulfilled.

## 2026-09-11: Stream R root-path functional acceptance

Compare production destinations with exact root-relative routes, not the retired
/BSA prefix. Tour checks retain every stop, direction, shortcut and focus
assertion; rapid keyboard history compares the complete pathname and fragment.
No route assertions are skipped or replaced with an origin-only check.

Use two browser and two unit workers on the shared machine. Run every production
spec with zero retries, including blocking crash, control and default-rule axe
checks. Stream S owns strict-CSP serving and compatibility fixes; Vite preview
alone cannot establish CSP or Azure-hosted acceptance.

Strengthen the integrated Off-to-On round trip using only public controls and
visible history. Preserve the initial unchecked submission verbatim, prove the
unaided resubmission stays unchecked, and verify neither enabling assistance nor
checking a correction changes lifecycle state. Arrival presents a recommendation;
only the explicit human decision releases the synthetic item to existing pricing.

## 2026-09-11: Pharmacy response visibility follows explicit draft approval

Issue #19 distinguishes an operator's internal decision reason from a pharmacy
draft approved for release. With Agent On, both the current pharmacy response
and expanded pharmacy history show only an actual approved draft, labelled
Operator-approved note. An unapproved response states that no approved note
exists; it never promotes manual text by relabelling it.

With Agent Off, the pharmacy retains its manual human response. NHSBSA history
retains the human reason in both modes. Toggle changes affect presentation only:
no record, history event, approval, revision or lifecycle state is rewritten.
Advisory typed-field checks and evidence remain separate from operator responses.

## 2026-09-11: Explicit unchecked-resubmission comparison without new authority

Issue #29 adds a claims-specific comparison using the existing keyboard-readable
pain marker. Off describes another correction cycle as a synthetic assumption,
not proof that real pharmacy checks are absent. Submission remains usable and
unchecked; no new model call, validation or lifecycle action is introduced.

On resolves the marker only when an operator-approved correction instruction
exists and the existing check reports Ready for the current text. Missing,
unable, unapproved and edited-but-unchecked states remain unresolved. Even a
resolved marker explicitly requires human re-check and promises no payment.

## 2026-09-11: Narration timing is informational, not a performance gate

The mixed-mode round-trip test retains every control, both-side, lifecycle and
history assertion but records elapsed milliseconds as a JSON artifact instead
of enforcing a 120-second wall-clock budget. The two-minute narration remains
a presentation target. Existing test timeout/hang guards and deterministic
phase-clock assertions are unchanged.

## 2026-09-12: Eight-chapter regression integration preserves separate surfaces

Rebase onto the integrated S/T/helper main before updating existing expectations.
The tour now traverses nine stops across eight chapters. Pipeline assertions
target /#pipeline; canonical case assertions stay on /#cases. Preserve all
keyboard directions, focus destinations, resets and same-item history checks.

Add the separate pipeline to offline, content, generic-label, screenshot and
default-rule axe matrices without removing Four cases. The coordinator and S
explicitly authorise adding that one route to both existing accessibility arrays;
all audit variants and zero-violation assertions remain unchanged.

## 2026-09-11: Stream V integrated visual and narrative reconciliation

Replace the layered historical SPEC, demo script and known-issues narrative
with the implemented seven-chapter/eight-stop structure and shared lifecycle.
Keep historical evidence in its existing task records, explicitly labelled,
rather than treating old feature gaps or measurements as current blockers.
The script uses exact public controls and an Off-to-On-to-Off B round trip;
draft approval, resubmission and sufficient disposition remain human actions.

Capture fresh production files at root path on isolated port 4193, 1440 x 1000,
light theme, device scale 1 and reduced motion. Include every route and Agent
state, all six case pack/trace/record views, seven expanded claim states and
round-trip/overlay checkpoints. Assert disclosure expansion and record per-image
hashes, errors, overflow and axe outcomes. Contact-sheet slices are review aids,
not extra screenshots. Keep the PR draft until the coordinator confirms R/S
and the separately owned #20 pharmacy-status correction have merged; then
rebase and refresh before declaring ready. Do not merge V.

The later user direction removes all size/performance budgets: gzip,
Lighthouse, word counts and screenshot differences are informational only.
Functional and accessibility checks still block. Absence of a token does not
block local work; document owner setup in DEPLOYMENT.md without inventing a
selected subscription, provisioned resource or live URL.

## 2026-09-11: Stream V numerical narration follow-up (#25)

Count semantic claim families, not repeated numbers, route IDs or list numbering.
Review 33 families in the four owned current narrative documents against source
definitions and existing evidence. Correct four narration claims: explicit
unverified public-figure framing, duration versus cohort units, projected
referrals versus all-abstention risk, and the full eight-character reason rule.
The other 29 remain qualified and supported; no application discrepancy or
deferred narration fix requires another issue.

Keep the monthly calculator's fixed-reference judging separate from the queue's
single-operator day projection. Neither model measures savings or accuracy.
Public-source validation remains explicitly unverified, not silently converted
into a measured fact. No new browser run, source edit or test edit is needed.

## 2026-09-11: Preserve partial capture evidence

Checkpoint the capture manifest after each image and record expected count and
completion separately from violations. Recompute failures from all retained
entries during resume, and recapture failed entries instead of skipping them.
This prevents an interrupted or resumed run from appearing successful merely
because its new in-memory failure list started empty. Validate this metadata
logic without launching another browser before the final integration slot.

## 2026-09-11: Latest requested scope and active implementation ownership

Keep the latest eight-chapter request distinct from the seven-chapter source
used for initial captures. SCOPE.md has exactly 18 requested rows: two bounded
Done implementations (A2 calculator and F lifecycle), sixteen In progress and
zero unowned Not started rows after assignment. Evidence names tests and tested
revisions; source presence and a partial passing run do not establish completion.

Use T #26 for chapter separation, two-place contrast and whole-cycle claims.
File only additional proven increments: #27 numerical scene count-in (not the
existing CSS fade), #28 operable queue Compare (not its existing toggle/summary)
and #29 explicit unchecked claims-resubmission pain. Coordinator assigned all
three, with #29 staying under R's existing claim-detail ownership. No new
browser process or delegation by V. Final captures must follow the expanded
merged scope rather than force the historical 103-image count.

## 2026-09-11: Prepare expanded final capture selectors

Use T's settled `/#pipeline` and `/#cases` as separate destinations. Use queue
#28's public Compare action after Jump to 17:00, asserting the inline Today
versus With agent region. This plans 107 final images, not a fabricated update
to the 103-image historical manifest. No capture runs before the coordinator
releases tested integrations and the browser resource slot.

## 2026-09-12: V resumes with approved public-reference narration

Read the public-main resumption in BSA/docs/HANDOVER.md at `6db3f98` before
resuming. Transfer is cancelled; WilliamNg18 remains owner. Preserve checkpoint
`b3acc13`, initial images, evidence and all immutable tags. Preserve main's
HANDOVER/SCOPE and security additions at the eventual authorised rebase.

Prepare the aim/problem/outcome narrative from the retained source register:
PDF-A02/A03/A04 for validation needs, H08/H10/H13 for potential outcomes,
D-VALUE/D-STOP for accounting and stop criteria, and D-PHASES/D-ADVISORY for
the optional pharmacy boundary. Reference names are allowed in these documents,
not in website copy. Publication does not independently verify a source claim.
Do not edit the parent-owned root README or create new product features.

R's corrected public Actions run must actually pass and merge before V's
expanded 107-image refresh. No new capture, source change or early rebase is
part of this narration preparation; the frozen evidence remains historical.

## 2026-09-12: Reconcile V after accepted public integration

The coordinator released V after R merged as `898cda5`. Public CI
34689966621 passed check, 607 units, 1,019 blocking browser cases and three
separate informational quarantine cases. No successful-run audit artifacts
were uploaded; keep test counts distinct from deduplicated report counts.

Rebase V onto that main and retain public root README/security, HANDOVER,
MEMORY, PROGRESS and SCOPE. Superseded V-only historical SCOPE patches are
already represented by main's handover; retain the main snapshot and append
current acceptance rather than discarding public resumption. Verify main's
DECISIONS and LEARNINGS remain complete prefixes before adding V history.
Runtime, tests, dependencies and production configuration remain unchanged.

Regenerate the whole expanded matrix with the existing strict-header server
on granted port 4193 and one sequential capture context. Preserve initial
103 images through checkpoint `b3acc13`, not a mixed-source resume. Individual
audit JSONs belong with the new manifest; independent gzip of every emitted
resource is informational only. Owner-hosted verification remains issue #37.

## 2026-09-12: V final visual acceptance

Accept the completed 107-image source-898cda5 matrix: 53 Off and 54 On,
107 individual unrestricted axe JSON outputs, zero violations, page/console/CSP
errors or horizontal-overflow captures. Completion is 2026-09-12T11:50:58.433Z;
the same-source harness continuation is explicitly recorded. All PNG hashes,
1440px widths and full-height visual slices were reviewed.

Retain incomplete audit rules (51 audits) rather than claiming manual WCAG
conformance. Focus-triggered switch tooltips are ordinary UI state and remain
visible on some routes; no content is pixel-masked. Build evidence sums all four
independently gzipped emitted resources to 203,723 bytes, information only.
Current SCOPE has 16 accepted implementation rows, with owner hosting #37 and
VD final documentation closeout remaining In progress. D owns final task ticks.

## 2026-09-12: Two-step owner setup and fifteen-minute deployment monitoring

Read the current subscription rather than infer resource existence from a
failed workflow. Authenticated Static Web Apps listing returned no sites in
subscription 8b02c7be-06b9-4d15-a916-eba62a775f02. The retained App Service is
not the selected host and is not modified. No SWA success exists in Actions.

Provide one copy-and-paste PowerShell Cloud Shell block with subscription
selection, public repository download, UK South group, West Europe Bicep site,
token reset and retrieval, followed by one GitHub secret step. Keep the manual
workflow trigger. A separate preflight job rejects missing/blank credentials
before checkout/build; token validity is determined only by Azure upload,
not by an invented local pattern or a claim that presence means validity.
Successful deployment records its actual URL and source commit.

Monitor every fifteen minutes, dispatch only when a usable setup change needs
deployment, and report blockers immediately with an Owner actions for me line.
Do not repeatedly dispatch an absent/unchanged failed secret. Completed local
application acceptance is retained; only hosted verification and its final
records remain blocked. No size/performance gates or extra Azure services.

## 2026-09-12: Issue 41 preserves route contrast during motion

CI `34693827974` on PR #40 reported one genuine contrast failure among 1,022
tests: 21 muted-text nodes in the Follow-linked case pack. The unchanged light
token passes when settled; ancestor opacity during the 150 ms route entrance
made the effective text too light. Do not quarantine axe or wait away this
visible state.

Measured production frames on runtime-equivalent main `8e49884` confirm the
defect under the actual strict CSP. At 75 ms, opacity 0.839245 yields
`#8a8a8a` on white, 3.45:1, with 21 failing nodes. At 135 ms, opacity 0.994601
still produces eight panel failures. At 150 ms, opacity is 1 and the same
intro is `#737373`, 4.74:1, with zero violations.

Remove only `motion-safe:fade-in` from the text-bearing AppShell route wrapper.
Retain the 6 px transform, 150 ms duration, easing, reduced-motion guard and
focus behaviour. No colour token, domain/store rule, CSP or unrelated animation
changes. The regression holds the real CSS animation through the Web Animations
API at 0, 75, 135 and 150 ms; it does not inject replacement styles or sleep
until contrast passes.

Use independently timed frame cases across both themes, motion preferences and
Agent states, retaining the existing 30-second guard. The optional development
diagnostic configuration excludes the new header-only spec, as it does the
older strict-CSP spec. Default CI and production-artifact diagnostics include it.

## 2026-09-12: Restore the three pharmacy timing instances to blocking coverage

Issue #34's three conditional quarantine tags may be removed after nine
controlled executions pass on current main: one worker, three repetitions per
instance, real production CSP headers and unchanged assertions/timeouts.
This restores existing coverage, not a new application behaviour or proven
performance repair. Keep the original failures as evidence. Full public CI on
the proposed tag-removal revision must pass before coordinator merge.

## 2026-09-12: Scope visual provenance to the route-opacity repair

After accepted main `82c18e4`, compare only the 64 route-entry images from the
107-image `898cda5` set: 32 destinations in both Agent states. Keep the original
manifest, PNG hashes, audit files and build report unchanged. The 43 additional
stateful images retain their old provenance rather than being called recaptured.

The runtime diff removes only AppShell's motion-safe opacity fade, inactive
under these photographs' reduced-motion setting. Establish settled reproduction
with actual exact-byte comparisons and new per-route audit/response/computed-style
evidence. Do not infer safe intermediate frames from those stills: PR #42's
held-frame tests and the accepted 1,054-case all-blocking run supply that proof.
No masks, pixel tolerances, replacement styles or full 107-image rerun.

Record the new resource hashes and both compressor methods explicitly.
Python's original level-9 method gives 203,721 independent gzip bytes for the
new build; Node's bundled zlib gives a different informational size for identical
resource bytes. No budget or runtime change follows from that measurement.

The completed scoped run reproduced all 64 route images byte for byte, with
32 Off/32 On, 64 new unrestricted axe outputs with zero violations, no
page/console/CSP errors and no overflow. Thirty-nine audits retain incomplete
color-contrast checks. No image binary or original source metadata was replaced.
No old-build fallback capture or stateful 43-image rerun was needed. Completion
is 2026-09-12T14:05:50.955Z on unchanged released runtime `82c18e4`.

## 2026-09-12: Evidence-based infrastructure closure and fast verification

Do not declare infrastructure complete while resource/token, preview, recovery
or timing evidence is absent. INFRA-DONE records each criterion separately.
Strict CSP and platform quotas cannot promise compatibility with unspecified
future features; reopen only for an actual functional requirement.

The coding-agent setup workflow belonged at repository root, not inside the
nested application. Move it to the documented discovery path, preinstall the
locked BSA dependencies with Node 22 and npm cache, and verify compiler
availability before agent work. Use the standard hosted runner, not a paid
upgrade. Measure the actual setup run before claiming minute-level readiness.

Issue #46 owns one local/CI verification entry point and four Playwright shards,
preserving every blocking test. End-to-end CI under fifteen minutes and small
changes live within an hour are operating targets, not failure budgets or
permission to skip checks. Existing ownership and reviewed PR flow remain.

## 2026-09-12: One verification entry point with four CI partitions

Issue #46 introduces `cd BSA; npm run verify`: check (typecheck, lint, one
production build), units, informational content/gzip and the blocking Chromium
suite, then informational quarantine. Both browser stages reuse the existing
production-artifact configuration, which applies the actual root hosting
headers. Missing Chromium has an explicit `npm exec -- playwright install
chromium` setup instruction; CI installs its Linux prerequisites beforehand.

CI runs `npm run verify -- --shard=INDEX/4` in four parallel jobs. Shard input is
validated before any command executes, and npm runs through Node with argument
arrays and shell disabled for Windows compatibility. Any blocking exit/error
fails that shard; content/gzip/quarantine failures are logged but do not change
acceptance. Only shard one emits content/gzip reports. Blocking and quarantine
outputs are separate so an empty informational run cannot overwrite failures.

Keep all existing assertions, timeouts, zero retries, strict CSP and eager
routes unchanged. The under-fifteen-minute goal is measured after actual CI,
not a timeout or performance gate. Four jobs repeat check/units intentionally;
report unique unit coverage separately from those four executions.
Feature branches run verification only for pull-request events; main retains
push verification, manual dispatch and reusable invocation. Superseded runs
cancel, all shards finish even if another fails, and unique shard artifacts
remain best-effort. No runtime dependency, application or hosting change.

## 2026-09-12: PR build downloads without live preview infrastructure

Publish BSA/dist only from shard one of pull-request CI, with seven-day retention.
The upload and job-summary link are non-blocking; absent files or failed upload
cannot conceal verification failure or manufacture a download URL. Link only
the successful action's artifact URL and label it as a build, not a deployment.
Keep contents:read permissions and normal pull_request execution; no repository
write access, fork-secret exposure, PR comment token or live preview slot.

## 2026-09-12: Issue 48 selects the existing App Service

The owner's explicit new instruction supersedes SWA-only hosting. Preserve
`bsa-bsa-demo-r2j2l3dxhtohy` and its URL, F1 plan, Sweden Central location,
Node 24 runtime and anonymous access. Node 20 (latest patch, >=20.19) is used
only for the requested deployment build. No tier change, slot, new backend,
telemetry or frontend/business-code change is authorised.

PM2 built-in static serving does not emit the established CSP/custom headers;
the coordinator's old live HTTP 200 also lacked CSP. Package the existing
tested static-serving behaviour as dependency-free `server.mjs` and run it
under PM2. This necessary adaptation preserves the security contract rather
than weakening headers or injecting an unsafe shim. Rename the root policy to
`hosting.config.json`; keep all CSP directives identical. Bind `PORT` or
`SERVER_PORT` on `0.0.0.0` in App Service, localhost with PLAYWRIGHT_PORT in tests.

Build provenance records the actual Git HEAD, dirty flag and UTC time. Reject
dirty or wrong-commit artifacts in the hosted release check. Zip the contents
of dist, including the standalone server and policy, not the checkout or
node_modules. Hide server source/policy/hidden paths from HTTP; build-info is
public non-secret provenance. Missing assets remain 404, SPA routes fall back,
and fingerprinted assets use immutable caching.

Use main/manual OIDC with site-scoped Website Contributor and the existing
UAMI/federation. Five public identifiers live in repository variables; no
publish-profile or SWA token is used. Optional Bicep identity/RBAC bootstrap
defaults off because the grant already exists. F1 has no preview slots; PRs
receive CI/artifacts. Any S1 slot upgrade is a future explicit cost decision.

The coordinator owns all Azure mutations and initial committed-artifact
deployment before the main workflow triggers. Repository migration does not
claim that live release/recovery checks have occurred. Preserve #47's verifier
and four-shard CI; historical SWA records remain explicitly historical.

## 2026-09-12: Use GitHub's actual ID-bound federation subject

The first main deployment reached azure/login but returned AADSTS700213:
the signed subject includes immutable owner/repository IDs. GitHub API
independently confirms owner 101734401 and repository 1362745159. Update the
existing federation and recovery Bicep to the exact main-branch subject
`repo:WilliamNg18@101734401/BSA@1362745159:ref:refs/heads/main`.
Issuer, audience and site-only Website Contributor scope remain unchanged.
No wildcard, client secret or basic-publishing fallback is introduced.

## 2026-09-12: Serve a local browser icon

The first real-browser App Service check requested favicon.ico and logged a
404. Add an explicit same-origin icon generated from generic document shapes,
not external branding or a runtime dependency. Keep CSP and application
behaviour unchanged; validate the actual built icon response, not only its link.

## 2026-09-12: Preserve existing metadata during recovery reapplication

App Service recovery accepts independent `siteTags` and `planTags` objects.
For existing resources, pass the observed tag objects unchanged, including
empty objects; use the synthetic BSA defaults only when a resource is absent.
The read-only parameter exporter captures only names, resource types and tags,
writes outside the repository and returns only its temporary path. Azure read
failure is not treated as absence.

The coordinator reviews what-if and owns any Incremental apply to the existing
resources. No app, plan or resource-group deletion is part of this exercise.
Retain the current ID-bound federation subject and disabled optional RBAC
bootstrap. Measure only non-destructive reapplication/settings recovery, not
recovery from deleted resources. Refresh parameters if concurrent metadata
changes could make the snapshot stale.

## 2026-09-12: Bounded hosted and infrastructure closeout

Infrastructure is complete and frozen. No stream spends time on hosting, gates or tooling from here; all effort goes to the application.

This declaration covers the owner-selected App Service scope. Accept actual
clean-release live checks, main/manual OIDC, the shared four-shard
verification command, measured setup and PR artifacts, and reviewed Incremental
configuration recovery as the completed scope in INFRA-DONE. Reject both the
obsolete SWA token/preview prerequisite and a stronger destructive-DR claim:
the owner selected existing F1 App Service, which has no live preview slots.

Live acceptance remains pinned to `b813c6241cc084957a30c6bf48fdd65f623f33f6`:
13 checks/26 identities/six zero-violation axe audits, plus the separate
same-history mixed-mode pass. Current CI 34705318318 at `8bee3f2` passed 695
unique units and 1,055 partitioned blocking browsers in 6m25s. Unit runs on
each shard are not unique additional cases. Recovery took 82.08 seconds,
including unchanged tags and post-apply live checks, without deletion.

Preserve source-pinned screenshot/failed-run histories and keep compression
methods/artifact revisions distinct. Do not reuse a four-file frontend gzip
total for the seven-file portable App Service artifact. The coordinator owns
final documentation merge, latest-main OIDC and fresh URL/identity/header
verification before ALL DONE. Owner actions are none; future functional
hosting changes require explicit scope and recorded decisions, not speculation.

## 2026-09-12: Freeze clarity and perspective contracts before parallel work

Tasks 14-18 deliberately replace the earlier fixed-reference judging
presentation with the owner's total-effort model. Twelve Today minutes include
two judging minutes: gathering is ten, never twelve plus two. Assisted built
items cost two operator minutes, abstentions twelve. Existing sequential rounded
cohorts remain disjoint; caught/cleared items do not incur human judgement.
Default monthly hours are 17,000 Today and 255,002/60 assisted. The independent
built-case capacity comparison is 630 versus 3,780 items from 7,560 working
minutes; it is not a promise about mixed-cohort completions.

The original baseline function remains unchanged for legacy consumers during
the staged migration. New `monthModel`, its selector and shared hook return
all monthly values; no page may copy their arithmetic. The seven old gathering
inputs become proportional weights for the new gathering-only breakdown,
retaining their relative contributions without double-counting judging.
Invalid drafts return explicit errors and no result.

Perspective defaults to Both, filters presentation only and survives Reset.
Operational history, revisions and human decisions are never copied or filtered
in the store. N owns monthly presentation/model implementation; Q queue; P
claims; X perspective/navigation; V copy recommendations and visual/docs
acceptance. Coordinator owns frozen contracts/store and serialises shared
changes. Merge N, Q/P, X, V; every main merge uses existing App Service OIDC.

## 2026-09-12: Task 14 presents monthly effort separately from built-case capacity

Chapter 2 exposes only volume, total Today minutes and built-case judging
minutes before its two headline tiles. The Agent flag switches both tiles.
Chapter 1 reads the same monthly selector. The original `calculateBaseline`
remains unchanged for consumers migrating in later streams.

Seven gathering fields are relative weights, not extra minutes. Weights,
sequential cohort assumptions, the proportional flow and provenance sit inside
the initially collapsed Show the detail disclosure. The old separate built
review input is not presented by the monthly UI. Monthly operator effort
includes full manual fallback for abstentions; the independent 7,560-minute
capacity denominator describes built cases, not mixed-cohort throughput.

Public referral-subset context is visible beside the volume assumption and
available through a keyboard-focusable tooltip. It is never described as a
measured total exception queue. Exact owner-requested explanatory sentences
take priority over informational prose-count aspirations. Numeric count
transitions expose stable final accessible values, cancel on unmount and
settle immediately when reduced motion is enabled.

## 2026-09-12: Q queue windows and comparison authority

Task 15 (#58) replaces separate pinned, session and virtual queue surfaces with
one six-column, fixed-height table. At most fifty logical rows are rendered.
Counted audience filters and the displayed range describe that table, not
decisions written by a simulation. Pharmacy-caught model slots stay outside the
operator queue; the collapsed detail distinguishes its count from the shared
85,000 public referral-subset proxy. Twelve illustrative seeds replace model
slots, with an explicit outside-projection qualification for smaller volumes.
New session submissions move to the top without duplicating existing IDs.
Only explicit Open for review invokes the existing atomic arrival action.

The exact mode guides are qualified by a public-evidence tooltip and nearby
abstention/rule-clear exceptions. Pending submissions cannot be labelled built,
gate failures cannot display advice, and generated rows have no claimed evidence
or citations. Perspective hides the cross-side followed-claim shortcut in the
NHSBSA-only view, never filtering lifecycle storage.

The main comparison uses shared monthModel per-item costs: Today twelve minutes
including two judging, built gathering zero, abstention full Today cost.
One hour is sixty synthetic minutes over ten seconds; reduced motion presents
the result immediately. Projected human decisions and validated canonical
citation-use counters never write records. Historical decisions, rule-clear
rows and filler citations are excluded from new-decision/citation totals.
The old nine-hour, raw-weight simulation remains explicitly labelled legacy
behind a small disclosure; its original model is not silently presented as
the current twelve-minute assumption.

Both comparison operators use the same canonical citation eligibility after
their full gathering and judging work completes. At thirty synthetic minutes
the default citation counts are two Today and three assisted; at sixty they
are three each. This is a citation-use assumption, not evidence of poorer
manual quality. Eligibility reads the current revision's synthetic version,
consensus and validated clause with deterministic helpers, not a hidden agent
run. Missing clauses and historical/filler/abstention/rule-clear rows do not count.

## 2026-09-12: Evidence for the selected pharmacy's caught-before-submission count

A submitted ready snapshot does not establish that a missing endorsement was
caught. Record an immutable advisory event only after a person applies a
suggested correction and the matching completed precheck changes missing to
ready. Count one item per next submission revision, with pharmacy code and UTC
event time. Validate both snapshots and current revision in the shared store.
This record is neither submission nor lifecycle history, approval or payment;
all existing operational slices remain identical. Reset clears it. X owns the
narrow workbench capture; P consumes the selected-pharmacy count. The monthly
model's whole-cohort estimate remains separate from these observed demo actions.

## 2026-09-12: Independent perspectives share one operational session

Pharmacy, NHSBSA and Both are a native radio group immediately before Agent.
Both remains the default. The choice filters navigation and cross-side actions,
not lifecycle data, revisions, records or Agent. A hidden route retains its URL
and presents an explicit switch action instead of mounting the opposite page.
Single-side modes suspend the tour and Follow controls without discarding their
session choices. Reset retains perspective and otherwise keeps its existing
behaviour. Overview and How it works remain shared.

Production and live acceptance use the same UI-driven Off-then-On round trip,
without Reset or reloading the operational session. They compare the exact
submitted item, immutable attempts and recorded decision identity across side
switches. Live execution retains the existing before/after build-identity
fixtures and belongs to the coordinator after the integrated release, not to
an unmerged feature branch.

## 2026-09-12: Task 16 P keeps claims actions and recorded counts separate

Chapter 7 uses four counted synthetic-amount filters and one five-column
table. A selected item owns its correction, explicit resubmission or
confirmation, and compact audience-labelled history. The exact mode guides
are illustrative comparisons, qualified by keyboard-accessible provenance
help; neither one-click wording nor switching assistance approves a draft
or submits a correction. Off retains the recorded raw reason and rule code.
On displays only an actual operator-approved note, or explicitly reports its
absence. The existing editable correction and current-edit precheck remain
separate from the human submission action.

Selected-pharmacy monthly totals count distinct recorded items in the current
UTC month, with overlapping categories stated. Corrected/resubmitted requires
an actual resubmission revision; paid requires an actual paid event, never a
modelled referral residual. Catches count explicit shared pre-submission
correction events once per case and next submission revision. The shared
monthly model remains separately labelled whole-service context. Perspective
only hides links and Both-only following controls, never history or revisions.

## 2026-09-12: Task 18 separates baseline observation from final clarity acceptance

V owns documentation and screenshots, not concurrent N/Q/P/X source edits.
Use an agent novice-perspective review with three ten-second understandings
and a difference-demonstrating click for chapters 2, 6 and 7. Do not describe
this as human user testing or introduce a timed comprehension gate.

Keep the explicit 26-word queue guides despite the under-25-word narrative
aspiration; exact owner copy takes precedence and the count conflict is
informational. Capture all 18 chapter/mode/perspective combinations after
the coordinator's functional-merge notice, including four honestly labelled
opposite-side guards. Actual latest-main live observations and source-pinned
local images are separate evidence. Preserve all earlier captures and failures.

Correct obsolete no-live-URL and missing-CSP hosting prose using the existing
accepted b813c62 evidence, not a new infrastructure task. The actual Step 0
live baseline predates the redesign. Read retained source excerpts directly;
absence of original PDF/DOCX binaries prevents claiming fresh binary review
but does not permit stronger external-verification or internal-process claims.

## 2026-09-12: V accepts the bounded c0203fc clarity review

After explicit coordinator release, capture the actual deployed c0203fc build,
not the rebased V documentation SHA. Preserve the original eighteen capture
records, screenshots and unrestricted axe results, then record subsequent
full-height visual review separately. Keep baseline timestamps and the first
walk's corrected selector failure; neither is silently relabelled as final
first-run success.

The nine clarity points land as AI evaluator observations, not timed human
research. Stateful approval, correction, explicit resubmission, human acceptance
and no-Reset side changes require their own live checkpoints, not inference
from screenshots. The independent catch proof must show 0 to 1 while lifecycle
and attempts remain unchanged, then explicit submission and the same New queue
item. Reduced-motion capture context and exact visible monthly numbers are
part of the evidence; incomplete axe results remain manual-review caveats.

## 2026-09-13: One header Agent control and an explicit rollback promotion

The owner's sole Agent On/Off control is the top-right header switch. Remove
the queue toolbar switch and pharmacy's local Agent available switch, including
the latter's local state. All pages read `useAppStore.agentEnabled`; only
`top-nav.tsx` calls its setter. Reset retains its explicit seeded-state contract
(Agent Off, perspective unchanged), not a page-level override.

The pharmacy's missing/ready/unable results still come from the scripted check,
which is enabled only by the header. Manual submission remains healthy and
non-blocking. Historical unavailable snapshots remain valid domain records,
but there is no second UI control that simulates availability. Compare retains
its labelled read-only Today/With-agent projection and never changes the mode.
On-only actions are shown or hidden by the shared state.

Production and live Playwright tests cover every route, canonical case route,
tour stop and all three perspectives. They assert exactly one switch including
hidden controls, its location in the header, page response to both states, and
unchanged mode after navigation and comparison controls. A source regression
also restricts the setter to the header component.

Before this change, tag the current main
`80d955bdde6a7ef4e59ceb720d9c9a654efbe5e3` as annotated `lkg-2026-09-13`
with **Last known good after Tasks 14 to 18**, and move `last-known-good` to it.
This is explicit owner authorisation, not automatic rollback promotion.
`cowork-v1`, older tags and nine transfer checkpoint tags remain untouched.

## 2026-09-13: Freeze whole-process contracts before Tasks 19-24

The new brief explicitly changes Case A routing and adds D's proposed declaration
path; it is not permission to silently weaken uncertainty or human authority.
Code alone routes from facts, with no Agent/perspective argument. Agent state
may change advisory evidence, never automatically confirm capture or decide.
Channel and optional declaration live in immutable submission revisions;
revision-linked process metadata does not duplicate lifecycle or history.
M owns all authoritative transitions and consolidation into one store.

The public statement is **over** 100 million monthly items. Use 100 million as
an explicitly labelled conservative calculation baseline, not an exact published
total. Derived Type 1/2 shares are 2.2%/2%; the approximate 4% staff-touch figure
is not their exact sum. Staff streams can overlap: do not present touch counts
as mutually exclusive unique items without a labelled modelling assumption.
M must record cohort arithmetic before implementing it, conserve counts and
avoid treating the 85,000 referrals as all exceptions or all staff work.

Thirteen Type 2 seconds is the midpoint of the supplied 12-14 second range.
Four investigation minutes, six pharmacy completion minutes, 45 built-case
judging seconds and 20% caught before submission are explicit assumptions.
Initial abstention share is one of six canonical cases (D without a reconciled
declaration), not measured effectiveness. Proposed difficult-D keying/confirm
times default to 30/10 seconds, editable assumptions, not the public Type 1
average inferred from 880 items/hour.

Forty-five seconds is longer than thirteen seconds. Do not label it a universal
Type 2 speed-up. Separate routine Type 2 work, investigation-tail operator work
and pharmacy rework; clearly state denominators, whether phases overlap and
what cannot be summed. No invented additional referral reduction beyond the
labelled catch assumption. M chooses and records the smallest defensible
cohort allocation in the shared model, never independent view arithmetic.

Today "none" and "experience only" describe rule-recording in this synthetic
comparison, not proof that real operators never record or cite a rule. Existing
human decision reasons and historical rule records must remain immutable.
MYS, NHSmail, EPS and dm+d are the owner's explicitly required process terms;
the no-vendor/product/document rule still excludes implementation branding and
real medicine/product names, not these mandated channel/process identifiers.

Keep `lkg-2026-09-13`, older tags and `cowork-v1` unchanged. The one-header
Agent change remains in force. Each new public-process claim is owner-supplied
context, not a claimed fresh external verification or a real NHSBSA service.

## 2026-09-13: Task 23 presents separate process and referral measures

N's chapters consume M's frozen `useProcessMonth` result and the same store
inputs as operational views. The two monthly headline groups are referred-back
items and referral-loop hours. Operator and pharmacy hours remain separate
measures within that second group, never a combined labour total. Type 2 hours
sit beneath them with an explicit non-additivity warning: investigation overlaps
the Type 2 cohort, and 45-second built-case judgement is not a speed-up over a
13-second average. No independent cohort arithmetic is introduced in views.

The two comparison columns stay visible. Header mode changes replay the existing
reduced-motion-aware number animation, with exact endpoints and stable accessible
values. All fourteen process inputs are available through one reusable editor on
the month and assumptions pages. The old assumptions register is retained only
inside a collapsed, explicitly historical referral-only comparison.

Public process context is qualified as owner-supplied and not independently
verified. Figure provenance lives in keyboard-accessible tooltips. Today zero
rule records and experience-only assurance describe this synthetic comparison,
not all NHSBSA staff. Existing human history is not changed.

The process diagram branches: complete items bypass staff, uncertain capture
uses Type 1 and rerouting, and interpretation uses Type 2 with a human decision.
Pharmacy-corrected items still enter normal processing; they avoid a referral,
not submission. The boundary labels poor-paper declaration pre-fill **proposed**:
fields are declared by the pharmacy, not read from the form. Human confirmation
is required, and irreconcilable evidence follows today's path.

## 2026-09-13: Task 20 pharmacy process follows recorded authority

P reads receipt contents directly from immutable shared case revisions, retaining
only the selected case/revision as local presentation state. The pharmacy
timeline replays recorded events rather than inventing future referrals or Paid
events. Playback cannot perform a submission, capture confirmation or decision.
Monthly service projections consume `useProcessMonth`; selected-pharmacy
recorded counts remain separate, including actual correction evidence.

Channel is local submission input, not another global control. EPS carries
typed claim text; Paper starts with empty declaration fields alongside the
synthetic form. Product, quantity, endorsement and optional prescriber are
explicitly pharmacy-declared, never represented as image reads. D's proposed
complete declaration still needs human Type 1 confirmation and Type 2 judgement.
The existing gate is not weakened for an unreadable prescriber.

On correction/resubmission rechecks current declaration/text through the shared
checker. Applying a fix does not submit. Referral advice is visible only when
the actual operator-approved note exists; Off preserves the raw human reason.
Legacy decisions without an RB code say it was not recorded, rather than
retroactively inventing a code. MYS/NHSmail and payment timing are public process
context, not services implemented by this static demonstration.

## 2026-09-13: Task 22 staff views follow the current submitted revision

Q replaces the mounted virtual referral projection with an actual-session
Type 2 worklist and a separate shared Type 1 capture lane. Monthly automatic
pricing and workload figures come from `useProcessMonth`; they are explicitly
not session completions. Automatic no-human items have no work rows. A later
human Type 2 decision remains inspectable, and F's original record is retained.
Current routing metadata must match the latest revision; inconsistent metadata
withholds actions and reports an error rather than guessing from seed case state.

The Type 1 lane and case pack embed U's single store-connected component.
Confirming capture does not approve a Type 2 decision. Manual Type 2 review
exposes the synthetic monthly Tariff for unaided lookup and M's RB catalogue;
assisted referrals require explicit approval of the proposed draft. Reasons,
RB codes and approved rules are written only through M's decision API.
Q requires a human reason for every recorded decision, including accepting a
sufficient recommendation, rather than inventing a reason for an empty field.
The UI's Accept recommendation resolves to its actual disposition before
calling the new API; it must not confuse a referral recommendation with ACCEPT
as the API's sufficient outcome.

Agent Off is an experience-only comparison, not a destructive audit filter.
Actual human reasons and original rule versions remain available in immutable
record history in both modes. Agent On never manufactures a rule retrospectively.

## 2026-09-13: Task 21 U proposed paper declaration confirmation

The unreadable-paper design is proposed, not existing NHSBSA functionality.
One store-connected `Type1Capture({caseId})` surface is shared by the queue and
case pack. The original synthetic poor image is displayed without changing its
quality, extracted prescriber or read-confidence evidence. Agent On cannot read
it. Fields are prefilled only from the immutable submitted pharmacy declaration,
each labelled "declared by the pharmacy, not read from the form".

Human edits remain a local draft until explicit confirmation through M's
`confirmType1`. A separate unchecked human-reconciliation checkbox is required
for declaration provenance and clears after any field edit. A successful typed
check never checks that box. Irreconcilable evidence has a blank manual-capture
path; unknown values stay null rather than being guessed. Product, quantity,
endorsement and the parent's added prescriber field are captured. A missing
prescriber cannot be waived to produce a built recommendation.

M alone validates authority, compatibility, revision and routing; the new
paper-capture helper only prepares drafts and confirmation input. Type 1 capture
never records a Type 2 judgement. A compatible complete confirmed declaration
may support a built Type 2 case with a retrieved dated clause; other evidence
remains manual or withheld, and insufficient D may be referred back with RB2B.

The stopwatch is a step-through illustration, not elapsed work or a lifecycle
clock. Today keying and declaration confirmation consume shared editable
`type1KeySeconds`/`type1ConfirmSeconds` assumptions, default 30/10 seconds.
These describe this difficult example, not the public 880-items/hour average.
Static results and keyboard-operated timing steps need no animation and work
unchanged under reduced motion. N owns the matching proposed boundary label;
V owns integrated browser/axe and live evidence.

The parent-owned perspective guard retains an already visited page as hidden
and inert at the same URL. U's pending fields and explicit checkbox therefore
remain local presentation state across perspective switches, not a second
operational store. Real route navigation discards the draft; Reset clears it
even when the new seed has the same revision number and timestamp.

When confirmed values differ from the immutable declaration, the submitted
capture provenance is `human_capture`, not `pharmacy_declaration`. An explicitly
checked reconciliation remains true for that human correction; compatibility
and the mandatory evidence gate still decide whether advice can be shown.
The original declaration stays visible and unchanged.

The shared capture surface also accepts readable handwritten paper items.
Only genuinely poor image style or quality below the existing threshold gets
the poor-scan/cannot-read wording. D keeps its guaranteed Type 2 continuation;
other items use a neutral confirmation label because code may route complete
captured evidence to existing pricing. This changes copy, not routing authority.

## 2026-09-13: Task 19 shared process allocations and capture authority

Before implementing the arithmetic, M notified the coordinator and received
approval for these scenario allocations. Round EPS items, with paper the
remainder. Round Type 1, Type 2 and staff-touch counts separately; automatic
items are total minus staff touch. Validate maximum lane count <= staff touch
<= sum of lanes. The derived lane overlap is a modelling reconciliation of
approximate public figures, not a published unique-item count.

Round pharmacy catches from the referral cohort only. Assume those caught
items would have reached Type 2, subtract them once, round abstentions from
the surviving Type 2 cohort, and assign the remainder to built cases.
Referrals cannot exceed Type 2 and catches cannot exceed referrals. No further
referral reduction is invented. Type 2 today uses 13 seconds; assisted built
cases use 45 seconds and abstentions retain 13 seconds. Assisted Type 2 hours
can increase. Investigation-tail hours use referrals times four minutes and
pharmacy completion uses six minutes, before/after the single catch reduction.
Type 2 and investigation-tail metrics are nonadditive because the published
average does not establish disjoint time phases; pharmacy hours concern a
different workforce. There is no combined operator grand total.

Today zero rule-recorded decisions and experience-only assurance describe the
comparison assumption, not real operators or immutable historical records.
The difficult-D 30-second keying and 10-second confirmation assumptions are
not the public Type 1 average.

The coordinator supplied capture-contract amendments as isolated commits.
Only explicit Type 1 confirmation on the current revision projects captured
evidence. Source image, low confidence and disagreeing readings stay unchanged.
Reconciled compatible declaration fields carry declared-not-read provenance.
The optional prescriber field must be explicitly entered and confirmed when
the source says Illegible; missing prescriber never receives a gate waiver.
This is a proposed evidence path, not validated image recognition.

Receipt and queue compatibility modules select nested slices of the single
application Zustand store. Queue playback is presentation only. The optional
test observer exposes a deeply immutable domain snapshot, no actions, and is
compiled only when VITE_E2E_STATE_OBSERVER=true. Normal builds have no hook.
Q approved the M-first automatic-row filter and disabled legacy generated
operator rows; its full staff-lane presentation follows this shared model.

## 2026-09-13: Task 22 draft approval is optional, never inferred

The coordinator confirmed that a human may choose their own reason and RB code
without using the proposed agent draft. Require at least eight trimmed
characters for the actual human reason and a catalogue RB code for referral.
Include `approvedDraft` only after the explicit checkbox is checked. Agent On
alone never approves, sends or retrospectively supplies a draft. An unchecked
draft must not block an otherwise valid human decision or become an approved
pharmacy note. This clarifies the earlier Q approval wording: approval is
mandatory for use of the draft, not mandatory use of the draft itself.

The final process API keeps completed human work in its original lane:
Type 2 sufficient is `type2_endorsement` with `requiresHuman=false`, and
completed Type 1-only work similarly remains Type 1. Only untouched rules
pricing is `auto_priced`; human work must never acquire a no-person label.
New Type 2 decisions always require an actual human reason of eight characters
or more. Legacy entry points retain their existing reason contract.

Capture proof is appended to the Type 1 history event, linked to its revision.
The pharmacy submission revision is never enriched or rewritten after capture.
Historical projection retrieves that event even after resubmission clears the
current capture cache. Legacy resubmission preserves the current revision's
channel; only an explicit process submission can change channel.

Automatic eligibility checks every mandatory field independently of Agent
advice, including a nonblank legible prescriber and a positive whole quantity.
Empty endorsements are valid missing business information for submission,
not malformed requests: paper may require capture and EPS may require Type 2.
Pending synthetic seeds use staff-work templates, never an automatic routing
result paired with a submitted lifecycle.

For the direct canonical D demonstration only, the immutable seed revision
includes an explicitly synthetic prior pharmacy declaration: SYN-COCOD-100,
quantity 100, `NCSO AB 27/08/26`, and `Dr Demo (synthetic)`. It is not a reading
of the scan and does not confirm, reconcile or decide anything. The On
presentation may prefill it for explicit human confirmation; Off still keys.
Fresh paper submissions without declarations do not inherit this seed evidence.

Machine seed channels come from `claim.submittedVia`, not the contradictory
legacy form-image display label: A/D paper; B/C/E/F EPS. Runtime projections
display that machine channel while original fixtures and history stay intact.
Both generic legacy submission APIs and the receipt adapter preserve the
current revision's channel. Only explicit `ProcessSubmission.channel` changes
it. No scenario-derived automatic conversion to EPS is permitted.

P's actual submission regression showed that BB/XP could satisfy their broad
synthetic clause fields without being eligible for automatic routing. The
automatic endorsement path is limited to complete NCSO evidence in this demo;
other present endorsement types require Type 2 interpretation. This routing
classification is identical with the Agent Off or On and does not trust an
advisory precheck status.

## 2026-09-13: Task 23 applies provider-neutral copy to Architecture

The latest owner brief bans implementation vendor and product names across the
interface, superseding the earlier Architecture-only exception. At the
coordinator's explicit direction, N changes the architecture diagram and
proposed-service presentation to capability roles: event messaging, deterministic
functions, governed orchestration, versioned search, records, identity and
observability. NHSBSA ownership, proposed status and exact tool contracts remain.

The shared display helper applies aliases only to presentation strings. Original
domain mappings, source evidence, versions and stored audit records are not
rewritten. Required NHSBSA, MYS, NHSmail, EPS, dm+d and Tariff process vocabulary
remains permitted. No hosting or infrastructure change is made.

## 2026-09-13: Manual Type 1 capture is not declaration reconciliation

A complete, matching non-D human capture now reroutes as read without asserting
that a pharmacy declaration was reconciled. Factual captured-field agreement is
a separate pure check from the existing declaration-trust predicate. Both
paths still require known product, matching source quantities, complete
mandatory evidence and the existing endorsement rules. Completed Type 1 work
retains its human-capture origin rather than becoming a no-person item.

Pharmacy-declaration captures still require explicit reconciliation. D's
proposed path retains that requirement and its unchanged agent trust checks;
manual D still requires Type 2. Conflicts, unknown fields, original revisions
and append-only capture history are preserved. The regression uses the real
manual form-preparation helpers with reconciliation false, not an injected
checkbox value or an Agent-dependent routing condition.

## 2026-09-13: Unknown reconciliation is not source agreement

Final visual review found that an empty conflict list incorrectly labelled D's
unknown product and quantity as agreement. Reconciliation now has an explicit
`not_established` signal. Material conflicts retain precedence; agreement needs
known comparable product/quantity fields and trustworthy original capture or
compatible human-confirmed capture. The trace, confidence list and case pack
consume that single derived result, never infer agreement from zero conflicts.
Unknown reconciliation is neutral and not satisfied in the interface and forces
abstention when earlier structural checks have not already done so. Existing
stop reasons, captured-evidence trust and the original poor image stay intact.

Established comparisons say "Comparable fields agree" and explicitly exclude
missing or unreadable evidence. The generic in-review lifecycle label says
"Awaiting operator" in both modes; it cannot retrospectively claim a case was
built before capture. Historical records and lifecycle events are not rewritten.

## 2026-09-13: Tasks 25-30 contracts and single-pharmacy boundary

The new owner brief supersedes the five-pharmacy demonstration and the previous
monthly headline model, not the authority or immutable-history boundaries.
Hillcrest Pharmacy (FQ123) is the only operational pharmacy. All actionable
synthetic cases and revisions belong to it. Other synthetic pharmacy names are
fixed, unclickable queue background outside lifecycle/revision data and counts.
Remove the pharmacy selector immediately; C replaces the transitional month
with the requested continuous-cycle seed. Do not rewrite F's original decision
to make a new paid-after-correction story: preserve history and append or seed
explicit subsequent correction/pricing events.

Freeze `EpsPrescription` and `PaperDeclaration` in domain/types.ts, and optional
immutable copies on `CaseRevision`/`ProcessSubmission`. Existing declarations
retain their original schema; the new typed paper form is additional source
content, not a claim that the image was read. C implements validation, storage
and projection of these fields before E/U submit them. No dummy implementation
or automatic capture/decision is supplied in Step 0.

Freeze `ManualLoopMonthInputs`, defaults, provenance/definitions,
`ManualLoopMonthColumn`, `ManualLoopMonthResult` and the selection/store shapes
in baseline.ts. N implements the typed `monthModel` overload and shared
`useManualLoopMonth` selector, then migrates all current figures. Existing
overloads remain genuine historical calculations until their callers migrate.
Every current consumer uses the same new result, never independent arithmetic.

The 85,000 public referral figure is the chosen manual-loop denominator, not
all NHSBSA items reaching a person. Chapter 1 retains over 100 million, about
four per cent staff touch, and the distinct Type 1/2 public context.
At defaults: 68,000 prevented, 17,000 remain, 11,900 clear before the queue,
5,100 enter judgement, 255 abstain and 4,845 are built. Shares are sequential:
prevention from the manual loop; clearance from its remainder; abstention from
the remaining queue. All post-clearance cases are assumed still deficient and
referred back; do not invent a further unprovided efficacy share to improve
the headline. The 70% clearance assumption models code clearance for workload
accounting. Any claimed human-confirmed clearance must also count that person's
judgement, never hide human work as zero-time code.

The owner explicitly selected **297.5 total With operator hours**: 255 judging
hours plus 42.5 manual gathering hours for abstentions. Do not show 255 as the
total or omit abstention labour. Today is 19,479.166666... hours: 85,000 ten-minute
gathers, 85,000 three-minute first judgements and 21,250 second judgements.
Pharmacy completion is separately 8,500 versus 510 hours at six minutes.
No double-check With is an assumption. Five per cent abstention is an assumed
synthetic scenario rate, not an observed proportion of six canonical fixtures.
Zero Today rule records is a labelled synthetic comparison, not a factual
claim about real NHSBSA staff; actual historical records remain visible.

The requested example sentence is longer than its own under-25-word limit.
Use equivalent generated copy below 25 words, with totals labelled correctly
and "estimate" on every With figure. Required clinical example text is allowed
as synthetic prescription content; the no-product rule prohibits implementation
branding, not the explicitly requested medicine name. No real patient details,
clinical dose advice or real tariff text are introduced.

Merge order is Step 0, C and N, then E/U/Q, then V. C owns lifecycle/store/domain
seeds and new cycle-equivalence tests; N owns baseline/model/figure components.
E owns the EPS component and pharmacy shell; U owns a separate Paper component,
Type1 and D support, never E's shell. Q owns queue/pack/trace/record. N extracts
shared projection components for Q/E rather than competing edits. V owns other
e2e/live tests, tour and docs. Model-store shared edits require an isolated
commit handed to C; no simultaneous hidden copies. Append decisions per stream.
The coordinator serialises integration, browser slots and final release gates.
Existing App Service, strict CSP, protected refs and old evidence are unchanged.

## 2026-09-13: Task 28 defensible referral-loop implementation

N implements the frozen manual-loop overload without replacing either genuine
legacy calculation. The same application store holds raw editable drafts;
invalid drafts remove all current estimates rather than reuse a prior result.
C supplied the isolated store integration, including snapshot and Reset.
Current figures use `useManualLoopMonth`. The queue and pharmacy owners import
shared zero-prop projection components instead of reproducing arithmetic.

Each outgoing percentage cohort rounds once to an integer; subtraction keeps
the remaining cohort exact. All four shares are independently editable:
Today double-checks, pharmacy prevention, subsequent code clearance and final
queue abstention. No additional deficiency fraction is invented. Abstention
retains manual gathering, and all queued items receive a first judgement.
With total is 297.5 hours at defaults, not the 255 judging-hours subtotal.
Pharmacy MYS effort stays separate. Whole-service public context is not this
referral subset and is not relabelled as all operator work.

Numeric bounds are one billion items, 100 per cent, 1,440 minutes and 86,400
seconds. Count fields require integers; other fields accept decimal notation,
including zero. Decimal text is checked before conversion to reject rounded
out-of-bound values, overflow, underflow and non-decimal input. Impossible lane
overlap or a referral subset exceeding Type 2 fails explicitly. Zero With
hours or an unrepresentable ratio produces a labelled unavailable ratio,
never infinity or claimed infinite savings.

One shared formatter supplies all numeric endpoints. The generated comparison
is below 25 words, counts total operator hours and retains the permanent
labelled-assumptions line. Five per cent abstention is explicitly an assumption,
not a measured six-case rate. Projected full rule-and-reason coverage includes
documented abstention as a scenario assumption, not invented retrieved clauses
or evidence about actual historical records. Human confirmation labour is not
hidden inside code clearance. No payment, lifecycle or decision authority changes.

The first exact-head CI passed all 983 units but exposed stale browser copy and
snapshot expectations, plus a clock-instrumentation deadline in the combined
monthly replay test. Its trace shows each one-second virtual advance taking
about 6.2 wall-clock seconds across the expanded animated figures, not a failed
midpoint or endpoint. Test On and Off transitions independently within the same
unchanged 30-second deadline. Both retain every metric's midpoint, accessible
endpoint, final value, live reduced-motion cancellation and Reset assertion.
Fast-forward only settles the opposite-mode setup, never an observed animation.
Application motion and verification thresholds remain unchanged.

## 2026-09-13: Task 25 continuous Hillcrest state and source contracts

The operational seed contains exactly eight Hillcrest items: A and E are
automatically priced, D awaits paper capture, B needs pharmacy action, C needs
information, SYN-FQ123-TYPE2 awaits generic-supply judgement,
SYN-FQ123-RECHECK awaits re-check, and F is paid after correction.
F's original DR-000871, first revision and historical events remain unchanged.
Its later correction, human DR-000872 and existing-engine pricing are separate
append-only events. There are no operational filler or other-pharmacy rows.

EPS submissions retain one immutable prescription item; additional items are
explicitly rejected rather than silently discarded. Source endorsement copies,
known synthetic product codes and names, channel, valid dates and submitted
claim state are validated atomically. An optional observed revision rejects
stale drafts. The source dispensing date selects the actual rule version.
Typed paper declarations map exact catalogue names or synthetic codes to legacy
capture fields without inventing a prescriber or making the image legible.
Separate prescriber evidence requires explicit pharmacy or human capture input.
Supplying both declaration contracts requires matching product, quantity and text.

Generic supply requirements belong to the dedicated synthetic product and dated
rule, not the presence of optional supply evidence. Omitting that payload cannot
clear or approve the item. Legacy same-channel EPS correction adapters retain
the full source and its supply obligations while appending the new endorsement.
The source extension and deterministic helper/gate were coordinated with E and U.

An actual referred item's resubmission remains pending human re-check, including
complete EPS corrections. A new complete EPS demonstration submission still
prices automatically. D and interpretation-required paper capture route to
Type 2; ordinary complete initial Type 1-only capture retains existing code
pricing. Human-completed work never becomes a no-person automatic count.
Every lifecycle label uses the same words across perspectives.

The new continuous-cycle browser proof follows D alone through submission,
capture, RB2B referral, pharmacy correction, a new paper revision and capture,
human acceptance, existing pricing and Reset. The read-only gated observer
compares complete snapshots after each action in Both and switched views,
separately with Agent Off and On. Timestamps and IDs are controlled, not removed.
The ordinary production build never gains a writable observer or test API.

## 2026-09-13: Task 25 independent source-authority review repairs

Independent review identified four source/provenance defects. Five focused tests
reproduced all four before repair, including both recheck modes. The original
failed reproduction is retained; passing amended assertions are not substituted
for that evidence.

The generic supplemental item now has its own prescribed identity rather than
falling back to the ordinary E product when source payloads are omitted. A typed
paper declaration requires explicit capture before it can support pricing;
neither its fields nor its product are silently treated as a template image read.
Missing generic supply evidence still blocks acceptance after that capture.
Ordinary initial readable paper without a declaration retains its existing
automatic route. Prescribed/dispensed EPS product substitutions are rejected:
this demonstration has no approved substitution workflow.

Legacy pharmacy helpers and explicit retained-declaration replay preserve the
paper source and dispensing date in the next immutable revision. A new explicit
paper submission with neither declaration payload does not inherit declaration
or capture authority. Unknown human capture remains possible, but product codes
must be explicitly synthetic.

Current revision history projects pending human recheck and completed human
pricing separately into the common case input. Routing and the agent pack now
agree: an assisted corrected referral builds a sufficient recommendation for
human review rather than claiming untouched automatic pricing. Completed human
work cannot later acquire a no-person pricing explanation. New complete EPS
submissions still use automatic pricing when their own evidence permits it.

## 2026-09-13: Task 27 proposed declaration and human evidence boundary

U exports a self-contained `PaperPharmacyCapture` with optional `caseId`, default
canonical D. E owns mounting it; Type1 retains its shared `caseId` API for Q.
Off has no declaration entry or precheck: the human posts paper and staff
capture manually, then make a separate Type 2 judgement. Weeks of delay and
30/10-second key/confirm illustrations are narrative assumptions, not measured
service timings. Timing uses N's shared manual-loop hook and editable inputs.

On checks typed product, quantity, endorsement and dispensing date against the
dated synthetic Tariff, never against a pretend successful image read. The
explicit worked-example action enters Co-codamol 30/500 tablets, 100, NCSO JB
27/08/26. It does not provide a prescriber or confirm capture. C freezes the
paper declaration, maps the legacy code/quantity/text and projects its date
for rule selection. The original scan is rendered from the retained template,
so a declared date cannot silently rewrite the image.

Type1 prefill and checkbox start without reconciliation authority. A person
must review the declaration including its date, explicitly confirm or correct
fields, and supply separately established prescriber evidence when missing.
Date correction requires a new pharmacy submission, not mutation of the old
declaration. Missing, conflicting or unreconciled captured evidence abstains.
Only complete compatible human-confirmed evidence can yield a proposed Type 2
Sufficient recommendation. It never decides or prices. Original D image quality,
raw readings and canonical abstention reasons remain unchanged.

By coordinated C/E handoff, U also adds the retrieved monthly synthetic generic
supply clause and fail-closed agent/gate support. The registered generic product
requires its supply evidence even if the optional payload is omitted. Canonical
E remains automatic no-model clearance; a generic EPS review does not call an
image-reading tool. This foundation is isolated for C's earlier integration.

The Paper workbench's Post action always starts an explicit new synthetic
attempt, like the EPS workbench. It does not silently turn into a correction
because its selected fixture has a prior referral. Existing referral correction
and resubmission remain in claim details, with C's required human re-check.
This preserves ordinary complete paper B's initial capture-to-code-pricing path.

Paper explanatory copy stays below 25 words per existing functional panel.
The main submission narrative and nested declaration-check panel are counted
separately; medicine fields, exact rule quotations, requirement statuses and
field-associated provenance labels remain visible structured evidence. Error
messages replace the main narrative rather than accumulating duplicate prose.
Focused tests count both Paper variants, both modes and all advice outcomes.

## 2026-09-13: Task 26 visible EPS source and explicit correction

The EPS panel displays a synthetic prescriber message separately from the
dispenser's claim. Dose is a non-clinical placeholder. It cannot display an
unreadable image or enter Type 1. The shared read-only message component uses
recorded source snapshots; it never fills gaps in historical evidence.

The dedicated generic product SYN-AMOX500-GENERIC-21 activates the synthetic
monthly supply rule even if its optional evidence object is omitted. Source
manufacturer, pack and form checks are shared with routing and the compliance
gate. Canonical E keeps its original automatic no-model outcome. The additional
generic example uses the already seeded SYN-FQ123-TYPE2 item, not a ninth item.

An explicit Apply correction edits the draft only. Initials must be supplied by
the person dispensing; the date suggestion uses the displayed synthetic
dispensing day, not the computer's current date. Supply suggestions identify
their exact synthetic reference value before the person applies them.

Send claim creates a new demonstration attempt on the same item, retaining
all earlier receipts and history. Correcting an existing referral remains the
claim-view resubmission action with mandatory human re-check. Agent Off sends
the literal source fields and an unchecked snapshot without invoking advisory
interpretation. On only announces automatic completion when the same
deterministic routing function used by Send returns automatic pricing.

## 2026-09-13: Source-backed human-applied EPS correction evidence

The first E draft CI exposed a genuine missing connection: Apply changed the
draft but no longer recorded the existing caught-before-submission event.
Restore that connection rather than replacing its actual count with an estimate.

The existing correction API accepts optional immutable before/after EPS sources.
Code validates source copies, unchanged prescription identity and current
revision, then recomputes both checks and their snapshots. Same-text generic
corrections are valid only when supply fields genuinely move missing to ready.
Partial multi-gap fixes do not count; final completion counts once per item and
next revision. No correction event submits, decides or changes lifecycle.

Editing, switching scenario, leaving the page, turning assistance Off or
submitting before the new check finishes cancels the pending event. Reset
clears recorded events; perspective changes preserve them. Legacy callers
retain their original validation. This extension belongs to E, not C's already
reviewed critical-path source candidate.

## 2026-09-13: Correct generic EPS referrals on the same claim

Review found that the generic workbench could send a deficient supply claim,
but the claim-detail correction form only edited endorsement text. Retaining
the missing supply fields made the new generic referral impossible to repair
through its intended resubmission path.

For the dedicated synthetic generic EPS product, claim details now expose
manufacturer, pack size and form from the recorded source. Editing any field
invalidates the displayed check. Explicit resubmission stores an updated EPS
source with the current revision guard, leaving earlier sources and decisions
immutable. The existing text and paper correction paths are unchanged.

Field readiness is separate from permission to price. A dedicated prospective
resubmission projection retains required human recheck; the interface says
Ready to resubmit, never automatic pricing. The same synthetic requirements
must resolve before human acceptance. The browser proof uses missing form with
RB2B and a recorded human reason, then follows that same item to human-accepted
Paid rather than starting another demonstration attempt.

## 2026-09-13: Task 29 staff views preserve operational and recorded truth

The four queue filters are stable across assistance modes: Type 1 capture,
Type 2 worklist, referred back and Decided. Shared lifecycle labels name the
same item identically in pharmacy and staff views. Advice remains a separate
column, never an alternative operational state. Automatic revisions have no
operator row; completed human work retains its human route in Decided.
Other pharmacies remain fixed, unclickable background outside item counts.

EPS evidence is the retained electronic prescription or actual claim fields,
never a reconstructed paper image. Historical claims without a prescription
snapshot explicitly disclose that absence rather than invent patient or
prescriber evidence. Paper keeps its original image. Confirmed declaration
fields retain declared-not-read provenance, operator, timestamp and revision;
agreement with a claim never asserts that an unreadable image was read.

Today offers unaided monthly Tariff lookup, the RB catalogue and a human reason.
Assistance provides a gated recommendation and optional draft. Sending a draft
requires explicit human approval; a person may use their own reason instead.
Every decision and override still requires a reason. Viewing or replaying a
case never writes operational history.

The rule-and-reason label requires an actual recorded clause or validated
historical citation plus a non-blank human reason. Agent On does not fabricate
this proof. The synthetic Today experience-only comparison is qualified and
does not hide F's original sources or any later correction record. Automatic
trace views do not show fictitious human gathering, including when Agent is Off.

## 2026-09-13: Task 30 six-chapter stakeholder rail

The owner explicitly requested the closing chapter as chapter 6. The
coordinator approved six chapters with all nine existing stops retained:
Real process, A month in numbers, Evidence to a decision, Cases and boundaries,
One continuous cycle, and The central bet. Chapter 5 includes the original
two-places overview, pharmacy check, NHSBSA queue and pharmacy claims in order.
No route or hash is removed; every old operational deep link remains valid.
The menu selects six chapter starts while Next/Back and Alt-arrow shortcuts
continue through all nine stops. Cases retain their four examples and gain
an explicit link to the proposed evidence boundary.

The two-part demo script starts with five minutes in chapters 1-3, one toggle
flip per chapter, before Hillcrest's live examples and chapter 6 close. Its
paper example separates the frozen declaration from mandatory human prescriber
evidence. A complete declaration never establishes image agreement or confirms
capture by itself. The closing prevention rate must use the shared editable
model once N supplies it; all With numbers remain estimates and the selected
297.5-hour total includes abstention gathering.

This is preparation, not final acceptance. New Task 30 live exports and
full-height reviews must use a new evidence directory after coordinator
deployment approval. Old Task 24 failures and repaired captures remain
immutable. The parent retains final MEMORY/PROGRESS/SCOPE ownership until
functional integration; V does not claim ALL DONE before final gates.

## 2026-09-13: Task 30 evidence preparation, not release acceptance

The extended live inventory names 29 checks: the existing 20, five explicit
Hillcrest/EPS/declaration/boundary/rail checks and four same-D cycle checks
for Both/switched perspectives with Agent Off/On. Discovery is not execution.
The reporter still rejects partial selections, missing or duplicate names,
retries and unexpected checks as full acceptance. Production checks never use
the domain observer; the root check explicitly requires its absence.

New full-page captures scroll to the top before taking a screenshot and record
document height alongside viewport, source hashes and capture-time pending
review. This does not mark any image reviewed. Final exports must use a fresh
Task 30 directory after coordinator deployment approval; manual full-height
review and keyboard/contrast observations remain separate pending gates.

The chapter 6 central bet reads the shared editable prevention rate, not a
hardcoded 80%. Invalid input replaces it with an explicit unavailable message.
The six-chapter/nine-stop keyboard route sequence is preserved. The model's
297.5 total With hours includes abstention gathering.

Compatibility commits remain phase-specific: N numerical contracts, C seed and
human recheck, E/U visible claims and paper forms, Q staff lanes and record
proof. Old ordinary complete-paper coverage is retained through its real
form and human capture, not replaced with an observer mutation or deleted.
No final live, complete visual review or ALL DONE claim is made here.

## 2026-09-13: Task 30 staged runtime and evidence release

The coordinator approved two V deliveries without changing the service,
deployment workflow, identity or merge order. After C/N/U/E/Q are actually
merged, V's functional pull request is rebased onto main and supplies the
six-chapter runtime, complete 29-check inventory and demonstration documents.
Its exact four CI checks and coherent complete local rehearsal must pass before
the coordinator merges V last and deploys main through the existing workflow.

Only that deployed six-chapter main can receive the final 29-check hosted run
and independent full-height image review. The old eight-chapter deployment
cannot pass the new rail check by substitution. No feature-branch deployment,
new preview slot, OIDC change or temporary hosted bypass is authorised.

A separate V documentation/evidence follow-up preserves the immutable hosted
export, every actual full-height review, manual keyboard/contrast observations,
prose findings and final tracking. It contains no application, runtime or
hosting configuration changes. Any real visual defect is fixed and recaptured
before acceptance. That follow-up also requires four exact green CI checks;
the coordinator then repeats the complete hosted inventory on latest main,
checks the URL within ten minutes and confirms the protected-reference gates.
ALL DONE remains withheld until the whole release, not merely functional V,
has completed those gates.

## 2026-09-13: Generic correction expands final acceptance to 30 checks

The coordinator required an additional named check after the generic EPS
referral path lacked editable supplier fields in claim details. E restores
brand/manufacturer, pack size and form correction using the existing
resubmission and human re-check APIs. V adds a full same-item hosted check:
unchecked submission, human referral, structured correction, explicit
resubmission, human acceptance and Paid with unchanged earlier attempts.

The final named inventory is now **30**, not the earlier 29-check rehearsal.
The original 29/29 local result remains valid only for its historical source
and inventory; it cannot substitute for the expanded final local or hosted
run. The generic check deliberately includes a missing presentation so its
human-selected RB2B code matches the recorded correction request. It does
not claim RB2B is a public brand-only referral code.

## 2026-09-13: Tour cards must describe the current evidence

The case-card capture guidance now reads the current immutable revision's
declaration presence, actual paper quality/style and current process channel.
Agent On alone does not establish a pharmacy declaration. Undeclared paper
keeps explicit manual capture guidance; readable paper is not labelled
unreadable. Code routes confirmed evidence, with Type 2 only when required.
Manual EPS tasks name the claim message, not a nonexistent image.

Five rendered regression cases cover B EPS Off, B readable paper Off/On
without a declaration, D undeclared On and D declared On. They preserve
complete store identity and assert fewer than 25 explanatory words in each
capture panel. This corrects presentation only, not source fields, routing,
capture confirmation or decision authority.

## 2026-09-13: One bounded repair after the complete b05 visual review

The initial b05 hosted inventory passed all 30 checks, but its independent
58-image, full-height review failed. The original capture bundle, failed review,
manual observations and F02 correction remain immutable. F02 is not a defect:
three abstention reasons and four failed structural signals are distinct.
No signal, reason, gate, fixture, arithmetic or decision authority changes.

The coordinator authorised one presentation-and-verification repair batch.
Generated mandatory-field checks say supplied, never implying a poor image was
read. Capture summaries distinguish a human reconciliation attestation from
proven source agreement. EPS Off describes hypothetical incompleteness risk
without running a hidden check. Tour recommendations use the existing readable
label mapping; original enums and audit records remain untouched.

The ten natural explanatory-panel groups identified by review are condensed
cumulatively below 25 words. Initial D reasons have concise display aliases;
the original three domain reasons, five signals and immutable trace remain
unchanged. Required field provenance, rule quotations and stored audit records
are not truncated. Tests cover complete, missing, unsupported, conflicted,
manual and assisted variants, including all operator choices and optional
human draft approval.

The same batch fixes the observed mobile navigation class serialization:
resolve its route-dependent class string before SheetClose's slot composition.
Desktop navigation, route matching intent, aria-current and focus return remain.
An actual keyboard regression first reproduced the serialized callback, then
verified the repaired active classes and visible 2px focus indicator.

Before every live audit or image, the harness uses the real Dismiss notification
control if a decision notice is present. It verifies unchanged main evidence
and records the dismissed message. It does not hide overlays with CSS, alter
screenshots or relax any original pass/identity requirement.

The repair needs a separate runtime pull request with exact CI and a coherent
full local inventory, then coordinator merge/deployment. Only a new complete
hosted run and the same independent reviewer's full-height review can establish
acceptance. The b05 failures cannot be overwritten or promoted to a pass.

The first repair candidate, `049073c`, passed the complete 30-check local
rehearsal, not hosted acceptance. After its clean-source capture freeze ended,
the coordinator's two queued corrections completed the same bounded batch.
Operator errors retain their full text and focus, every choice and field, and
optional draft approval. While an error is visible, redundant choice help is
omitted and the description retains the no-payment boundary. Browser regressions
first measured 28/34 cumulative words Off/On, then verified fewer than 25 words
for missing-reason and missing-RB-code errors, preserved values and keyboard
recovery. Unknown abstention reasons use an own-property check so inherited
names such as `constructor` and `__proto__` remain unchanged display strings.
Neither change modifies domain decisions, audit evidence or validation rules.

After `b1a4bef` also passed the complete local inventory, a focused coordinator
inspection identified insufficient mobile outline contrast from the inherited
half-opacity ring colour. A keyboard regression reproduced 1.957:1 light and
1.886:1 dark against the navigation dialog. The mobile route alone now uses
opaque current-colour focus outlines, retaining the 2px width, active route,
keyboard order and Escape focus return. Actual computed CSS colours converted
to sRGB and alpha-composited against the observed dialog background measure
17.928:1 light and 18.968:1 dark. Both themes must exceed 3:1 in the regression.
Global theme and desktop styles are unchanged. This repairs the observed focus
indicator; it does not establish full WCAG conformance or rewrite old evidence.

## 2026-09-14: Desktop contracts and the eleven-step demonstration

Desktop demo; time is better spent on clarity than on small screens.
This owner-authorised scope cut supersedes all earlier mobile/tablet obligations.
Supported verification widths are 1280 and 1440 px; new screenshots use 1440.
Remove mobile navigation, lower-than-1024 layout breakpoints and small-screen
test variants. Withdraw mobile/tablet screenshot files from the active checkout;
their original commits, protected rollback tags and historical reported results
are not rewritten. A removed historical screenshot is not a newly passing audit.

Tasks 25-30 runtime, repaired at `34d7567`, is the implementation base.
Its 30-check hosted functional pass is historical evidence, not an independent
image-review pass. The original review was interrupted; a permitted recovery
review could not complete image inspection. Original reports and a later
delivery clarification are retained on the prior verification branch through
`3461d57c475e516406ef9f7404cfb3de7704dd34`. The image-delivery restriction is
not permission to bypass a tool limit or invent a visual verdict. Tasks 31-36
have their own desktop functional and accessibility acceptance; no previous
unverified image is reclassified as passed.

Freeze `DemoStepDefinition` and the eleven ordered `DEMO_STEPS` in
`domain/demo-steps.ts`, with one-based numbers and `demoStep: number | null`
in the existing application store. Null means ordinary operational navigation.
Step 0 defaults to null so the existing application remains usable before D's
step layouts arrive. D owns the final strip and entry behaviour. Selecting a
step changes presentation only, never submits, applies, confirms or releases.
The new wrong-information and readable-paper examples use
`SYN-FQ123-MISMATCH` and `SYN-FQ123-READABLE`, implemented by G.

Freeze `ItemVerification` as gate1/gate2 (`pass`, `fail`, `none`), reconciled
and released. `itemVerification` is a single-store map for the current item
revision; submissions reset it to none until G performs real validation.
No placeholder pass is allowed. G must bind results to the submitted revision
and invalidate stale decisions when source fields change. Both gates use pure
facts and retrieved provisions; the mode is captured at a human submission,
not retroactively applied to old history whenever the header is toggled.
Off performs no proposed gates. On makes the proposed two-gate path available.
Perspective is never an input to either algorithm.

The user explicitly selected one lifecycle state `released_to_pricing` with
distinct attribution: reserve "no operator action" for automatic release;
show operator involvement on human releases. The frozen default pharmacy label
is "Verified and released to pricing (synthetic)" and NHSBSA label is
"Verified, released to existing pricing, no operator action".
`releaseOrigin` and `itemStateLabel` preserve the human-release distinction.
These labels describe release to the existing engine, never a calculated,
approved or completed payment. A code-only gate release has actor code;
operator buttons have actor operator and pharmacy buttons actor pharmacy.
The agent never calls transition actions.

The exact six human-control action names are frozen in `HumanActionSlice`:
`applySuggestionToDecision(caseId)`, `releaseToPricing(caseId, reason?)`,
`referBack(caseId, rbCode, note)`, `requestInformation(caseId, question)`,
`applySuggestedCorrection(caseId)` and `resubmit(caseId)`.
Step 0 supplies real guarded adapters over current functionality. Release
fails closed while the gates are none; G supplies actual two-gate computation
and the complete release semantics before any new release UI is enabled.
Shared `operatorDrafts` and `pharmacyDrafts` retain revision-bound edited fields
and explicit Apply attribution. Setters retain incomplete drafts without
claiming validation. Applying a suggestion records a human event and fills a
draft; it is not a decision. G/P extend correction preparation to the supported
generic and paper fields; an unsupported correction must error explicitly,
not invent a fix. Current old UI remains functional during this additive stage.

The wrong-but-complete example must not use randomness or knowingly label a
detected mismatch safe. "Depending on luck" is narrative context for unverified
manual handling, not a random pricing algorithm. Preserve deterministic Today
routing and show uncertainty honestly. Gate 1 validates the typed requirements;
Gate 2 independently checks original evidence, quantity/pack/claimed amount,
the actual received source and the dated citation. A matching declaration
cannot corroborate itself. Unreadable paper cannot be automatically reconciled;
explicit human-confirmed evidence may support a later operator decision, never
an assertion that code read the image or that no person was involved.

Merge order is Step 0, G and D, then O/P/F, then V. G owns the single store,
verification/routing, revision-bound drafts and callable action implementations.
D owns step definitions/layouts/strip and demo navigation. F owns Follow and
the explicit Pharmacy view/NHSBSA view controls. O owns case decision/Type 1
panels; P owns claims/pharmacy submission and correction controls. V owns
desktop verification, screenshot generation and final documentation.
Shared edits require isolated owner handoffs, not competing store logic.
All streams keep check, units, desktop functional browser coverage and axe
blocking. No tool quota is bypassed, and no CI result is called a manual
WCAG certification. The existing hosting, billing, visibility and protected
rollback/archive references remain unchanged.

## 2026-09-14: Task 35 source-bound gates and shared human controls

- Question: what validates a release? Choice: retained source and independent claim ledger, dated citation, mandatory facts, product pack and claimed amount; never submitted-field projection copies or advisory flags. Tie-breaker: code authority and two-gate correctness.
- Question: does a complete-looking pack establish correctness? Choice: Gate 1 checks positive pack format; Gate 2 checks the actual catalogue pack and claim. `SYN-FQ123-MISMATCH` passes format but fails reconciliation in every run. Tie-breaker: two distinct gates, no random legacy outcome.
- Question: can a readable paper declaration corroborate itself? Choice: compare with the retained readable scan; unreadable D stays unreconciled until explicit compatible human capture. Tie-breaker: declared is not read.
- Question: can Off human Release proceed? Choice: user explicitly permits existing deterministic source checks plus human judgement, with both proposed gates `none`, `human_decision` origin and a human-review label without an automatic-verification claim. Tie-breaker: latest explicit owner clarification.
- Question: when is mode captured? Choice: explicit Send, Post, resubmit or confirmation appends `verificationEnabled` on the revision; toggles, perspectives and demo navigation cannot rewrite it or any operational snapshot. Tie-breaker: one state and immutable history.
- Question: do old APIs bypass new checks? Choice: preserve signatures and legitimate existing capture/pricing paths, but manual ACCEPT or AMEND cannot waive missing mandatory facts or a proven mismatch. Tie-breaker: code validation before human release.
- Question: what does Apply approve? Choice: nothing by itself; same-state operator or pharmacy events fill revision-bound drafts. A final matching referral or information-request action explicitly approves the copied note and records citation and exact fix. Tie-breaker: human decision authority.
- Question: can all pharmacy editors retain drafts across views? Choice: one shared revision-bound draft with optional explicit channel and confirmation; helper functions initialise and check sources without committing them. Tie-breaker: one store, no hidden submissions.
- Question: what correction may be suggested? Choice: dated NCSO completion and configured synthetic generic manufacturer, pack and form; never invent an unreadable prescriber or unknown source fact. Unsupported corrections fail explicitly. Tie-breaker: smaller agent role.
- Question: are new seeds already verified? Choice: ten Hillcrest items, all proposed gates initially `none`; readable paper is a historical ordinary auto-priced item, wrong-pack EPS remains an operator case. Tie-breaker: no retroactive verification claims.
- Question: does a pending receipt claim a built case? Choice: only an actually recorded agent recommendation with its recorded passing recommendation gate supports that label; otherwise show pending human review. Tie-breaker: honest evidence.
- Question: does Follow need another store? Choice: temporary visit metadata lives in the same Zustand store and is excluded from the operational snapshot, like `demoStep`. Tie-breaker: literal one-store requirement.

## 2026-09-14: Standing decision authority and immediate resolutions

- Routine questions or owner approval? Decide autonomously using the ordered tie-breakers in MEMORY; ask only the three explicit exceptions, with unaffected streams continuing; decided by (e), the latest standing instruction.
- Human Release with Agent Off and no proposed gates? Validate existing deterministic source/claim checks and explicit human judgement, keep both proposed gates `none`, and record a human-attributed release; explicitly selected by the owner, preserving (a), human authority, and (b), automatic two-gate safety.
- Does Off erase an already applied or edited operator draft? No: Off starts unaided but retains subsequent human-entered fields and history while hiding the suggestion; decided by (a), one authoritative human decision record.
- Does Apply approve the proposed note or release an item? No: it fills revision-bound fields and records the human action; only a separate valid final decision can approve a matching note or release; decided by (a), explicit human authority.
- How does the demo begin? Keep ordinary navigation at `demoStep = null`; explicit Enter demo mode selects step 1 without changing the Agent switch or domain history; decided by (a), navigation cannot perform business actions.
- Where do Follow and the step strip live? D mounts F's existing named FollowBanner below the header and outside page, perspective and demo guards, with the step strip separate; decided by (c), visible same-case continuity.
- When does temporary Both end? Return to the original restricted side restores its perspective; any explicit perspective choice cancels restoration, and dismiss, Reset or item change clears temporary context; decided by (c), predictable visible navigation without overriding user choice.
- How can D merge before its O/P compact exports exist? Deliver a buildable core with existing real components, gating unfinished demo entry if necessary, then an isolated integration after O/P and before V; never introduce fake controls or duplicated actions; decided by (a), real human controls, then (d), the smallest dependency split.
- Which tests block? Keep check, Vitest, crash/dead-control/six-outcome Playwright and axe blocking; other checks are informational with their actual failures retained, while the expressly requested latest-main live checklist remains a final acceptance gate; decided by (e), the latest explicit test policy.
- Does the interrupted old visual review block or become a pass? Preserve it as unverified historical evidence; accept Tasks 25-36 only against the new desktop scope and latest live checklist, never relabel old captures; decided by (e), the new scope, constrained by (a), truthful evidence.
- What does a finished stream take next? Claim the next unowned Not started SCOPE row through the coordinator; currently all six new rows are owned and In progress, so finish integration and proof rather than duplicate a stream or invent work; decided by (d), simpler ownership.
- Are any issue or pull-request questions waiting? The open GitHub issue and pull-request inventories were both empty on 14 September; all six active sessions were building with no pending input or plan approval; no owner decision was required.
- What about the Step 0 CI failure after deployment? Preserve run 34870106295 as failed, repair its tour click and pipeline keyboard failures through the existing owners, and continue independent streams; deployment success is not acceptance; decided by (a), honest evidence and working controls.
## 2026-09-14: Header help cannot block navigation

Question: retain the Agent switch's focus-triggered floating help? Choice:
remove only this redundant custom tooltip, keep the persistent `agent-help`
accessible description and native hover title. The current On/Off label stays
visible. Tie-breakers: reachable human controls and the smallest fix. The shared
hoverable, Escape-dismissible tooltip remains unchanged for evidence figures.
The bottom-flipped header tooltip demonstrably intercepted the tour Next button;
no forced clicks, longer timeouts or pointer-event suppression are used.

## 2026-09-14: Four-case vision and the system-design stream

- Ten seeded items or four playable cases? Keep only complete EPS, missing-date EPS, wrong-information EPS and unreadable paper playable; C/F are fixed unclickable background and E's rule-only behaviour is shown within complete EPS Today; decided by (e), the explicit latest four-case instruction.
- Does the four-case cut erase old six-case evidence? No: preserve historical records and pure regression fixtures, but remove their live actions, list links and deep-link reachability; decided by (a), truthful records, then (e), the new playable scope.
- Eleven steps after removing readable paper? Replace step 6 with unreadable-paper pharmacy declaration/submission and retain step 7 for that same item's Type 1 capture/confirmation; decided by (c), two distinct visible hand-offs, while satisfying the latest eleven-step and four-case requirements.
- Does pharmacy Paid mean this prototype paid? No: present actually released items in the normal-schedule Paid grouping with explicit release-to-existing-pricing wording and preserved code/human provenance; no new payment calculation or synthetic approval transition; decided by (a), the governing principle.
- Can temporary Follow context create another Zustand store? No: put that UI-only context in the existing store, exclude it from the domain snapshot and clear it on Reset/item change; decided by (a), one authoritative store.
- Which prose limit applies to system design? Under 60 words per How it works panel only; all other meaningful panels remain under 25; decided by (e), the explicit reference-page exception.
- Where are concrete platform names allowed? Only the labelled Reference mapping, one example table, sourced from one dedicated module; CI scans first-party displayed source copy without treating package imports as interface claims; decided by (e), the precise platform-neutrality exception, then (d), a narrow enforceable boundary.
- Do supplied scale and cost figures prove capacity or pricing? No: expose arithmetic, working-day/peak assumptions, token/sample/rate inputs and operator-touch comparison; label latency and production costs assumptions rather than measured guarantees; decided by (a), honest evidence.
- How does S integrate without blocking the existing streams? Keep the existing `/architecture` route and ArchitecturePage export, add its owned design content/document/tests, coordinate navigation with D and global source checks with V; merge after G/D alongside O/P/F, before V; decided by (d), the smallest isolated integration.
- What closes the new alignment register? Actual reviewed, integrated source and the latest main's required live results, not an owner's promise or an old capture; decided by (a), evidence integrity.

## 2026-09-14: Four-case source authority follow-through

- Question: do historical fixtures remain playable? Choice: only the frozen four IDs appear in operational maps; C/F evidence and other old fixtures remain pure archival inputs, not a hidden store mode. Tie-breaker: newest four-case Vision.
- Question: how does seed D validate after human capture? Choice: check its retained declaration as declared, not against the seed's deliberately different scan-text field; independently compare the actual capture and claim. Tie-breaker: no false image reading and no success fallback.
- Question: does Release erase an earlier applied suggestion after toggling Off? Choice: retain the real current-revision applied recommendation, agent version and source/check snapshot in its human decision record without invoking the agent again. Separate production model/prompt identifiers remain proposed because the scripted kernel has none. Tie-breaker: truthful audit provenance.
- Question: can paper draft copies drift? Choice: the shared setter derives the declaration copy from edited paper form fields while preserving explicitly entered prescriber evidence; no submitted source, verification result or history is rewritten. Tie-breaker: one draft authority.
- Question: what source does a legacy EPS text action retain? Choice: A and B now seed explicit EPS payloads so subsequent submissions retain actual message fields beside the independent claim ledger. Tie-breaker: source-bound reconciliation rather than projection self-corroboration.
- Question: can the seeded referral's workbench apply a fix before a new Send? Choice: an explicit `new_submission` draft purpose permits preparation without approving the historical referral; Resubmit rejects that purpose. Tie-breaker: working pre-send flow without hidden submission or approval.
- Question: how does G remain deployable before new panels merge? Choice: the coordinator authorised minimal existing selector, overview, background and completed-bucket compatibility; no new O/P panels or D mounting are included. Tie-breaker: no dead controls and the smallest dependency cut.
- Question: can a later same-state Apply change a release label? Choice: labels anchor to the actual release transition/provenance, not the latest event whose destination happens to be released. Missing automatic evidence is labelled unavailable. Tie-breaker: truthful human attribution.
- Question: can advice metadata clear an item on queue arrival? Choice: agent events remain same-state; only the independent submission/release paths can advance to pricing. Tie-breaker: no agent state authority.
- Question: does an arbitrary lower claimed amount count as reconciliation? Choice: compare against the known dated synthetic pack reference, not merely an upper bound; unsupported differences require review. Tie-breaker: actual reconciliation without calculating a payment.
- Question: how are four-case equivalence tests proved? Choice: run all four real cycles in both modes, in Both and switched perspectives, comparing full snapshots after every actual action with a controlled clock. No timestamps, IDs or operational fields are erased. Tie-breaker: exact one-state evidence.
- Question: how does current domain metadata satisfy the single reference-mapping rule? Choice: current tool and trace service metadata use neutral capabilities, with agent definition `prototype-0.6`; the original F records retain all values in a frozen archival fixture outside production `src`. No current configuration is hidden there. Tie-breaker: newest platform-neutrality rule and immutable historical evidence.
- Question: can an On submission finish through later Off manual capture? Choice: record mode at the actual human capture event and accept independently matching manual facts without a hidden proposed checkbox; retain the original submission's mode and gate history. On capture still requires attestation, and any release remains human-attributed. Tie-breaker: a working existing-process fallback and immutable provenance.
- Question: why did a complete On EPS receipt incorrectly say Type 2 was pending? Choice: replace its legacy automatic-pricing-only check with the selected revision's recorded pricing/release event and attribution-aware label. Preserve Off pricing text and human review provenance; do not change the model outcome to fit the old receipt. Tie-breaker: truthful visible outcomes.
- Question: does shared Apply count as a caught item automatically? Choice: append counter evidence atomically only after a checked format or source gap becomes ready on independent current facts; bind it to the next attempt and deduplicate legacy recorder events. Partial or still-invalid corrections remain uncounted, and applying still does not submit or release. Tie-breaker: an actual evidence-based count, not a click counter.
- Question: does correcting a referred-back item count as upfront prevention? Choice: no; the new shared recorder requires explicit `new_submission` intent. A post-referral correction remains recorded human work but does not increment the upfront caught collection. Tie-breaker: preserve the prevention versus rework distinction.
- Question: can both comparison panes retain their EPS evidence landmarks? Choice: yes; label the manual comparison's root, item and dispenser regions with meaningful context rather than deleting regions or excluding axe rules. Tie-breaker: the reproduced landmark-unique violation and accessible evidence.
- Question: does preparing an agent case pack imply a saved decision record? Choice: no; the current trace says prepared in memory and awaiting human decision, not appended. Historical records and actual human writes remain unchanged. Tie-breaker: truthful mock and authority boundaries.
- Question: should shared resubmission display a seed placeholder? Choice: record an explicit unperformed Off snapshot or the actual current On check at the human resubmit action, retaining existing source data for text-only corrections. Tie-breaker: truthful revision-bound audit evidence.
- Question: which provision validates manually keyed, undeclared paper? Choice: Gate 2 resolves the received or human-captured product, date and endorsement independently; it must not reuse Gate 1's unreadable input or missing clause. Preserve the original scan and validate all actual captured facts. Tie-breaker: independent code validation and the supported Off manual path.
- Question: how do legacy state-browser tests respect four playable cases? Choice: retain all 34 tests, replace retired C confirmation with actual B information-request/confirmation evidence preservation, and replace readable B paper with D capture followed by its required human Type 2 decision; historical C conflict and readable-paper evidence remain historical, not injected into the store. Tie-breaker: the newest four-case scope without weakening one-state or human-authority checks.
- Question: may a human-release test price an unresolved B claim? Choice: supply a real pharmacy correction, resubmit and explicitly recheck before acceptance; invalid-source rejection remains covered by the code-gate tests. Tie-breaker: mandatory deterministic validation, not an override that bypasses missing facts.
- Question: does complete EPS still end in the same label in both modes? Choice: assert code-only verified release with recorded passing gates On, and existing automatic pricing with proposed gates none Off; both must create no human decision record. Tie-breaker: accurate outcome and provenance.
- Question: may state tests click through a persistent decision notification? Choice: assert its successful record message and use the normal Dismiss control before later navigation, verifying the domain snapshot is unchanged. Tie-breaker: real accessible controls, not forced clicks or hidden UI.

## 2026-09-15: Always-visible concrete recommendations and Task 38

- Question: is the new recommendation/paper brief a replacement? Choice: extend Tasks 25-37 and their current owners; create R/Task 38 only for the missing shared recommendation contract, card and safe suggestion adapters. Tie-breaker: (e), the explicit addition, and (d), one shared implementation.
- Question: who owns the former U paper responsibilities now? Choice: P owns pharmacy preparation/receipts, O owns Type 1/Type 2 UI, and R owns shared recommendation/model extensions; do not restart the completed historical U stream. Tie-breaker: (d), existing ownership without duplication.
- Question: must a reference-only screen invent an item to show a card? Choice: no; every actual Agent-On item view gets its expanded card, while item-free process, month and technical-reference screens remain truthful. Tie-breaker: (a), no fabricated case context.
- Question: how does an unreconciled item receive actionable advice without a false pass? Choice: retain kernel abstention/failed verification and add a separately code-validated safe human Refer back/Request information diagnostic draft; Apply fills fields, a separate human action approves/disposes, and release stays blocked. Tie-breaker: (a), authority and evidence integrity.
- Question: may an unknown invoice price be proposed as a number? Choice: never infer it from the claim or invent it; require human entry with the stated currency placeholder and focus, while known date/product/pack/form values cite their source. Tie-breaker: (a), source truth.
- Question: how can previews remain exact? Choice: derive displayed preview and applied field patch from the same helper and current revision/draft, not separately formatted strings. Tie-breaker: (a), exact evidence, then (d), shared code.
- Question: do scanner/declaration demo controls change authoritative source or submit? Choice: they reveal the unchanged unreadable scan and explicitly prepare synthetic complete/missing drafts; no implicit Post, capture confirmation, reset or source-quality rewrite. Tie-breaker: (a), human-only transitions and immutable evidence.
- Question: how do steps 7-10 form one usable paper story? Choice: make the missing-declaration branch the canonical walkthrough through Post/capture, operator referral, concrete correction/resubmission and final human release; keep the complete branch fully playable and preserve its actual outcome rather than recreating a referral on navigation. Tie-breaker: (c), visible continuity without violating (a).
- Question: does the new card override the earlier compact-layout shortcut? Choice: mandatory evidence/card/controls remain visible and readable; improve shared layout and remove duplicate presentation rather than hide the card, shrink text or suppress required fields to satisfy an old height proxy. Tie-breaker: (a), complete truthful information, then (e), the latest addition.
- Question: when may a pharmacy label a communication operator-approved? Choice: only after an actual human final action recorded that approval; a toggle or Apply alone never supplies it, and failed source verification remains explicit. Tie-breaker: (a), recorded authority.
- Question: how are the new one-second claims established? Choice: use actual UI actions, current item/revision and timed destination assertions for all four cases and perspectives; no delayed assertion start or sleep-based proxy, and record any unmeasured surface as pending. Tie-breaker: (a), measurable evidence.
- Question: do new requirements stop completed integration work? Choice: continue the existing merge/check sequence, publish R's foundation early and integrate owned extensions alongside O/P/F/S before final V acceptance; prior local passes remain source-pinned earlier evidence, not proof of the addition. Tie-breaker: (d), parallel progress, and (e), the explicit running instruction.

## 2026-09-14: Explicit eleven-step entry and one live comparison

Question: enter the demonstration automatically? Choice: keep `demoStep: null`
for ordinary operations and show a prominent Enter demo mode action once all
task panels are integrated. Entry selects step 1; Exit retains the current
route, case, mode, drafts and history. Tie-breakers: one authoritative state
and a visible, deliberate presentation choice.

Question: how should two columns act? Choice: exactly one task renderer, in
Today when Off and With the agent when On. The other column explicitly says
Read-only scenario projection; its forecast is never recorded history.
Two-second presentation movement has no processing-time or model-time claim;
reduced motion reaches the identical final state immediately. Tie-breakers:
truthful authority and clearer comparison.

Question: how do frozen historical cases support a pre-send demonstration?
Choice: an explicit human Send/Post may create a new immutable attempt for the
same ID, labelled New demonstration attempt; history retained. Navigation never
creates an attempt. Step 9 and cross-side claim links use current lifecycle
correction/resubmission instead. Tie-breakers: preserve evidence and human action.

Question: land D before compact O/P exports exist? Choice: commit independently
buildable strip, navigation and layouts with a typed task-renderer seam, but
leave them unmounted until the separate integration commit imports real panels.
No placeholder controls or unavailable imports ship. The existing ordinary
routes remain usable; final eleven-step acceptance is explicitly pending.
Tie-breakers: real controls before visual completeness, then simple merge order.

## 2026-09-14: Four playable cases, eleven distinct demonstration steps

Question: keep readable paper as a fifth playable case? Choice: no. The latest
vision supersedes the original step 6 fixture. Step 6 is D's pharmacy declaration
and explicit Post; step 7 is that same D's human Type 1 confirmation and case.
Their different hand-offs retain eleven steps without duplicate controls.
Tie-breakers: latest four-case scope and a clearer Today/With comparison.

Question: which rows may the focused queue open? Choice: use G's authoritative
`isPlayableCase` helper; only A, B, the mismatch and D are operational. Render
G's C/F background records without controls or staff counts. The presentation
case-ID set is tested against G's inventory, not used as another authority.
Tie-breaker: one state.

Question: should entering step 8 make historical B actionable? Choice: no.
Show its actual state and let the audience open a genuine waiting row. Never
submit, reset, release or fabricate review work merely to enter a step.
Tie-breakers: preserved history and human decisions.

## 2026-09-15: Pharmacy action panels over merged model and demo core

- Question: where do unfinished pharmacy edits live? Choice: one revision-bound pharmacy draft, retained across perspectives; explicit Apply records human attribution without submitting. One-state authority wins.
- Question: how does an old referral demonstrate pre-send checking? Choice: the workbench explicitly labels a new attempt; claim detail retains correction-only actions. History is never replaced by navigation.
- Question: what proves the receipt and monthly counts? Choice: recorded gates, release origin and validated correction events; actual Hillcrest counts stay separate from estimates and payment calculations.
- Question: what if no generated note was approved? Choice: keep the recorded human reason visible without inventing a citation or an approved suggestion. Human authority wins.
- Question: can an absent check be called Seed? Choice: only seed revisions use that label; later absent snapshots say Check not recorded. Actual resubmissions preserve current On/Off evidence.
- Question: what survives demo exit? Choice: the selected URL case/channel and shared drafts; invalid combinations do not silently open another item.
- Question: how are P's state tests updated? Choice: retain the full 34-test family and exact Both/switched snapshots, explicitly asserting draft-only edits and same-state pharmacy Apply events. No field is removed from the observer.
- Question: may the retained paper prescriber be corrected? Choice: restore its human input alongside modern declaration fields in referred-back detail; initial declaration entry still does not invent prescriber evidence.

## 2026-09-15: Requirement 4 Follow scope extension

- Question: does synchronous Follow navigation prove the new one-second cross-side requirement? Choice: retain the existing one-store navigation and neutral action labels, add request/confirmation and unchanged diagnostic-event contract coverage, and leave all-four-case browser deadlines to V after R integration; no timing or new-paper-path pass is claimed from unit tests. Tie-breakers: truthful evidence, explicit human decisions and no duplicated operational state.

## 2026-09-15: Concrete pharmacy recommendation mounts

- Question: which preview drives Apply? Choice: render R's shared draft recommendation and invoke the shared correction action; no separate UI correction algorithm or automatic action on toggle.
- Question: what do paper demo controls change? Choice: explicit complete/missing buttons prepare R's labelled synthetic declaration, including the visible demo prescriber. Scanner presentation reveals the retained poor image without rewriting it; Post and capture remain separate human actions.
- Question: what is filled for an unknown invoice price? Choice: nothing. The actual invoice control focuses the authoritative endorsement field for manual entry; no claimed amount becomes invoice evidence.
- Question: which fields are highlighted? Choice: R's before/after applied-field metadata, including restored original values; not an inference from the original source alone.
- Question: how does the demo recognise shared-card controls? Choice: an optional pharmacy-only prop marks the real Apply and invoice-focus buttons. No proxy controls or weakened absence checks.

## 2026-09-15: Current pharmacy communication visibility

- Question: should an expanded recommendation push the operator's current question below the hand-off viewport? Choice: place the actual question, confirmation controls, sent answer and referral response near the claim state, before supporting evidence. Keep the full recommendation expanded and preserve every recorded word.
- Question: how should a followed claim enter the viewport? Choice: focus its heading without browser nearest-edge scrolling, then align it below the measured sticky header. Repeat only for a case, state or revision change, never a draft edit or assistance toggle. The one-second assertion and its actual evidence nodes remain unchanged.

## 2026-09-15: Untouched pharmacy correction context

- Question: why was an existing approved referral not attributed in its untouched Recommendation card? Choice: an editable referral view supplies `correction` only when the displayed draft has no explicit purpose. The shared recommendation still determines approval from the actual current-revision record; new-submission drafts, unapproved records and earlier revisions cannot inherit approval. This is a read-only view projection, not an approval or draft write.
- Question: what if that real attribution exists but is below the hand-off viewport? Choice: put the complete correction card immediately after the operator response and move its existing conditional approval statement to its header. Preserve the same paragraph, predicate, text and all card contents; neither a duplicate badge nor a relaxed visibility assertion is acceptable.

## 2026-09-14: Task 33 operator controls use one human draft

Where should Apply write? Use revision-bound `operatorDrafts` for the actual
visible outcome, RB code and note, not page-local decision copies; one state
and explicit human authority take precedence over presentation convenience.

Does Off discard an applied suggestion? Start empty before any human drafting,
but preserve subsequent human edits and Apply history when toggling; the
one-state rule takes precedence over a destructive interpretation of empty.
Off renders no new suggestion card or agent call in the action panel.

When is a drafted response approved? Apply only copies fields and records the
operator attribution. The subsequent Refer back or Request information click
approves the exact applied note through G's guarded action; no hidden approval,
release or invented fallback reason. Manual reasons retain eight characters.

How are controls shared with the demonstration? Export
`OperatorActionPanel({ caseId, compact? })` and retain
`Type1Capture({ caseId, compact? })`. Compact capture omits timing controls;
it retains the same image, immutable declaration, fields and confirmation.
Use G's `getReleaseEligibility` for source validity in both modes, never a
second UI gate. The visible note remains the human input to final release.

What does Correct do? Enter a visibly named correction mode, focus Product
code and invalidate reconciliation. Any field edit also invalidates it.
The original declaration remains read-only beside the original paper image;
unknown prescriber evidence is never inferred from the scan. Attestation is
not proof of image agreement. Capture remains separate from Type 2 decisions.

Where are automatic cases inspected? A disclosed actual-session automated
count links to read-only case records, independently of monthly estimates.
Only a recorded code-origin two-gate release says no operator action.
Human releases show after operator review; historical sources remain visible
in either header mode. No payment is calculated or approved.

## 2026-09-14: Task 33 follows the four-case vision correction

- Question: which queue items act? Chosen: G's authoritative playable set only, with C/F as fixed unclickable background; the newest four-case instruction wins.
- Question: where does compact NHSBSA evidence live? Chosen: the same operator component exposes the actual source, captured fields and gathered evidence alongside advice; visible evidence authority wins over a suggestion-only demo.
- Question: how is successful release demonstrated without an extra seeded recheck item? Chosen: B's real referral, pharmacy correction and resubmission; the shared live cycle wins over a fifth playable fixture.
- Question: what does an automatic item's audit show without a human record? Chosen: the recorded existing-pricing outcome, not a manual comparison or an impossible request for a human decision; truthful human authority wins.
- Question: how should repeated EPS comparison landmarks differ? Chosen: a meaningful Manual comparison context prefixes their accessible names, preserving every landmark and source value; accessibility and truthful context win over deleting roles or evidence.

## 2026-09-15: Compact Type 1 evidence and editor placement

- Question: how can compact capture avoid a narrow editor beside unused image space? Choice: place scan and immutable declaration together above a full-width editor; ordinary capture keeps its original layout. No facts, required controls or reconciliation checks are removed.
- Question: can the demonstration use the inactive column's empty space? Choice: provide the read-only `Type1CaptureEvidence({ caseId })` export and an explicit compact-only `evidencePlacement="external"` option. D must render the same item's source comparison exactly once and retain one live capture form. Ordinary views ignore external placement.
- Question: does the first viewport already pass? Choice: no. Actual 1440x1000 and 1280x1000 measurements place the compact panel at y692 beneath the real D/F chrome; Confirm ends at y1274/y1290 for the first candidate. Preserve that failed measurement, coordinate D's metadata layout and give the latest always-visible Recommendation content priority over shrinking or hiding facts.
- Question: what does the complete D/R/O measurement establish? Choice: preserve the exact raw result. At 1280/1440x1000, Off Confirm ends at y787; On's mandatory visible Recommendation moves Confirm to y2078 and the document is 2169px high. All controls remain operable, one form remains, and no source or required advice is clipped. This is not an On first-viewport pass.
- Question: when does the compact layout regression run? Choice: keep all four checks in `tests/integration/compact-type1-layout.spec.ts`, executed through `tests/e2e/compact-type1-layout.config.ts` after D's actual mount. O's merge intentionally precedes that mount; no skipped tests, reduced assertions or proxy geometry replace the separate integration run.

## 2026-09-15: Concrete recommendations on operator surfaces

- Question: where should operator advice come from? Choice: use R's shared read-only derivation and RecommendationCard on current operator, Type 1, trace and record surfaces, not a second local recommendation authority.
- Question: can diagnostic Apply clear an unreadable item? Choice: only R's validated safe follow-up adapter may populate the current operator draft; the original abstention and failed checks remain visible and Release still uses the authoritative code gate.
- Question: when is the card shown? Choice: every valid item surface shows one complete card while On, including before Start review and read-only outcomes. Off performs no new recommendation derivation; recorded-source cards remain explicitly pinned to their revision and record.
- Question: is an escalated record a completed review? Choice: no. An open escalated operator case keeps current actionable advice; only a closed review uses the read-only recorded-source context.
- Question: where does a received pharmacy answer appear? Choice: render the exact current revision's confirmation in a visible Pharmacy confirmation landmark before recommendation/playback content, in either mode. Do not infer captured facts from free text or require opening history; shared parents suppress only duplicate child copies.
- Question: how does the followed item's queue state become visible without a hidden proxy? Choice: open its actual lane, put current work before background material and unrelated capture editors, and focus the real state leaf with minimal instant scrolling only when needed. Counts still include all actual items; navigation and filtering never change operational state. Verify with V's unchanged pre-click one-second deadline, viewport and cumulative-opacity checks.
- Question: why did the first queue repair remain partially clipped? Choice: preserve the measured failure: the actual table cell was y945, height57, ending at1002 in a1000px viewport after a same-filter click. Explicit filter selections now request focus again, with a small viewport margin for the complete original cell; no span proxy, relaxed visibility ratio or deadline increase. Track actual target/lane changes separately without resetting a user's unchanged filter every render.
- Question: why was a received answer above the viewport after Follow returned to its NHSBSA case? Choice: case routes need explicit entry focus because the chapter shell deliberately skips them. Focus the actual case heading without implicit scrolling, then align the complete case header below the existing sticky chrome. Run only on route/item changes, never field edits or mode changes; preserve the actual state, answer, card and unchanged one-second verifier.

## 2026-09-14: Mount the real compact tasks, not hidden operational pages

Question: how should the shell enter the new walkthrough? Choice: replace the
chapter rail with Demo mode after the actual O/P task exports are available.
The shell mounts exactly one compact submission, claim, Type 1 or operator
panel in the current comparison column. Ordinary Outlet content is not mounted
behind it. Exit returns that Outlet without changing operational state.
Tie-breakers: one action authority and honest focused presentation.

Question: can a perspective change hide the current step? Choice: no. The
Follow banner remains directly under the header, followed by the separate demo
strip. Demo layouts sit outside the ordinary opposite-side guard. Explicit
follow links choose the same item's task surface; the step persists. Header
Primary navigation and Reset return only after Exit, while the one Agent switch
and perspective switch remain. Tie-breaker: a continuous shared demonstration.

Question: what should Next focus? Choice: the new step heading, at the top of
the page, on step or route changes only. Header mode and perspective changes
do not steal focus. Frozen submission channels are passed to P's renderer,
without rewriting an item's latest recorded channel. Tie-breakers: keyboard
operability and truthful source presentation.

## 2026-09-14: Demonstration refinements after vision review

Question: must assumption editing break the walkthrough? Choice: no. Reuse the
real shared ProcessAssumptions once, inside the active month's collapsed detail.
Keep that editor mounted when values are invalid; never retain stale figures
or force Exit to recover. Tie-breakers: shared authority and simpler exploration.

Question: how should reduced motion crossfade without harming contrast? Choice:
crossfade only the decorative assisted background for 150 ms. Text remains
opaque and stationary; normal presentation still uses the two-second movement.
No timing implies a model call. Tie-breakers: accessibility and truthful motion.

Question: when is correction relevant? Choice: expose P's real supported fix
on submission steps, not an invented fix. Step 5 first submits the unchanged
wrong-pack scenario to demonstrate Gate 2's rejection, then permits explicit
correction of that real attempt. Unknown paper facts remain unknown.
Tie-breakers: demonstrate the gate and retain meaningful human controls.

Question: which first test closes the demonstration? Choice: the latest vision's
two weeks of operator-time data and fifty items, two operators, blind. The
historical two-year referral-data request no longer substitutes for this test.
Tie-breaker: latest explicit direction.

## 2026-09-14: Follow links override every step's viewing surface

Question: what should Follow do on the process, numbers or closing step?
Choice: retain the demo step but show the selected item's real task surface,
headed Following the item from that step. Its inactive comparison refers to
the same item, never the displaced narrative or another fixture. Back/Next
returns to the normal sequence. Tie-breakers: functional navigation and clarity.

Question: should a pharmacy Follow visit retain queue controls? Choice: no.
An explicit side visit shows only that item's side. Opening a normal step 8
queue row instead updates the queue's case/channel query and keeps its one
opened row. Both operations are presentation-only. Tie-breaker: one focus.

Question: may a generic Follow comparison imply operator work for complete A?
Choice: no. Reuse the existing case-specific scenario, with D's pharmacy or
operator hand-off selected by side. A keeps its automatic/no-operator comparison.
Tie-breaker: truthful attribution.

Question: may the Off comparison use low-contrast muted text? Choice: no.
The actual desktop axe run measured 4.34:1 on the muted background. Keep the
grey panel and read-only label, but use darker light-theme text and lighter
dark-theme text. Re-run the unchanged checks. Tie-breaker: accessibility.

## 2026-09-14: Carry the actual operator response into step 9

Question: should Next open fixed B after the operator refers a different item?
Choice: on step 8 to 9 only, retain the followed playable item when it actually
needs pharmacy action (referred back or information requested), with its recorded
channel. Otherwise retain the frozen B default. The strip and live panel use
that same destination; navigation appends no events and changes no drafts.
Tie-breakers: a functional shared hand-off and preserved operational history.

The regression explicitly corrects and sends B to automatic release, submits
the wrong-pack EPS item, applies the operator suggestion and refers it back.
Next must then open that actual referral with correction and resubmission
controls, not B's completed record.

## 2026-09-15: Paper walkthrough and a shared evidence companion

Question: how should the unreadable-paper sequence start? Choice: step 7 opens
the actual pharmacy workbench for D; its buttons prepare a draft and Post is
explicit. Step 8 defaults to D's queue case, step 9 retains the actual actionable
handoff, and step 10 opens D's current NHSBSA revision for recapture or release.
Follow's pharmacy link remains the current claim, never an implicit new attempt.
Tie-breakers: the latest paper path and one operational history.

Question: can the compact Type 1 source be omitted to fit the screen? Choice:
no. Render O's same-ID read-only scan and immutable declaration in the inactive
comparison, labelled Shared original evidence, and use external evidence only
when that companion is actually rendered. Keep exactly one live form. Without
the companion renderer, keep inline evidence. Tie-breakers: visible evidence
and a clearer side-by-side comparison.

Question: how should the wrapper make room for mandatory advice? Choice: reduce
spacing, put case/state together and keep channel, endorsement and recorded gates
inline for Type 1. Preserve all facts and normal-size text, the full task renderer
and its recommendation card. No clipping, internal scrolling or hidden card.
Keep ordinary operations unchanged. Tie-breaker: required content before a height
proxy; measure the complete R/O integration before claiming viewport acceptance.

## 2026-09-15: Preserve ordinary overview navigation after mounting the demo

Question: how are ordinary overview sections reachable after the chapter rail
is replaced? Choice: a Home-only section navigation reuses the six existing
chapter destinations as real router links. It is absent from the active demo
because the ordinary Outlet is unmounted. No second tour state or Agent control
is added. Tie-breakers: retain existing reachable views and use the smallest fix.

Question: how should chapter tests navigate? Choice: exit demo when necessary,
open Overview through the existing primary navigation, then activate its real
section link and await both URL and heading focus. No reload, history injection,
forced click or operational-state writes. All six links are tested against the
complete read-only domain snapshot in both modes.

Question: which old compatibility patches should replay? Choice: preserve
current main's stronger P/O counter, source, approval and state assertions when
combining the mounted tests. The numerical counter patch is already covered by
main and is not duplicated. Adopt only V's immutable navigation helper and its
small data dependency, not the full foreign proof branch.

## 2026-09-15: Reconstruct verification without replacing merged owner work

Question: how should the final verification branch incorporate the merged
desktop runtime? Choice: retain the merged runtime, owner unit regressions,
all 36 state checks and governance documents, then apply only the reviewed
verification inventory, reporter, new requirement checks and documentation.
Preserve the earlier branch ancestry and external reports rather than replaying
its mixed implementation snapshots.

Question: how are superseded live declarations retained? Choice: keep their
assertion bodies unchanged and give them a frozen legacy inventory import.
The active configuration selects exactly five current files and 75 names;
historical declarations are neither deleted nor counted as new acceptance.

Question: how can the new four-case parity checks retain temporary Follow
context? Choice: add an optional presentation-preservation flag to the action
helper. Existing callers keep identical default switching and complete
snapshot/clock behaviour. The read-only observer and human-release provenance
checks are unchanged.

Question: what can passing subsets or diagnostic observers establish? Choice:
retain partial selection as an overall failed full checklist, keep every
failed predecessor, and require a new whole run. Route diagnostics are separate
from acceptance, do not change the original deadline or subtract overhead,
and do not turn post-verdict geometry or animation frames into paint evidence.

Question: should the strict source-copy check be weakened for an existing
hosting comment? Choice: retain the checker unchanged and replace only
"Azure hosting" with "production hosting" in App.tsx's site-root comment.
This is the sole approved source-byte exception; executable tokens, routing
and hosting behaviour remain unchanged.

Question: where should route-commit instrumentation run? Choice: a separate
local diagnostic configuration enables a typed test fixture, retains both
traces and labels its JSON report as diagnostic rather than acceptance.
The normal 75-check configurations leave the observer inactive. It installs
before navigation, collects after the original outcome and adds no awaited
steps inside the existing one-second actions. Browser records cover only
the final or failing document; earlier document evidence remains in traces.
Record caps, dropped observations and added overhead stay explicit.

Question: does the automatic queue's read-only link establish destination
state? Choice: no. A's timed hand-off must verify the actual NHSBSA shared
case status immediately after Follow navigation and before returning to the
queue. This exact Off/On state check uses the same original one-second
deadline, viewport and opacity assertions; the queue count and link remain
additional checks. No state column, proxy, extra navigation or runtime change
is introduced. Earlier timing results did not include this added observation.

## 2026-09-15: Focus only the committed demo route

Question: why can Jump lose focus immediately after entering demo? Choice:
preserve the main CI failure and the read-only diagnostic showing two calls
to the same heading-focus effect. The synchronous demo-step store update can
mount the screen before BrowserRouter commits the new location; the later
route commit ran that effect again after the user moved focus.

Gate only that effect until its rendered pathname, search and hash match the
browser's current location, using the same Vite basename as the router. Then
the committed route owns one heading-focus action. Keep intentional step,
Back/Next and Follow navigation focus, all motion and the single store unchanged.
No forced synchronous rendering, delay, retry or weakened focus assertion.
Tie-breakers: preserve user focus and fix the demonstrated duplicate side effect.

## 2026-09-15: Settle independent visibility reads without changing obligations

Question: may independent visibility predicates share their observation
window? Choice: launch only the existing visible, full-viewport and cumulative
opacity predicates concurrently within each visibility helper invocation.
Each uses the same original deadline. An all-settled barrier waits for every
observation, including synchronous guard failures, before propagating the
original single error or an aggregate containing all original failures.

Text checks, origin and destination stages, actual A pre-queue state, queue
counts, selections, links and navigation remain ordered exactly as before.
The final deadline check still follows every required observation. No extra
clock, timeout, state proxy or overhead subtraction is introduced.
This is protocol read-scheduling efficiency, not a proven runtime fix.
The prior standard D 1,008.3189 ms failure and diagnostic A 1,006.67 ms failure
remain failed evidence; the changed procedure requires fresh verification.

## 2026-09-15: Profile runtime costs without changing acceptance

Question: what follows the failed serial and concurrent-read procedures?
Choice: stop further harness adjustments and prepare one explicitly labelled
local CPU/timeline profile of the existing full 1280 On matrix. Preserve
all actions, ordering, strong automatic-state checks and the one-second
deadline. Profiling starts before the test and is collected after its
original outcome, without route DOM observers or application instrumentation.

Require a new output directory, exclusive files, complete chunk writes,
actual CPU/trace hashes, exact build/entry-asset identity and explicit
duration/buffer/output caps. Errors, caps or lost data make capture incomplete
and are surfaced separately from the original functional result. No repeated
run, overhead subtraction, guessed source mapping or speculative runtime
patch follows from incomplete samples.

## 2026-09-15: Profile the original first journey in a shorter window

Question: how can the first action be profiled without increasing capture
caps or discarding required preconditions? Choice: a separate diagnostic
specification calls the unchanged first A/On/Both journey at 1280 px once.
A and Both are already first in the full matrix; the helper retains the real
submission, verified NHSBSA state, queue checks, both-side visits and final
normal-pricing assertions. Collection ends after that original journey.

The existing profiler, sampling, buffer/output limits, single deadline and
standard matrix files are unchanged. The shorter diagnostic is not a matrix
or 75-check pass and does not repair or relabel earlier failures. If it is
again capped or insufficient, stop without another profiling attempt.

## 2026-09-15: Isolate optional trace snapshots from timed verification

Question: can optional trace-recorder work be excluded without changing the
required measurements? Choice: use the installed public Playwright literal
worker trace option only for the eight timing declarations. Keep the actual
callbacks, helpers, action order, predicates and deadline unchanged. Preserve
API/source traces and attachments, but explicitly lose continuous DOM,
screencast and HAR resource/payload coverage for those tests.

Validate the actual resolved option before the body, record it after every
outcome, and retain failure HTML/ARIA only after the verdict. Existing named
screenshots, axe audits, network/CSP/error assertions and failure geometry
remain independent and unchanged. Do not add a network collector to claim
parity or subtract any estimated observation cost.

Global and untimed/state tracing stays unchanged. Separate diagnostic matrix
wrappers use the base full-trace fixture and the exact original callback
tokens. Worker grouping and shard membership may change, but all original
test IDs must remain in the four-shard union without loss or duplication.
No private API, function-valued trace override or unsupported describe-level
worker option is used. This changes optional artifact collection, not runtime
behaviour, and does not relabel any prior deadline failure.

## 2026-09-15: Stream V adopts live-first publication

Question: who integrates Tasks 39/40 shared authority? Choice: G alone edits canonical types, store, lifecycle, references and seeds; W and B contribute isolated typed domain modules, then UI owners consume the merged contracts after the header change; tie-breaker: one store and the newest explicit ownership instruction.

Question: how are the wrong-strength sources separated? Choice: keep prescribed item fields immutable, add an independent `supplyRecord`, and treat `dispensedCode`/`dispensedName` as the claim selection; derive selected strength from the catalogue, never overwrite the prescribed strength during Apply; tie-breaker: faithful source reconciliation.

Question: should submission shape validation reject a known wrong-strength selection before the demo gates see it? Choice: permit known independently selected products only when a separate supply record exists, while validating each product copy and guarding retained original fields against edits; tie-breaker: show the real mismatch without allowing source fabrication.

Question: what binds correction acknowledgement? Choice: the current revision and canonical exact-payload fingerprint, excluding acknowledgement and presentation metadata; any payload edit or Apply invalidates acknowledgement; tie-breaker: explicit informed human action.

Question: should the new fourth scenario introduce a fifth playable identity? Choice: preserve the four IDs and repurpose `EX-24112` as correctly dated paper with missing brand evidence; retain historical fixtures independently; tie-breaker: the authorised four-case scope.

Question: how should V publish verified but incomplete work under the standing rule? Choice: push draft #94 at STATUS and at least every thirty minutes, update all five registers in the same commit, and keep completion blocked until merged green-deployed work is observed live; tie-breaker: the latest explicit instruction and truthful evidence.

Question: what do the retained branch runs represent? Choice: developer test artifacts only, never a separate product or backup; only the current-main payload verified on the live URL can be the backup, with D owning implementation and O its independent verification; tie-breaker: one release authority.

Status source `c091d47269665e12af69a2a82cb3733747209eeb` is published WIP.
The live HTTP observation at `2026-09-15T18:24:10.7144775Z` still served
`08f4d399ca658cae2aaf16a10d4f9cae8431621f`. The controlled 132-transition
pass does not bridge that release gap or replace full live acceptance.

Question: how should callback integrity remain exact across Linux and Windows checkouts? Choice: hash TypeScript parser token leaves, using the immutable original callback as the reference and explicit LF/CRLF plus changed-value/template negatives, rather than a context-free scanner that mishandles template continuation; tie-breaker: correct evidence without weakening callback assertions.
