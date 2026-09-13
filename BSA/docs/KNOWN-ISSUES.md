---
title: Current limitations and verification boundaries
description: Process-model limitations and verification boundaries, separated from historical acceptance.
ms.date: 2026-09-13
---

## Current implementation and acceptance

Tasks 19-24 replace the referral-only calculator and virtual queue with a shared
whole-process model, actual staff work and explicit Type 1 capture. Complete
EPS resubmissions route automatically; there is no second human approval.
Generated drafts are optional: an explicit human reason and RB code can record
a referral without draft approval. Turning Agent On never supplies that approval.

The coherent **32-test exact-state matrix passed** on clean `53dac19`, including
completed-Type-1-only Off/On cases. The new actual Off UI flow exposed a real
model defect: ordinary manual capture incorrectly required declaration
reconciliation. M repaired factual compatibility without relaxing D's poor-source
or proposed-declaration boundaries; N repaired the completed card's awaiting label.
The original failure and subsequent source-pinned evidence are retained.

After all functional streams merged, **20/20 hosted checks passed** against
clean `1327e65fffeafebf43df1b1b566c6e4152452b46`, with 40 matching identities,
41 images and 24 unrestricted axe audits (zero violations). This is distinct
from the earlier local rehearsals. The [Task 24 evidence](screens/task24/README.md)
records exact sources and incomplete-audit caveats. Visual/novice review and
the final merged-V-main coordinator recheck are separate gates.
See the [live checklist](../tests/live/README.md).

Tasks 14-18's historical live review at clean `c0203fc` is recorded separately in
[FIRST-TIME-VIEWER](FIRST-TIME-VIEWER.md): nine observed clarity points,
18 reviewed views / unrestricted axe audits with zero violations, and an
explicit human-controlled round trip and catch-counter walk. Earlier evidence
below remains historical. Final tracking and release acceptance belong to the
coordinator; this scoped review does not claim human comprehension testing.

The eight-chapter/nine-stop tour and shared pharmacy/NHSBSA lifecycle remain.
The current queue has actual Type 2 items, a separate Type 1 capture lane and
an automatic-pricing projection; the former virtual-month Compare is not the
current interface. Pharmacy On shows only labelled operator-approved drafts;
intentional Off is a healthy unchecked manual path.

