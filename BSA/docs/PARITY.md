---
title: Application parity and owned acceptance gaps
description: Source comparison, bounded evidence and follow-up ownership for issue 18.
ms.date: 2026-09-12
---

# Parity audit

This is a source/evidence audit, not integrated acceptance of Tasks 8-13.
The comparison starts with preserved integration `62b0f7f`, checks the public
contracts frozen at `0598e8c`, and examines integration main `d9e06e1`.
The documentation branch was then rebased on policy-only main
`b23e478040331ea4327c862310d8821c30199f62`. R/S/V fixes described below are
not included in that audited main revision.

There is no lost application implementation in the `62b0f7f..d9e06e1`
source diff: its only `BSA/src` change is an `App.tsx` hosting comment.
The domain-source diff is empty. Compared with `0598e8c`, however, there
are 59 changed source files, including the intended lifecycle, claims and
navigation implementation. An empty diff does not prove current browser
acceptance, nor does an unchecked task mean its implementation is absent.

## Historical status definitions and totals

Each numbered row counts once. These are capability/evidence counts, not
test counts, screen counts or a percentage of application completion.

* **Preserved:** implementation or contract is retained, supported by the
  specified source/test evidence. This does not imply every rendering passed.
* **Changed with decision:** an identified governing decision or authorised
  task explains the change. Contract-era additions already in `62b0f7f`
  are explicitly identified rather than called new regressions.
* **Changed without decision:** an observed behavioural regression has no
  decision permitting that regression, even if its triggering policy is approved.
* **Missing:** a required property is demonstrably absent. The underlying
  feature may still exist; the row names the missing property precisely.
* **Not yet verified:** implementation exists or evidence is pending; absence
  of validation alone is not a missing implementation.

| Status | Count |
| --- | ---: |
| Preserved | 18 |
| Changed with decision | 6 |
| Changed without decision | 1 |
| Missing | 4 |
| Not yet verified | 4 |
| Total | 33 |

## Historical capability register

Paths below are relative to `BSA` unless explicitly prefixed with `root`.
Source findings apply to the audited main, not unmerged stream branches.
Unit evidence marked **P** is the targeted run recorded below. Browser
files are coverage evidence, not a claim that those tests passed in this audit.

