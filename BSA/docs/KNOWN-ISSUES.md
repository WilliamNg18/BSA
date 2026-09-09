---
title: Known issues and remaining verification
description: PR1 review fixes, local verification limits and deferred prototype work.
ms.date: 2026-09-09
---

## PR1 review fix status

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
	links, and fresh unauthenticated hosted access are NOT VERIFIED in this run.
	No redesign is authorised until deployed tests pass.
* Step 7 performance work is deferred. Route splitting is removed from PR1,
	not replaced with an idle preload. Any later splitting must retain the
	offline regression and define when route assets are available. The local
	build reports 756.35 kB main JavaScript (234.10 kB gzip), plus CSS and fonts.
	The 500 kB Vite warning remains; zero-warning and first-load performance
	targets are not met or claimed. Lighthouse was not run.
* Automated route and overflow checks cover 360, 768, 1024 and 1440 px in
	light and dark. Twelve axe audits cover six surfaces at 1440 px. This does
	not complete manual visual, keyboard, screen-reader or WCAG-conformance
	assessment, nor a before-and-after screenshot set.

## Remaining prototype rough edges

These are retained for later work, not expanded into PR1 redesign.

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
* Presenter-bar overlap on short viewports still needs manual review; this run
	verifies beat navigation, not every overlap condition.

## Manual checks still needed

* Heading focus after recording a decision and navigating to its record
* Screen-reader announcement of toast messages and trace replay
* Sticky table-header behaviour during horizontal scrolling
* Form-label legibility in narrow case-pack columns
* Header wrapping and content visibility with presenter controls open

Discussion prompts already distinguish pack, trace and record routes; the
previous prefix-only issue is removed from the outstanding list. The existing
browser regression verifies the relevant prompts on each case view.

## Deliberately not built in the static application

Real capture integration; a live queue; a real model call; payment calculation
or approval; durable records and lineage; dispensing-system integration;
monitoring dashboards; calibrated confidence thresholds. The prototype uses
synthetic inputs and in-memory human records. Hosted infrastructure or identity
behaviour is not verified by these local tests.