Historical accepted source `82c18e49e7d1c765e5392b1bec5c028c8f89fd16` includes the route-entry
contrast repair from #42 and restored blocking pharmacy coverage from #40.
Exact tested head `f295d7f19363cd101af7401f0ba03188ee7d0b2b` passed
[Actions run 34696637977](https://github.com/WilliamNg18/BSA/actions/runs/34696637977):
check, 607 units and **1,054 browser tests, all blocking**, in 15.1 minutes.
There are zero quarantined cases, not three additional informational passes.
No deduplicated CI audit count is inferred from a browser-test total.

The later pre-redesign
[CI 34705318318](https://github.com/WilliamNg18/BSA/actions/runs/34705318318)
at `8bee3f205d29178177a6fb1ef5e98394c7655d2c` passed check, 695 unique
units and 1,055 blocking browsers across four shards in 6m25s, with zero
quarantine. Shard repetitions do not multiply unique unit counts. This is
distinct from V's six-state baseline observation and the older screenshot audits.

The agent gathers evidence and recommends; deterministic code validates and
calculates; a human decides. Nothing in this demonstration calculates or
approves a payment. `Paid on the normal schedule (synthetic)` is a lifecycle label
attributed to existing pricing, not proof of a payment service.

## Hosted baseline accepted; new interface acceptance remains separate

Issue #48 supersedes the earlier SWA target with the existing App Service F1
at https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/.
The [source-pinned live record](live-verification/README.md) establishes
13/13 checks and 26 matching clean identities at
`b813c6241cc084957a30c6bf48fdd65f623f33f6`, including strict headers and
deep links. Six actual axe audits had zero violations; a separate same-history
mixed-mode round trip also passed. The earlier HTTP 200 without CSP was repaired,
not an outstanding hosting blocker. Main/manual OIDC and bounded non-destructive
recovery are recorded in [INFRA-DONE](INFRA-DONE.md); infrastructure is frozen.

A fresh V baseline reading on `2026-09-12T19:21:33Z` to `19:22:15Z` observed
clean Step 0 `6b0632823514b923b54d3ae9f873fabfa9715851` on the live site.
That six-state chapter reading predates the redesign and is not a repeat of
the older hosted checklist. Tasks 14-18 now have a distinct merged-source
live review in [FIRST-TIME-VIEWER](FIRST-TIME-VIEWER.md), not a relabelled baseline.
See [DEPLOYMENT.md](DEPLOYMENT.md). No publish profile, SWA token, new resource
or owner setup is needed. F1 has no deployment slots; PR artifacts are not previews.

The account transfer was cancelled on 12 September 2026. WilliamNg18 remains
owner; repository and approved reference material are public by explicit
decision. Private-repository replacement jobs previously refused before tests
because of account payment/spending restrictions are historical external
failures. The subsequent public Actions run above actually passed. Neither
public visibility nor that CI pass proves an Azure deployment.

## Deliberate demonstration limits

| Area | Current limitation |
| --- | --- |
| Interpretation | Scripted case readings and deterministic typed-field mock, not live inference or handwriting capture |
| Evidence | Synthetic cases, rule paraphrases and enterprise tool responses, not authentic clinical or tariff evidence |
| History | Immutable attempts and append-only events within a session, not durable audit storage; reload/Reset restores seeds |
| Offline | Loaded-session navigation works; a cold offline load or reload is not guaranteed |
| Queue | Work rows/counts are actual synthetic session items; monthly automatic-pricing and effort figures are separate projections, not live operational totals |
| Today | Model examples show manual tasks without invented retrieved citations or agent results |
| Outcomes | C's 56/84 conflict survives confirmation; D withholds advice until human capture, with no payment guarantee |
| Paper capture | Proposed pre-fill is a pharmacy declaration, not image reading; reconciliation is explicit, edits clear it and new paper revisions require fresh capture |
| Timing/benefits | Type 2 average, referral investigation and pharmacy completion measure different work; lanes can overlap and their hours must not be added |
| Referral estimates | Pharmacy catches and remaining referrals use editable assumptions, not measured accuracy or guaranteed avoidance |
| Confidence | Five structural signals and synthetic thresholds, not a calibrated probability |
| Public context | Attributed figures are not independently verified; referrals are a subset; publication frequency is not change frequency |
| Fonts | Synthetic handwriting uses platform cursive fallbacks and may differ across operating systems |
| Cycle guide | Five explanatory stages are not recorded history; opening the guide or changing assistance completes no stage |

No live retrieval/model, capture or dispensing-system integration, monitoring,
durable record service or payment calculation is included. A shared operational
service remains a proposal even though the local cross-side workflow works.

## Historical verification caveats

The Tasks 14-18 1440px light/reduced-motion matrix has 13 incomplete axe reports
(11 color-contrast, 8 aria-prohibited-attr, overlapping), preserved for manual
review despite zero violations. Natural Agent focus tooltips remain in On
images. The first live walk's All-tile selector timeout is retained as harness
failure; the corrected full walk passed. No app defect is inferred from it.
Both perspective puts chapter 7's first table rows below the 1000px fold,
although its action tiles are visible; Pharmacy view exposes them sooner.
The then-current 26-word queue guides exceeded the copy aspiration by one word
and were retained, not a blocking budget. No concrete app defect
was reproduced in that scoped review; mobile/dark and full manual conformance
are not claimed by these screenshots.

[#34](https://github.com/WilliamNg18/BSA/issues/34) is closed. A controlled
nine-case repetition passed before the three conditional tags were removed;
all restored cases then passed in final all-blocking acceptance. Original
timeouts and their unproven environmental cause remain historical evidence,
not a reason to remove assertions or reinstate blanket quarantine.
[#35](https://github.com/WilliamNg18/BSA/issues/35) is closed as not reproduced
in final blocking acceptance. Trace review found axe evaluation failed during
context teardown after an earlier navigation timeout, not a demonstrated slow
axe computation. The environmental cause remains unproven and the original
trace is retained; reopen on a concrete recurrence rather than weaken coverage.

[#41](https://github.com/WilliamNg18/BSA/issues/41) is closed after a genuine
normal-motion contrast defect was fixed. The route wrapper's 150ms opacity
fade reduced contrast while text appeared. Removing only that fade retains
the slide, timing, focus and reduced-motion behaviour. The new held-frame
regression verifies 0/75/135/150ms states; scoped acceptance recorded 32 cases,
40 unrestricted axe audits and zero violations before full CI acceptance.
Settled screenshots did not prove the old intermediate frames safe.

The [original integrated visual index](screens/integrated/README.md) and
[manifest](screens/integrated/manifest.json) identify actual source revisions,
per-image hashes, errors, overflow and axe results. Header-enforced local
Chromium evidence is not full manual WCAG 2.2 AA conformance, screen-reader
verification, Firefox/WebKit coverage or deployed Azure routing/caching parity.
Its 1440px light matrix does not claim independent mobile/dark coverage.
V's original completed matrix has 107 images and individual audit JSONs, 53 Off / 54 On,
with zero violations, overflow and page/console/CSP errors. Fifty-one audits
retain incomplete-rule results; these are not a full manual accessibility
assessment. All images were reviewed at full height through slices. That
manifest and build report remain pinned to `898cda5`; they are not relabelled
as captures of the opacity repair. The
[scoped route comparison](screens/route-opacity-parity/README.md) records
64/64 byte-identical reproductions and new build hashes, with 64 separate
zero-violation axe reports and no browser/CSP errors or overflow. Thirty-nine
new audits retain incomplete color-contrast checks. The other 43
stateful images retain their original provenance without a fresh-audit claim.

Only functional/accessibility checks block. There are no size/performance
budgets; independent-resource gzip, word counts, Lighthouse and visual
differences are informational. A two-minute story target is not a blocking
wall-clock cap, and informational status never excuses a functional defect.

## Historical evidence remains historical

The initial V captures at `d9e06e1` had 103 images and a seven-chapter layout.
They remain in the immutable
[V checkpoint](https://github.com/WilliamNg18/BSA/tree/b3acc1392dfc5074a943a184e026a4fb856341fc/BSA/docs/screens/integrated),
not mixed into the new-source manifest. Initial check passed; default Vitest
had 559 passes/one 5,000 ms CLI timeout and the bounded rerun passed 560 tests.

The earlier assembled Linux run `34687220652` had 1,016 passes/three stale
chapter failures; those expectations were corrected before the accepted run.
The transfer interrupted the local fallback; it did not pass. Earlier
scoped S/T/helper/Scene/Queue reports retain their initial failures and narrow
rechecks in [PROGRESS.md](PROGRESS.md), [LEARNINGS.md](LEARNINGS.md) and
[HANDOVER.md](HANDOVER.md). Task 7's 503 units, 721 browsers, 334 axe reports,
91/91/90 Lighthouse scores and 199,651 gzip bytes are not current measurements.

[SCOPE.md](SCOPE.md) preserves the 18 accepted original rows and Tasks 14-18.
It is not proof of Tasks 19-24 acceptance. Final task ticks belong to the coordinator's
[PROGRESS.md](PROGRESS.md), not to a screenshot or an old implementation checklist.