| ID | Capability | Baseline / decision evidence | Current source / validation evidence | Status | Owner / follow-up |
| --- | --- | --- | --- | --- | --- |
| 01 | Overview Today / With agent contrast | Integrated scene, calculator, pipeline and two-places views in `62b0f7f`; DECISIONS: Meet today first | `pages/home.tsx`, `components/demo/baseline-scene.tsx`, `baseline-calculator.tsx`, `exception-pipeline.tsx`, `tour-diagrams.tsx` retain mode-dependent estimates, tasks and bounded proposals | Preserved | R #14; V #16 visuals |
| 02 | Manual pharmacy submission remains usable | Integrated Task 4; frozen contract permits Off snapshots with no check | `components/demo/pharmacy-workbench.tsx`, `lib/pharmacy-store.ts`: typed submission, explicit Continue, immutable receipts and shared submission; no invented completed precheck | Preserved | R #14 |
| 03 | Healthy Today status on pharmacy check | Default-Off decision and current requirement that Today never looks broken | `pharmacy-workbench.tsx` maps every `!enabled` to `Agent unable to determine`, including complete A with intentional Off; `tests/e2e/pharmacy.spec.ts` explicitly expects this Off label. Manual submission exists; neutral manual status is missing | Missing | R #20; V refresh |
| 04 | Scripted pharmacy check and explicit correction | Integrated Task 4; `parallel-contracts.md` A/B/D acceptance | `hooks/use-pharmacy-check.ts`, `lib/domain/pharmacy-check.ts`, workbench: version/clause, staged checks, explicit B date application, pending/unavailable snapshots; D retains capture stop. **P** verifies the correction bridge and revision invariants | Preserved | R #14 |
| 05 | Manual / assisted pack, trace and record | Integrated Task 6; DECISIONS: manual records and frozen lifecycle boundary | Three case pages and `components/demo/case-presentation.tsx` retain seven manual gathering steps, gated assisted fields, read-only comparison, playback and historical replay. Off deliberately disables agent replay; this is not a missing trace | Preserved | R #14 |
| 06 | Reference screens and global boundary remain available | Integrated Evaluation, Boundary, Assumptions, Architecture and not-found content | `routes.tsx`, corresponding pages and `components/app-shell.tsx`: reference content remains available with global mode, synthetic disclosure and governing principle. Static reference content is not evidence of mode-specific operational work; universal visual contrast remains row 28 | Preserved | R #14; V #16 |
| 07 | Calculator arithmetic and invalid inputs | DECISIONS: constant judging and item-based pharmacy catch; `task-1-baseline-model.md` | `lib/domain/baseline.ts`, `baseline-defaults.ts`, `hooks/use-baseline-scenario.ts`; **P** covers conserved disjoint cohorts, constant judging, bounded referrals, fractional inputs, zero residual as Not established, and no stale valid fallback | Preserved | R #14 |
| 08 | Truthful figure attribution | Integrated Task 2/3; attribution decision and offline source register | `lib/domain/public-facts.ts`, `data/reference/source-audit.ts`: approximately 1.1 billion annual items, approximately 85,000 monthly referrals, monthly publication; 1,000,000/12 discrepancy disclosed. **P** pins the three figures and source line. No independently verified external-statistics claim | Preserved | V #16 |
| 09 | Queue at scale and interactive fillers | Integrated Task 5; DECISIONS: projections separate from evidence | `lib/domain/queue-model.ts`, `components/demo/queue-month.tsx`, `queue-manual.tsx`, `pages/queue.tsx`; bounded segments, logical jumps and Today dialogs exist. **P** exercises billion-item classification and bounded rows without engine calls | Preserved | R #14 |
| 10 | Sweep and simulated day remain presentation only | DECISIONS: single 540-minute operator budget and bounded projections | `lib/queue-store.ts`, `components/demo/queue-day.tsx`; **P** pins one shared budget, pause/step, Off cancellation and no writes to lifecycle, decisions or receipts. These are not automatic dispositions | Preserved | R #14 |
| 11 | A sufficient | Frozen six-outcome rule; original complete endorsement | `lib/domain/cases.ts`, `agent.ts`; **P** pins SUFFICIENT, PASS and complete evidence without fixture mutation | Preserved | R #14 |
| 12 | B August referral and July sufficient | Frozen six-outcome rule; initialled, not dated | **P** pins August REFER_BACK/PASS, July SUFFICIENT/PASS with unchanged evidence; explicit correction changes only a session revision, not the original B fixture | Preserved | R #14 |
| 13 | C quantity conflict requires information | Frozen six-outcome rule | **P** pins captured 56 versus ledger 84 and REQUEST_INFORMATION. `lifecycle-model.ts` leaves quantities unchanged on confirmation; `lifecycle-store.test.ts` contains the dedicated confirmation guard, not run here | Preserved | R #14 |
| 14 | D abstains with three reasons | Frozen six-outcome rule and quality threshold 0.60 | **P** pins no provision, quality 0.31, only 1/3 readings agreeing, ABSTAIN, gate NOT_RUN and no draft. `lifecycle-model.ts` preserves D readings on edit; the dedicated edited-D guard is in `lifecycle-store.test.ts`, not run here | Preserved | R #14 |
| 15 | E clears without an agent call | Frozen six-outcome rule | **P** pins `agentInvoked: false`, deterministic PLAN/HAND_OFF and product/claim lookup only; shared queue arrival attributes synthetic release to existing pricing | Preserved | R #14 |
| 16 | F remains historically decided | Frozen six-outcome rule; seeded DR-000871 | **P** preserves original record and decided seed state; an explicit later revision can receive a new human decision without overwriting history. Re-running the engine alone is not proof of an F lifecycle regression | Preserved | R #14 |
| 17 | Frozen public lifecycle signatures and labels | `0598e8c` `lib/domain/lifecycle.ts` and `parallel-contracts.md` | Original states, actors, six method argument/return signatures and `LIFECYCLE_LABELS` remain. Additive revision and approval metadata is accounted for separately in row 18 | Preserved | R #14 |
| 18 | Shared lifecycle, revisions and immutable history | Frozen methods originally threw; authorised Task 8 and DECISIONS: payment/lifecycle authority; implementation already in `62b0f7f` | `lib/store.ts`, `lib/domain/lifecycle-model.ts`, `lifecycle-seed.ts`, `lifecycle.ts`; clone/freeze, linked revision/record events, explicit transitions and rejection of agent state changes. **P** exercises immutable attempts and approval linkage | Changed with decision | R #14; D #17 acceptance |
| 19 | Claims list, all states, detail and state-specific actions | Heading-only frozen claims route; authorised Task 9; implementation already in `62b0f7f` | `pages/pharmacy-claims.tsx`, `components/demo/claim-detail.tsx`; pharmacy/state filters, synthetic claimed totals, correction, confirmation and read-only dispositions; `tests/e2e/lifecycle-ui.spec.ts` covers seven-state seeds. Display defect is row 21 | Changed with decision | R #14; V #16 |
| 20 | Gate and human decision authority | Frozen principle; DECISIONS: payment/lifecycle authority | `lib/store.ts` validates state, current recommendation/gate, reason and explicit draft approval; `appendHistory` rejects agent transitions. **P** verifies no approval from toggling, no payment from a claimed-ready snapshot and explicit human sufficient after correction | Preserved | R #14 |
| 21 | Only operator-approved reasons shown to pharmacy On | Current governing requirement; automatic approval is prohibited | `claim-detail.tsx` renders raw `event.reason` unconditionally, then says no approved draft for seeded B. `lifecycle-history.tsx` also renders raw reasons in pharmacy history. Store approval metadata exists; approved-only pharmacy presentation is missing. V browser evidence is recorded in #19 | Missing | R #19; V refresh |
| 22 | Full Off-to-On same-item round-trip implementation | Authorised Task 10; integrated `62b0f7f` implementation | **P** bridge test covers Off referral, unaided resubmission, On approved exact fix, Ready precheck, human sufficient, synthetic paid and all prior attempts. `tests/e2e/lifecycle-ui.spec.ts` supplies click-level coverage. Production acceptance remains row 29 | Changed with decision | R #14 and #19 |
| 23 | Follow / Switch side / same-case links | Authorised Tasks 10/12; integrated `62b0f7f` implementation | `components/demo/follow-banner.tsx`, `lifecycle-history.tsx`, `case-header.tsx`, `lib/case-links.ts`; both sides use the same ID, dismiss clears presentation state. **P** proves follow/mode changes preserve records, revisions and events | Changed with decision | R #14; S #15 focus |
| 24 | Seven-chapter tour and navigation | Frozen six chapters; authorised Tasks 11/12 insert claims after queue; already integrated | `lib/tour-navigation.ts`, `routes.tsx`, `components/demo/tour-rail.tsx`, `top-nav.tsx`; **P** pins seven chapters/eight stops, pharmacy substop, claims before close, same-ID query and guarded Alt shortcuts | Changed with decision | R #14; S #15 keyboard |
| 25 | Reset and in-memory-only operational data | Default/Reset Off decision; immutable seed requirement | `lib/store.ts` replaces seeded slices, defaults and Follow; shell reset remount clears local controls. **P** pins seed restoration and flag state. Source search found no storage persistence or network API use in `src` for the searched APIs; `tests/e2e/offline.spec.ts` supplies offline browser coverage, not run here | Preserved | R #14 |
| 26 | Complete accessibility / reduced-motion acceptance | Existing reduced-motion hooks, native controls, live trace and historical Task 7 evidence | Current hooks and `index.css` retain reduced-motion support. S's real-CSP full matrix and keyboard checks are not yet accepted on main. Historical 334 zero-violation audits are not current integrated evidence or full WCAG conformance | Not yet verified | S #15 |
| 27 | Controls work under the required strict CSP | `d9e06e1` adds root self-only CSP; policy is approved, blocked modal styles are not | S reproduced Reset injecting an inline style element via `react-remove-scroll-bar` / `react-style-singleton`: one `style-src-elem` violation despite zero reset axe violations. Individual React CSSOM positioning was not the reproduced blocker. Unmerged fix retains CSP | Changed without decision | S #15 |
| 28 | All-screen Today / With agent, responsive layout and one-row header acceptance | Current all-screen contrast and seven-width requirements | Source rows cover the mode-dependent operational views and invariant reference surfaces; R/S/V still need the final per-screen/both-mode review, including 360/768/960/1024/1280/1440/1920 header widths. No claim that static-page presence proves universal contrast or visual acceptance | Not yet verified | R #14; S #15; V #16 |
| 29 | Full root-path production regressions and six-outcome UI acceptance | Integrated checkpoint expressly withheld Task 13 acceptance | Coordinator reports main CI 34625830555 at `d9e06e1`: 556 passed / 227 failed. Many failures are stale escaped `/BSA` assertions, not missing routes. R's corrected 783-test run is still in progress at this snapshot; no aggregate PASS | Not yet verified | R #14; D #17 final evidence |
| 30 | Current narrative documentation and reconciled screenshots | Source implementation supersedes old incremental descriptions | Audited `docs/SPEC.md` still describes six chapters and no queue/lifecycle integration; `docs/demo-script.md` says Reset turns Agent on and retains old figures. `KNOWN-ISSUES.md` includes stale implementation claims. Current accurate narrative is missing; V already owns correction and fresh captures under #16 | Missing | V #16 |
| 31 | Actual hosted root/deep-link evidence | Azure Static Web Apps Free at `/` is settled | Root configuration and deployment workflow exist; no current actual site URL is verified. No token is expected and provisioning is user-owned. Local preview/CI cannot establish deployed headers or deep links. This is not a stream blocker | Not yet verified | D #17 records owner setup |
| 32 | Removal of all byte/performance budgets | Coordinator's explicit no-budget policy; `b23e478` supersedes earlier advisory-budget wording | Seven budget unit tests and one payload-only browser test removed; functional application source unchanged. CI retains one informational gzip line; tagged quarantine runs separately with an issue. These removals are deliberate, not Missing capabilities | Changed with decision | Coordinator; D #17 |
| 33 | No horizontal overflow in phone case packs | Current responsive requirement; functional controls must remain reachable | Coordinator reports actual 5 px Linux 360-dark pack overflow for A/B/C/E/F in both modes/motion from CI 34625830555. This is a proven reflow gap, distinct from the stale route assertions and pending overall matrix. Exact fixing files/commit remain S-owned | Missing | S #15; V refresh |

