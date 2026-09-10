---
title: Known issues and remaining verification
description: Tour foundation verification, retained crash fixes, source limitations and deferred prototype work.
ms.date: 2026-09-10
---

## Tour foundation current scope

The new tour replaces the old Overview headline and operating KPI cards with
registry-backed chapters 1, 3, 4 and 6. Chapter 2 calculator and chapter 5 queue
simulation are explicitly planned, not implemented. The minimal prerequisite
grouped header is 56 px, with a mobile sheet, Agent: On/Off tooltip and confirmed
Reset demo. The amber disclosure collapses only its details; the principle and
synthetic label remain. Tour/disclosure choices stay in memory only.

The source registry and domain rules/fixtures are unchanged. Source
discrepancies, case-letter mapping and deferred numerical migration are in
[source-review.md](source-review.md). Legacy pharmacy/evaluation/architecture
copy is not universally migrated or endorsed by this PR. A common live service,
manual baseline, calculator, simulation and new manual/pharmacy views remain
unbuilt. Earlier phase sections below are historical and do not describe these
new header/reset/tour semantics.

### Tour validation status

Initial check found one Fast Refresh export warning, fixed by keeping the
locator-format helper private. All original 93 unit tests passed before adding
24 tour/source-disclosure tests. The first full production run passed 291/294:
all 30 axe audits passed; three tour harness assumptions failed (router trailing
slash, focus after an intentional flag toggle and retained hash-navigation state).
Those were corrected without relaxing any domain/gate assertions. The targeted
tour rerun passed 23/23.

Visual review then identified a tooltip/switch `data-state` collision. The
tooltip now wraps the switch rather than overwriting its checked-state styling.
An explicit state-attribute regression was added. The skip link now preserves
tour fragments while focusing main. The scene diagram branches between
straightforward pricing and operator handling rather than implying every item
passes through both paths.

Final Windows production verification after those fixes:

| Check | Result |
|---|---|
| `npm run check` | PASS, exit 0; typecheck/lint clean; existing Vite large-chunk warning remains |
| `npm test` | PASS, exit 0; 117 tests in six files, including the original 93 and 24 new tour/disclosure tests |
| Full production Chromium E2E | PASS, exit 0; 294 tests in 3.2 minutes; no failures, retries or skips |
| Axe | PASS; 30 audits included in the E2E total, zero violations |
| `git diff --check` | PASS, exit 0; Windows LF-to-CRLF notices, no whitespace errors |
| Selected QA captures | 20 PNGs saved for review, not committed |

The 294 E2E tests comprise 213 route tests, nine control tests, 14 assistance
tests, three forced gate-failure tests, one injected crash-boundary test, one
fresh-session offline-navigation test, 23 tour tests and 30 axe audits. The
production build and preview use `/BSA/`; no reused development server masks
asset or sub-path behaviour. Tour header checks cover all seven requested
widths in light/dark and On/Off. All five Overview chapters are axe-audited in
both assistance states/themes; Pharmacy, Queue, Case pack, Trace and the seeded
record retain both-theme audits.

The check build reports 873.76 kB JavaScript (273.02 kB gzip) and 123.27 kB CSS
(19.29 kB gzip), plus fonts. This is larger than the earlier 716.58 kB baseline:
the registry and new navigation components are eagerly bundled. The 500 kB
warning was not hidden or raised. Performance optimisation and Lighthouse
remain deferred; zero-warning/first-load performance goals are not met.

Selected desktop scene/cases and phone On/Off diagram/manual/close captures
were visually reviewed. The final switch renders its checked teal track and
the scene branches correctly. Browser inspection independently confirmed the
switch's checked attribute and computed colour; integrated-browser pointer
interaction was unreliable, so the automated production suite is the evidence
for navigation and keyboard behaviour.

Selected screenshots are in [qa/tour-foundation/README.md](qa/tour-foundation/README.md).
No source binary, account, Git reference or deployment was changed. No commits,
pushes or merges were performed. Local Chromium and automated axe checks do not
establish hosted behaviour, Linux CI, cross-browser support, screen-reader
operation or full WCAG conformance. The existing large-bundle warning remains
a separate performance issue.

