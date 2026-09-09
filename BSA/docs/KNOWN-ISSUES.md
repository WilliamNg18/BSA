---
title: Known issues and remaining verification
description: Phase 1 presentation UI removal, retained crash fixes, verification limits and deferred prototype work.
ms.date: 2026-09-09
---

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
