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