## Phase 1 presentation UI removal

Presenter mode, Discussion mode, the presenter bar and discussion sheet,
their state and setters, the header subtitle and `/notes` have been removed.
All useful rehearsal and Q&A content is in [demo-script.md](demo-script.md).
The old presenter-overlap and route-specific prompt checks no longer apply.
The existing QA checklist was read; presentation-only expectations in older
briefs are superseded by this phase's explicit removal requirement.

Product shield and name, primary navigation, the agent switch, immediate
Reset demo, synthetic banner and principle remain. Reset confirmation belongs
to the next PR. Grouped navigation, dedicated toggle comparison, header
restructuring, baseline modelling and domain-rule edits remain planned, not
implemented by this change.

## Phase 1 local verification results

Tested on Windows from the nested application directory, on
`refactor/remove-presenter-ui` with uncommitted changes over
`23ca3312336fe76a349db6b7f29cff0f13c6dd82`. No commits, pushes, merges,
reference changes, account switches or deployments were performed.

| Check | Result |
|---|---|
| `npm ci` | PASS, exit 0: 371 packages installed, zero reported vulnerabilities |
| `npm run check` | PASS, exit 0: typecheck, lint and build; one existing Vite large-chunk warning |
| `npm test` | PASS, exit 0: 74 tests in four files |
| `npm run test:e2e -- --project=chromium` | PASS: 253 tests, no failures |
| Final clean-install repeat with `--reporter=dot,html` | PASS, exit 0: 253 tests in 1.9 minutes; no retries or skipped tests |
| `git diff --check` | PASS, exit 0 |
| Content preservation | PASS: all 12 prompts and 12 answers retained after whitespace normalisation; seven retained reference-data exports unchanged |
| Markdown checks | PASS: required frontmatter, no em dashes and one trailing newline in each changed Markdown file |

Chromium builds and previews the production application under `/BSA/`.
Its 253 tests comprise 213 route tests, nine control tests, 14 assistance
tests, three gate-failure tests, one injected crash-recovery test, one fresh
offline-navigation test and 12 axe audits. Twenty-five current routes are
tested at 360, 768, 1024 and 1440 px in light and dark, producing 200 route
screenshots. Removed controls, panels, notes links and subtitle are asserted
absent. `/notes` and another unknown path retain working home recovery.
Browser-error checks, boundary logging and domain gates are not relaxed.

Additional passing checkpoint screenshots cover pharmacy before and after
the date correction, A/B replay, B pack, rejected empty override reason,
recorded decisions, July SUFFICIENT, D abstention, E no-agent and assistance
off. Full captures are generated in the test-results directory; selected
images are retained below. There are 236 original PNG captures, excluding
attachment copies. Desktop light and mobile dark Overview and the
removed notes route were visually inspected. This is not a full manual
accessibility assessment.

* [Before: existing hosted Overview at 1440 px](qa/remove-presenter-ui/before-hosted-overview.png)
* [After: local production Overview at 1440 px, light](qa/remove-presenter-ui/after-overview-1440-light.png)
* [After: local production Overview at 360 px, dark](qa/remove-presenter-ui/after-overview-360-dark.png)
* [After: removed notes route shows Page not found](qa/remove-presenter-ui/after-notes-not-found.png)

The before image came from the existing
[Azure demo](https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/) before removal.
It is not a same-build local baseline or evidence of a phase 1 deployment.

Initial validation failed with 30 TypeScript errors because editor deletion
reported success but left the three obsolete files on disk. After three
attempts, the user authorised terminal deletion of those files only. A separate
user-authorised trailing-whitespace trim fixed the EOF diff-check failure.
Both failures are resolved in the final results above.

The current build reports 716.58 kB JavaScript (222.16 kB gzip) and 121.95 kB
CSS (19.05 kB gzip), plus bundled fonts. The chunk remains above 500 kB;
zero-warning and Lighthouse performance targets are not met or claimed.
Hosted phase 1, Pages deep links, Linux CI, screen-reader operation and a full
manual keyboard/contrast assessment remain NOT VERIFIED. No deployment is
authorised. The counts in the next section describe the earlier merged
crash-fix baseline, not this phase's test run.

