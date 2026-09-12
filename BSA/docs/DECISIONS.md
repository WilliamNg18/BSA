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