## Scoped merged update: 12 September 2026

This update supersedes only rows **03, 27 and 33** for the merged snapshot
`ff00b3e7fb5d5b77266868c0d15a0c95d4c53ea3`: S's #22 merged at
`22ec3459dee77818146ce7dbb99ca5baf47bb9ea`, followed by #20's fix in #23.
The historical register and its 18/6/1/4/4 counts remain unchanged above.
Other rows are carried forward, not re-audited or promoted to acceptance.
In particular, the historical descriptions of then-pending streams are not
claims about their present activity.

| Row | Historical status | Status at scoped merged snapshot | Merged evidence and remaining limit |
| --- | --- | --- | --- |
| 03 | Missing | Changed with decision | #23 distinguishes intentional Off (`Not checked: manual submission`), On/unavailable (`Agent unavailable: manual submission`) and actual scripted inability. DECISIONS records the display-only policy; snapshots, submission and canonical data are unchanged. Focused production evidence: 26/29 first run, then exactly three unchanged rerun passes, not 29/29 single-run. All three new Issue20 guards passed first run; 12 axe outputs across the runs had zero violations. #34 tracks exactly three conditionally quarantined pre-existing timing-sensitive instances; 26 focused cases remain blocking. |
| 27 | Changed without decision | Changed with decision | #22 replaces the demonstrated injected modal stylesheet through `lib/csp-scroll-lock.ts`, external CSS and a narrow Vite alias, retaining root CSP. S reports 183 owned Linux tests passed, 247 unique axe outputs with zero violations and 183 CSP reports with zero violations at `1a103e3`; overall CI still had 760 passed / 205 failed. Final affected controls: 38/40, then two unchanged isolated passes; all nine owned keyboard checks passed with seven follow-up axe and nine CSP reports clear. These are scoped local/CI results, not full WCAG, manual screen-reader or hosted acceptance. |
| 33 | Missing | Changed with decision | #22 bounds and wraps the existing another-attempt link in `pages/case-pack.tsx`, retaining its label/destination. S's 360px reflow coverage addresses the Linux 5px and enlarged-text Windows 17px reproduction for A/B/C/E/F. The same S matrix and final affected-control evidence above support this repair; they do not establish every future screen/width or replace V's capture refresh. |

