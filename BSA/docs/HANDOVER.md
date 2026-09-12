# Account transfer handover

## Outstanding owner actions and active monitoring

- [ ] **Action 1:** Open Azure Cloud Shell in PowerShell mode and paste the
  single block at the top of [DEPLOYMENT](DEPLOYMENT.md). It selects the
  verified subscription, creates the UK South group/West Europe Static Web
  App, resets the deployment token and prints it for the next step.
- [ ] **Action 2:** GitHub repository Settings > Secrets and variables >
  Actions > New repository secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`; paste
  the token and save. Never paste it in chat or code.

These remain outstanding until a main deployment succeeds and the actual live
Overview, deep links, both modes and round trip are verified. Then mark them
done, close #37 and complete Task 13/SCOPE I/PARITY 31. The coordinator checks
every 15 minutes and dispatches the existing workflow once the token is present;
Actions > Azure Static Web Apps > Run workflow is also available immediately.

On 12 September, authenticated `az staticwebapp list` returned no sites in the
verified subscription. The historical App Service is a different resource and
was not changed. No SWA upload has reached Azure and no successful SWA URL is
present in Actions history. Report actual events immediately as STATUS with
an Owner actions for me line; never label this ALL DONE before live checks.

## Current completion pointer, 12 September 2026

R #33, V #24, parity #38, D #39, opacity repair #42, quarantine removal #40
and scoped V #43 are merged; current main is
`c687a9eab181b02f4fca0eb667e8ab8f94468620`. Current CI 34696637977 passed
607 units and 1,054 all-blocking browsers, zero quarantine. V refreshed 64
settled routes byte-identically; 43 other state images retain original
provenance. Current comparable gzip is 203,721 Python-method bytes, informational.
[PROGRESS](PROGRESS.md) now
records final application evidence and Tasks 1-12 Done; Task 13 retains the
hosted-release criterion under #37. [SCOPE](SCOPE.md) records 17 Done and
hosting I In progress; D's scoped records refresh awaits coordinator
PR merge. [MEMORY](MEMORY.md) and [BRANCHES](BRANCHES.md) describe current
facts and preserved refs. No live URL is verified; #34/#35/#41 are closed.
The two owner actions above remain outstanding.
The freeze, pending-transfer and stream statuses below are
historical, not current instructions or acceptance totals.

**Transfer not proceeding; repository made public for Actions capacity; state preserved as checkpoint.**

The owner cancelled the transfer on 12 September 2026 and explicitly authorised
resumption from this handover. Enterprise Managed Users cannot join/own this
external repository. Ownership remains WilliamNg18; Actions billing belongs to
the repository owner. The repository is public for the demo and is to return
to private when the demo is done. Azure Static Web Apps at `/` remains the host.

GitHub secret scanning and push protection are enabled. The local tree/history
scan identified no actionable credential. The owner explicitly approved public
reference material; it remains in place. Reset the SWA deployment token in Azure
and store the replacement only as `AZURE_STATIC_WEB_APPS_API_TOKEN`.

All nine annotated checkpoint tags were pushed. Main checkpoint is
`b7e63ac6bc1825fe0f92527faf3e9fd647c34126`. The frozen record below remains
historical evidence; its stop/resume conditions and planned owner transfer
are superseded by this explicit owner-authorised resumption. Do not move tags.

The Git repository contains the application in `BSA`. Thus `docs/HANDOVER.md`
in application instructions means this file, `BSA/docs/HANDOVER.md`, from Git
root. This record was assembled from fetched branch heads, issue bodies and
checkpoint comments, merged PR records, and committed evidence, not inferred
from session activity. All eight stream checkpoint commits were pushed before
this main documentation checkpoint. No feature PR was merged during the freeze.

## Where we are, in five lines

1. This is the synthetic, browser-only Prescription Exception Case Builder: agent gathers/recommends, code validates/calculates, human decides; no payment calculation or approval.
2. Hosting is Azure Static Web Apps Free at `/`; root configuration is emitted into `BSA/dist`; the deployment token is absent and no current live URL is verified.
3. Main's application revision at freeze is `98c888184db1df9c03539413b5e3b1db47f1ebfe`; the documentation checkpoint is the commit resolved by `git rev-parse checkpoint-2026-09-12^{commit}`.
4. Tasks 1-7 are Done; Tasks 8-13 are In progress with implemented features but incomplete integrated acceptance/final documentation; no task is Not started.
5. Transfer to an enterprise owner is pending, the destination is not yet supplied, and the user requires WilliamNg18 to remain a collaborator; verify the actual transferred access after resume.

## Done

These task commits are ancestors of the application main revision above.
Historical hosted claims in their original records are not current hosting proof.

| Task | Completed work | Commit |
| --- | --- | --- |
| 1 | Baseline arithmetic, seven gathering steps, constant judging and shared scene estimates | `ad7d5d86aedc0d07378f3b77622dbd72874f512c` |
| 2 | Today/default-Off presentation, source attribution and concise copy | `b7c4451e64d27e4c7c410d9e5647722f7f6ee64b` |
| 3 | Six-stage pipeline and phase-related pain markers | `96bf0973724c0ceb34d2532f2fc95dfd88f534c4` |
| 4 | Pharmacy check/correction/receipts, including unsupported-endorsement repair | `a131bad4c312d8e1b583f43ab4ce95e94c5abd56`, `7bdc1990f7c16a843ccebd86620d92c6d3a13fae` |
| 5 | Virtual month, sweep and shared-clock day simulation | `034121fe45b74ea024d6f6e1d2f6b76a676747d4` |
| 6 | Manual/assisted case views and immutable historical comparison | `36db32af9db823d1e32e6daf9f32d008a5c98a44` |
| 7 | Completed core verification and presentation performance work | `79bd2832f5f27e47af7022fc7899fe494356f206` |

The 18-row scope register has **3 Done, 15 In progress, 0 Not started**.
Done rows are A1 (scene count-in), A2 (calculator/shared estimates), and F
(shared lifecycle implementation). Other rows remain In progress because
their complete current acceptance or final presentation work is unfinished;
that does not mean their already-merged implementation is absent.

| Merged increment / scope | Merge or integration commit | Evidence / completion boundary |
| --- | --- | --- |
| Tasks 8-12 integrated feature foundation, including scope F lifecycle | `d9e06e198027ab673937000ee13cc32749760fae` | Includes preserved `62b0f7f`; not final Tasks 8-13 acceptance |
| SWA root hosting configuration | `d9e06e198027ab673937000ee13cc32749760fae` | Build configuration complete; resource/token/hosted verification incomplete |
| All size/performance budgets removed | `b23e478040331ea4327c862310d8821c30199f62` | Functional/accessibility gates only; gzip summary informational |
| S accessibility/CSP/reflow/focus/Reset motion, PR #22 | `22ec3459dee77818146ce7dbb99ca5baf47bb9ea` | Scoped evidence below; not universal WCAG certification |
| Healthy manual/unavailable pharmacy status, PR #23 | `ff00b3e7fb5d5b77266868c0d15a0c95d4c53ea3` | Issue #20 closed; three existing timing cases tracked by #34 |
| Eight chapters/nine stops, A3/A4 split, A5 loops, A7 cycle, A8 close, PR #30 | `c95ff1da094528236a38593c3de18342e0f51374` | Implementation merged; R's final full acceptance is unfinished |
| Scoped parity repairs, PR #36 | `85e9a01d919c6fdbfd9d10da3b4a90fce8d158a9` | Historical rows preserved; scoped count is 18/9/0/2/4 |
| Read-only queue Compare, PR #32 | `11ea0427385c86cf3bf3c1345760fa9dee2fd9a6` | Eight scoped browser cases and four axe reports clear |
| A1 scene-only count-in, PR #31 | `98c888184db1df9c03539413b5e3b1db47f1ebfe` | Combined check/591 units; six scene cases plus calculator retry; two axe reports clear |

## In progress

Every entry is now **frozen**, including streams whose owned increment is
already merged. Checkpoint heads are deliberately not rebased to main.
Do not merge empty checkpoint commits from delivered streams as new features.

### R: behaviour and full regression acceptance

- **Issues/PR:** #14, #19, #29; PR #33 open, not merged; follow-up #35.
- **Branch:** `williamng18-production-round-trip`.
- **Checkpoint head:** `500e883d1f48a03b32ae0864751a44705b996382`.
- **Owns:** functional e2e, `claim-detail.tsx`, `lifecycle-history.tsx`,
  `claims-resubmission-comparison.tsx`, narrow component tests, and the
  explicitly handed-over eight-chapter/pipeline matrix expectations.
- **At freeze:** running final exact-source `696f077` Windows strict-header
  production fallback. Its owned `r-exact-final` process was stopped and
  port 4173 released. The log announced 1,019 tests/two workers but contains
  no completed-test markers or final exit. This is INTERRUPTED, not a pass.
- **Finished within branch:** approved-only On pharmacy reasons without
  history mutation (#19); truthful unchecked-resubmission pain (#29);
  root-path, skip-focus, eight-chapter and pipeline coverage; the last three
  stale chapter assertions corrected. Production source unchanged by those
  final test corrections.
- **Actual proof:** check passed; 607 units/22 files passed. Inventory 1,022
  tests/26 files is not execution. Linux run `34687220652` at `1c2a3ba`
  completed 1,016 passed/3 failed (three stale chapter expectations, not
  accepted failures); 673 unique axe reports/zero violations and 193 CSP
  reports/zero entries. All three corrected tests passed in 45.5 seconds,
  one worker, no retry. Replacement jobs `34688435023` and `34688433548`
  never started because of the account billing/spending restriction.
- **Not finished:** complete exact-corrected-head 1,019 blocking tests,
  separate three quarantined cases, PR #33 merge, final acceptance.
- **First next action after authorised resume:** read
  `docs/checkpoint-2026-09-12/R/HANDOFF.md` on this branch, verify the
  checkpoint and run complete root/strict-header acceptance. Use working
  enterprise CI if available; otherwise the local commands below. Do not
  claim a full pass from the corrected three-test run. Fix real failures,
  retain evidence, then request coordinator merge.
- **Durable evidence:** the checkpoint branch contains
  `BSA/docs/checkpoint-2026-09-12/R/`, its JSON ledger and compact raw logs.
  Large local traces are separately identified in that ledger.

### S: accessibility and strict CSP

- **Issue/PR:** #15 closed; PR #22 merged.
- **Branch:** `williamng18-accessibility-strict-csp`.
- **Checkpoint head:** `db7077b17b747effd48ad88be81804aa1d71d868`.
- **Owns:** CSP scroll adapter, production-header server/config, accessibility
  matrix, mobile case-pack wrapping, AppShell focus and Reset motion.
- **At freeze:** owned work already merged; clean branch, empty checkpoint,
  no running owned process. Only read-only pipeline-matrix advice to R
  followed the merge.
- **Finished/proof:** Linux `1a103e3` scoped 183 browser cases, 247 unique axe
  and 183 CSP reports clear; whole run was 760 passed/205 failed, not green.
  Final affected controls at `32b5342`: 38/40 then two unchanged rechecks
  passed; nine keyboard checks, seven follow-up axe and nine CSP reports
  clear. Combined check/557 units passed. R now carries the new pipeline
  entries; do not relabel the old matrix as covering that route.
- **Not finished:** no S implementation outstanding; final assembled
  application acceptance belongs to R, then V/D.
- **First next action:** after resume, read R's final findings and assist
  only with a concrete accessibility defect; do not repeat the completed
  matrix or reopen hosting design without a failure.

### V: narration, screenshots and scope

- **Issues/PR:** #16 and #25 open; PR #24 remains draft.
- **Branch:** `williamng18-visual-reconciliation-and-demo-docs`.
- **Checkpoint head:** `b3acc1392dfc5074a943a184e026a4fb856341fc`.
- **Owns:** README, SPEC, KNOWN-ISSUES, demo-script, SCOPE, docs/screens and
  its own decisions/learnings. No application/test edits.
- **At freeze:** waiting for R's tested merge; no final capture or rebase
  underway. An owned wait process was stopped.
- **Finished/proof:** 103 tracked, hash-verified and visually reviewed
  1440x1000 light/reduced-motion images from `d9e06e1`, completed
  `2026-09-11T17:49:43.723Z`; retained per-image axe/overflow/page-console
  errors zero. Initial check passed; 559 units/one 5-second timeout followed
  by 560/20 files with two workers. Numeric narration: 33 families reviewed,
  four corrected, 29 retained, zero deferred narration corrections.
- **Not finished:** initial images/narrative depict seven chapters. Prepared
  107-image/32-destination final harness has never run on final eight-chapter
  code. Final refresh, final README/SPEC/story/known-issues reconciliation,
  PR-ready state and merge are incomplete.
- **First next action:** after resume and R's verified merge, rebase onto
  final main preserving this transfer's SCOPE/MEMORY/PROGRESS and V's newer
  content; obtain a free capture port; execute/review the fresh 107-image
  matrix. Do not resume a manifest against a different source revision or
  treat initial 103 images as final proof.
- **Durable evidence:** all initial PNGs, manifest, `capture.mjs`,
  `review-captures.py`, and `account-transfer-checkpoint.json` are committed
  under `BSA/docs/screens/integrated/` on V's checkpoint.

### D: final documentation and task acceptance

- **Issue:** #17 open; no PR.
- **Branch:** `williamng18-issue-17-stream-d-final-memory-task-acceptance-an-b76afa`.
- **Checkpoint head:** `76b36b72ccd0f45750e46daa26edb5ba2e4956da`.
- **Owns:** final MEMORY, Tasks 8-13 PROGRESS acceptance and docs/BRANCHES.
- **At freeze:** intentionally paused after readiness inspection; empty
  checkpoint pushed. No source/doc edits, tests, task ticks or PR performed.
- **Finished:** read governing documents/dependencies and reported readiness.
- **Not finished:** all final acceptance reconciliation/documentation.
  `BSA/docs/BRANCHES.md` did not exist at readiness; root BRANCHES is policy.
- **First next action:** after resume, wait for R and V merges and exact
  evidence, then rebase. Correct final memory/branch record and tick only
  genuinely accepted Tasks 8-13. Report actual URL or explicitly unverified
  hosting, unit/browser/axe results and deferred items. No old size budget.

### Parity/helper: audit and healthy manual status

- **Issues/PRs:** #18/#20 closed, PRs #21/#23/#36 merged; #34 open.
- **Branch:** `williamng18-parity-verification-and-owned-applicatio`.
- **Checkpoint head:** `8ca238fc83c80eb56f0cc9bd012c5687258f6934`.
- **Owns:** PARITY register; completed workbench status and corresponding
  assistance/controls/pharmacy expectations. No current unmerged feature.
- **At freeze:** empty checkpoint, clean branch, no owned running process.
- **Finished/proof:** manual Off versus unavailable distinction; original
  26/29 focused cases plus exactly three unchanged rechecks; 12 axe outputs
  clear. Combined S/helper check and 557 units/19 files passed. Three exact
  pre-existing timing cases are conditionally tagged `@quarantine` under
  #34; the new Issue20 guards remain blocking.
- **Not finished:** #34 timing investigation/tag removal and final
  whole-application parity reconciliation after R/V; historical parity
  counts are not final acceptance.
- **First next action:** after resume, read final R/V evidence and update
  only assigned parity rows. R owns #34's three instances; do not duplicate
  functional edits or remove tags without stability evidence.

### Tour: eight chapters and referral cycle

- **Issue/PR:** #26 closed; PR #30 merged.
- **Branch:** `williamng18-eight-chapter-tour-and-referral-cycle`.
- **Checkpoint head:** `462cba621a5b39c16cb77bcad83cfe625c056be4`.
- **Owns:** tour navigation/metadata/composition, cycle guide, narrow tour
  tests. R owns the final integration test corrections.
- **At freeze:** merged and clean; empty checkpoint; no owned process.
- **Finished/proof:** eight chapters/nine stops, separate pipeline/Four
  cases, longer manual loops and shorter assisted loops, five-stage guide
  beside real recorded state. Combined check/567 units passed. Ten selected
  browsers: first seven passed/three failed, then three passed after
  chapter/focus corrections. Both real human/code referral-to-synthetic-paid
  paths and responsive axe at 360/1440 both modes passed.
- **Not finished:** no tour implementation pending; exact integrated
  acceptance and V's new images remain unfinished.
- **First next action:** after resume consult R's final chapter-test results;
  do not overwrite R's pipeline/heading corrections or create a duplicate PR.

### Scene: derived estimate count-in

- **Issue/PR:** #27 closed; PR #31 merged.
- **Branch:** `williamng18-scene-estimate-count-in`.
- **Checkpoint head:** `df5d8eb0c2bde4648cd3cc712f911b5fc5f11c93`.
- **Owns:** baseline scene and scene-local animation helpers/tests.
- **At freeze:** merged and clean; empty checkpoint; no owned process.
- **Finished/proof:** exact derived values, stable final accessible labels,
  cancellation and immediate reduced-motion values. Combined check and
  591 units/21 files passed, including 14 scene units. Six scene browsers
  passed and an unchanged calculator retry passed; two axe reports clear.
  Earlier startup timeouts ran no tests; a definition-wrapper expectation
  was corrected; a later calculator timeout is retained, not a clean 7/7.
- **Not finished:** no scene implementation pending; final integrated
  acceptance remains with R/V/D.
- **First next action:** after resume assist only if final integration finds
  a concrete count-in regression; do not repeat completed feature work.

### Queue: read-only Compare

- **Issue/PR:** #28 closed; PR #32 merged.
- **Branch:** `williamng18-queue-comparison-control`.
- **Checkpoint head:** `274549843e57e872a3ef2462013bc0fa68e37c19`.
- **Owns:** queue Compare composition/component and narrow tests; no
  projection/store/lifecycle changes.
- **At freeze:** merged and clean; empty checkpoint; no owned process.
- **Finished/proof:** accessible inline comparison using the same scenario
  and shared clock, close/focus/Reset behaviour. Combined check/577 units
  passed. Exact Linux `6d34988` run `34635510262` accounted for all eight
  Compare cases passing and four named axe reports clear; total run was
  563 passed/227 failed. Local first startup ran zero tests, later run had
  three passes/five timeouts; anomalous elapsed time is not a reliable claim.
- **Not finished:** no Compare implementation pending; final R/V/D
  integrated proof and capture remain incomplete.
- **First next action:** after resume assist only with a concrete
  integration defect; preserve one source of scenario arithmetic.

## Not started

**Zero of the 18 scope items is Not started. No unowned scope issue exists.**
All incomplete rows have begun implementation or acceptance and are frozen
under their named owners. D's final authoring is deliberately pending after
readiness, so J is In progress, not an unassigned new feature.
Open #34 and #35 are named timing follow-ups owned by R, not additional
unstarted scope rows. Do not invent a new issue to duplicate them.

## Blockers

- **Transfer freeze:** user is moving the repository; destination account is
  not supplied. Resume only on the exact new-owner message above.
- **Azure:** `AZURE_STATIC_WEB_APPS_API_TOKEN` was absent in a fresh
  `gh secret list`; resource/subscription and current live URL unverified.
  User owns resource/token setup using DEPLOYMENT. Do not guess a URL.
- **GitHub Actions:** fresh check-run annotation `103539408556` for run
  `34688435023` says the job did not start because recent account payments
  failed or a spending limit needs increasing. No tests ran. No billing
  change was made. Enterprise owner must verify its Actions entitlement;
  local strict-header acceptance remains an available alternative.
- **R:** full exact corrected-head acceptance was interrupted for transfer.
  R's #19/#29 source and final test fixes are only in PR #33, not main.
- **V waits on R's files:** `claim-detail.tsx`, `lifecycle-history.tsx`,
  `claims-resubmission-comparison.tsx` and final tour/e2e fixes must be tested
  and merged before fresh screenshots and story reconciliation.
- **D waits on R then V:** no final Tasks 8-13 ticks until acceptance and
  final docs/captures. S/T/Scene/Queue/helper are already merged.
- **Provider facts:** Free SWA has three concurrent preview environments;
  a PR workflow trigger does not prove a live preview without token/quota.
  No project byte budget or performance score should be reinstated.

## Merge order to follow

No merges during this freeze. After authorised resume:

1. R and S first. S #22 is already merged; validate and merge R #33.
   Tour #30, helper #23, Queue #32 and Scene #31 are also already merged.
2. V rebases, refreshes the actual final inventory and documents it; then
   merge PR #24 (issues #16/#25).
3. D updates final memory/branches/progress, ticks accepted Tasks 8-13 and
   reports the real final commit, URL or hosting limitation, and test counts.

Legacy open PRs #8/#10/#12/#13 and issues #5/#6/#7/#9/#11 belong to the earlier
integration. Their source branches remain on the remote. Do not merge them
blindly over the integrated lifecycle: compare with `62b0f7f`/`d9e06e1`
and close or reconcile only after authorised review.

## Rules to read first

From the application directory, in this order:
[AGENTS.md](../AGENTS.md), [MEMORY](MEMORY.md), [DECISIONS](DECISIONS.md),
[LEARNINGS](LEARNINGS.md), [PROGRESS](PROGRESS.md), [SCOPE](SCOPE.md),
then this file. The final freeze instruction supersedes older autonomous
"keep working" instructions and obsolete 350,000-byte budget text in issues.

Six outcomes remain: A sufficient, B August referral/July sufficient,
C unresolved quantity conflict, D abstention/NOT_RUN, E rules-only/no model,
F historical decision preserved. Agent never changes lifecycle state; paid
is synthetic existing pricing. On pharmacy reasons are explicitly approved
drafts. UK English, no em dashes, synthetic notice and human authority remain.

## How to resume

These are instructions for **after** the exact resume message, not permission
to run now. Use a new clone/isolated worktree under the transferred repository.
Never repurpose another session's working directory. GitHub redirects may keep
old links working; update `origin` to the verified new owner, not a guessed name.
Keep WilliamNg18 as a collaborator as requested and verify actual access.

```powershell
git clone <verified-new-owner-clone-url> BSA-transfer
Set-Location .\BSA-transfer
git fetch origin --tags
git switch --track origin/<branch-from-the-stream-entry>
git log -1 --format="%H %s"
Set-Location .\BSA
npm ci
npm run check
npm test -- --maxWorkers=2
```

Use the exact branch and checkpoint head in each entry. If a branch has
advanced, inspect its diff against the immutable stream tag before proceeding.
Read that stream's **First next action** before implementation. Install
Chromium only if missing (`npx playwright install chromium`, or `--with-deps`
on a supported Linux host).

| Stream | Tests/steps after common setup and assigned resumption |
| --- | --- |
| R | `npm run test:e2e -- --workers=2 --reporter=dot --grep-invert @quarantine --output <absolute-outside-sync-folder>\R-blocking`; then `npm run test:e2e -- --workers=1 --reporter=dot --grep @quarantine --output <absolute-outside-sync-folder>\R-quarantine`. Expect inventory 1,022, of which 1,019 block and three are informational; report actual counts, not expected counts. Default config builds and serves real headers at `/`. If build startup is slow, explicitly `npm run build` then use `--config tests/e2e/production-artifact.config.ts` for the same emitted artifact. |
| S | No new feature work. If R assigns a defect: `npm run test:a11y -- --workers=1 --reporter=dot`; `PLAYWRIGHT_PORT=4183` via `$env:PLAYWRIGHT_PORT='4183'`. R includes the later pipeline additions, so start from current main for new acceptance, not S's old inventory. |
| V | After R merge, rebase and preserve all checkpoint tracking updates. From `BSA`: `npm run preview -- --host localhost --port 4193 --strictPort`; in a second terminal at Git root: `node .\BSA\docs\screens\integrated\capture.mjs`. Verify actual harness configuration, fresh source revision, expected 107 images and all errors; review original PNGs with the committed helper. Do not run in parallel with a saturated full browser suite. |
| D | After R and V merge, rebase; inspect exact recorded checks rather than rerun for docs only; update MEMORY/PROGRESS/docs-BRANCHES and issue #17. Report hosting as unverified if still absent. |
| Parity/helper | Inspect PARITY and #34 after final R/V evidence. If assigned #34: `npx playwright test assistance.spec.ts pharmacy.spec.ts --workers=1 --grep @quarantine --reporter=dot`; retain every original assertion. |
| Tour | Only for an assigned regression: `npx playwright test tour-cycle.spec.ts pipeline.spec.ts --workers=1 --reporter=dot`; R owns final split-chapter corrections. |
| Scene | Only for an assigned regression: `npx playwright test scene-count-in.spec.ts calculator.spec.ts --grep "scene estimate|all seven live steps" --workers=1 --reporter=dot`. |
| Queue | Only for an assigned regression: `npx playwright test queue-compare.spec.ts --workers=1 --reporter=dot`. |

Restore only known checkpoint branches; do not force-push archive references.
Checkpoint tags are annotated: `checkpoint-2026-09-12` for this main record,
and suffixes `R`, `S`, `V`, `D`, `Parity`, `Tour`, `Scene`, `Queue` for stream
heads above. All use the message "State before transfer to the enterprise account".

## Preserved references and evidence

Before/after verification must keep these Git objects identical:

| Reference | Object / peeled commit |
| --- | --- |
| `refs/heads/last-known-good` | `23ca3312336fe76a349db6b7f29cff0f13c6dd82` |
| `refs/tags/lkg-2026-09-09` | tag `77b0d5c0f9c63619d7984319019f2cd61fcdd3b8`, commit `23ca3312336fe76a349db6b7f29cff0f13c6dd82` |
| `refs/heads/cowork-v1` | `a2ab8019ad80796eeeb7b06807d5d0062d98f11f` |
| `refs/tags/cowork-v1` | tag `6192f693b389c688f2ce69e29f17c81d1369f0ef`, commit `a2ab8019ad80796eeeb7b06807d5d0062d98f11f` |

Compact S/helper/Tour/Scene/Queue raw logs and summaries are copied into
`docs/checkpoint-2026-09-12/evidence/` on main. R's compact logs/ledger are
on its pinned branch; V's original images/manifest/harness are on its pinned
branch. Issue checkpoint comments preserve the state independently of these
files; #17 also receives the complete In progress and Not started sections.
Large raw traces remain in the explicitly named old session evidence locations
unless archived as release assets by the checkpoint operation. Do not mistake
expired CI artifacts or local session paths for durable Git objects.