## Merged crash-fix baseline

Local Windows verification now includes 71 passing unit tests and 259 passing
Chromium browser tests. Typecheck, lint and build pass, with the existing Vite
large-chunk warning still present. See [qa-pr1.md](qa-pr1.md) for commands,
coverage and release limits. These are not hosted or Linux CI results.

* Gate FAIL now returns `NONE`, no alternative and no pharmacy draft. Rejected
	proposal reasons and trace content are replaced with withholding notices.
	Evidence and failed deterministic checks remain available. The pure gate is
	unchanged. The human default is Escalate with a mandatory reason; accepting
	or amending a nonexistent recommendation is disabled.
* Queue, case pack, trace, new human records and rule-version replay consume
	the sanitised result. The neutral "No recommendation" label no longer
	incorrectly says that the agent was not run after a gate failure.
* Eager route imports are restored. First visits to secondary routes after a
	fresh Overview load and disconnection pass without further network requests.
	This covers navigation within the loaded session, not an offline page reload.
* Existing stable case selectors, route-boundary recovery, assistance-off queue
	and pharmacy controls, and normal six-case outcomes pass regression tests.
	The old absence-of-unit-tests statement is no longer applicable.

## Remaining release and performance work

* Linux clean installation and CI execution, deployed Pages home and trace deep
	links, and phase 1 hosted access are NOT VERIFIED in this run. No deployment
	is authorised for this phase. The existing hosted Overview is a before
	screenshot source only, not evidence that phase 1 is deployed.
* Step 7 performance work is deferred. Route splitting is removed from PR1,
	not replaced with an idle preload. Any later splitting must retain the
	offline regression and define when route assets are available. The local
	baseline build reported 756.35 kB main JavaScript (234.10 kB gzip), plus CSS and fonts.
	The 500 kB Vite warning remains; zero-warning and first-load performance
	targets are not met or claimed. Lighthouse was not run.
* Automated route and overflow checks cover 360, 768, 1024 and 1440 px in
	light and dark. Twelve axe audits cover six surfaces at 1440 px. This does
	not complete manual visual, keyboard, screen-reader or WCAG-conformance
	assessment. Phase 1 captures after screenshots through the route tests;
	the before image is from the existing hosted Overview, not a deployment check.

## Remaining prototype rough edges

These are retained for later work, not expanded into phase 1 cleanup.

* Handwriting still relies on platform cursive fonts in
	[../src/components/demo/prescription-form.tsx](../src/components/demo/prescription-form.tsx).
	No handwriting font is bundled; the poor scan uses blur and rotation.
* Fixed accent colours remain. Targeted contrast fixes and the passing axe
	sample do not establish that every colour pair and interaction state meets
	contrast requirements.
* Pharmacy `interpret()` remains a keyword, date and initials regex mock.
	It can mistake ordinary text for initials and is not equivalent to the
	scripted case readings. The interface labels the interpretation as mocked.
* Trace steps reveal every 900 ms without pause or manual step-through.
	Recomputing the pack stops replay and shows all steps. Richer controls are
	deferred; current Replay, Show all and Clear controls are tested.
* Evaluation figures and assembly time remain illustrative synthetic values,
	not measured operational performance.
* The seeded record timestamp, received times and queue durations are fixed.
	The queue does not age. Six filler rows remain non-interactive and labelled
	"Filler row"; expanding them into cases is outside this fix.
* Favicon, Open Graph metadata and print styling remain follow-up work.
* The generic not-found screen offers a tested home link but no case shortcuts.

## Manual checks still needed

* Heading focus after recording a decision and navigating to its record
* Screen-reader announcement of toast messages and trace replay
* Sticky table-header behaviour during horizontal scrolling
* Form-label legibility in narrow case-pack columns
* Header wrapping and content visibility with the retained product controls

## Deliberately not built in the static application

Real capture integration; a live queue; a real model call; payment calculation
or approval; durable records and lineage; dispensing-system integration;
monitoring dashboards; calibrated confidence thresholds. The prototype uses
synthetic inputs and in-memory human records. Hosted infrastructure or identity
behaviour is not verified by these local tests.