Applying only these three overrides to the same 33-row inventory yields:

| Status | Historical count | Scoped merged count |
| --- | ---: | ---: |
| Preserved | 18 | 18 |
| Changed with decision | 6 | 9 |
| Changed without decision | 1 | 0 |
| Missing | 4 | 2 |
| Not yet verified | 4 | 4 |
| Total | 33 | 33 |

These counts do not declare the whole application accepted. Rows 21 and 30
remain carried-forward Missing findings; pending full-suite, visual and hosted
claims remain bounded by their own evidence. S evidence is stream-reported and
preserved in its merged decisions/learnings; this update ran no new browser
or full audit. #23's rebase preserved its workbench and three test files
byte-for-byte, with both streams' append-only histories retained. The combined
base now uses S's real-header production server, not the Vite preview used by
the earlier #20 focused run; do not relabel that run as a postmerge CSP test.
At ready head `258f803` on S's merged base, combined `npm run check` passed
without warnings and Vitest passed 557 tests in 19 files. This is a fresh
combined check/unit result, not a new combined browser or hosted result.

### Later tour integration, outside this scoped count

This document is rebased onto `c95ff1da094528236a38593c3de18342e0f51374`,
where T's #30 adds the eight-chapter tour and pharmacy referral cycle.
That later integration is separate from the S/#20 snapshot above. Historical
row 24 describes the earlier seven-chapter contract, not the new current tour.
No T capability or acceptance evidence is re-audited here, and the scoped
18/9/0/2/4 counts do not claim parity verification of the eight-chapter addition.

## Historical evidence and limits

**P: local targeted source-parity guards.** At `b23e478`, from `BSA`:

```text
npm test -- --reporter=dot tests/unit/agent.test.ts tests/unit/lifecycle-ui-bridge.test.ts tests/unit/lifecycle-revisions.test.ts tests/unit/baseline.test.ts tests/unit/queue.test.ts tests/unit/tour.test.ts
6 files passed; 353 tests passed; exit 0; 5.82 seconds.
```

The initial command on this isolated checkout failed because Vitest was not
installed. `npm ci --quiet --no-audit --no-fund` restored the existing lockfile
(432 packages, exit 0); no dependency manifest was changed. This bounded run
settles the six outcomes, arithmetic, revision/approval bridge, queue projection
and tour-contract questions. It is not R's full suite or S's accessibility run.

**Received stream evidence, not independently rerun here:**

* R reported `npm run check` exit 0 and
  `npm run test -- --maxWorkers=2`: 560 passed in 20 files at its `d9e06e1`
  base. Its full `npm run test:e2e -- --workers=2 --reporter=dot` collected
  783 tests on root-path preview port 4173, with no retries; completion pending.
  R retained `r-check-1.log`, `r-units-1.log`, `r-full-browser-1.log` in its
  session artifacts. Those counts precede removal of budget-only tests.
* S reproduced row 27 with its new, not-yet-merged
  `npm run test:a11y -- --grep 'keyboard reset' --reporter=line` on port 4183,
  using a static server that reads emitted `config.globalHeaders`.
  It recorded `style-src-elem: inline` from `index-D47xUcdK.js:1`.
  Eight focused real-CSP browser tests subsequently passed on S's branch,
  together with four new unit tests (564 total there) and check.
  The 159-browser/223-audit matrix was still in progress. Neither the command
  nor those branch-local counts describe the audited main.
* Coordinator reported `b23e478` check and 553 units in 18 files passing.
  The change from 560 to 553 is deliberate budget-test removal, not lost
  functional assertions. No final production count is inferred from that.
* Main's failed CI evidence is
  [run 34625830555](https://github.com/WilliamNg18/BSA/actions/runs/34625830555).
  R owns stale root-path assertions; S owns the actual phone reflow defect.
  Preserve the distinction rather than calling every failure a product gap
  or every failure a test-only problem.

The source-storage search covered `localStorage`, `sessionStorage`, `persist(`,
`fetch(`, `XMLHttpRequest` and `WebSocket` in `src` TypeScript/TSX; it is bounded
source evidence, not a network capture or a dependency-wide privacy audit.
No screenshots, full production run, axe run, hosted smoke test or deployment
were performed by this parity stream.

## Owned follow-up and stream progress

Existing issues already cover four proven gaps: #19 approved pharmacy reasons;
#15 strict-CSP modal styles and phone-pack reflow; #16 stale narrative and
visual reconciliation. They are linked rather than duplicated. The only
new issue filed by this audit is #20, scoped to the workbench's manual status
and matching functional expectations; the coordinator assigned it to R.
No unexplained source feature deletion was found.

| Stream | Progress at this snapshot |
| --- | --- |
| R #14 | Source round trip exists; full corrected production run pending; owns #19/#20 display fixes and regressions. No final browser PASS. |
| S #15 | Modal CSP failure and phone reflow gap proven; focused CSP fixes pass on its branch; full accessibility/keyboard/reduced-motion and postmerge acceptance pending. |
| V #16 | Owns current narrative and fresh production screenshots; must refresh #19/#20 and S-changed surfaces after R/S merge. Historical captures are not acceptance. |
| D #17 | Waits for R/S then V merges and exact tested revisions; owns final memory/progress, task ticks and honest unprovisioned-host report. Token absence is not blocking. |

Only `PARITY.md` is owned by this audit. No application, tests, screenshots,
other streams' documents, archive refs or task ticks were changed. Reassess
the affected rows against the actual merged R/S/V revision before using this
register as final acceptance. The 33-row inventory is the denominator; do not
silently replace source-preserved statuses with claims of browser verification.
