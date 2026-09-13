# Tasks 19-24 integrated live evidence

The [manifest](1327e65/manifest.json) and unchanged
[original checklist](1327e65/original-checklist.json) record **20/20 hosted
checks passing** on application
`1327e65fffeafebf43df1b1b566c6e4152452b46`, built
`2026-09-13T14:39:38.468Z`, clean. The run began
`2026-09-13T14:44:43.503Z` and ended `2026-09-13T14:48:58.696Z`.
The coordinator explicitly opened the all-functional-streams-merged deployment
gate before this run.

Capture/test source was `510d767b938241d5fee7d40ade9607461113728f`.
It contains the application revision as an ancestor and has identical runtime
source/configuration. Its identity is deliberately distinct from the deployed
application. Later documentation/export commits do not relabel either identity.
All **40 before/after build identities** matched the expected clean deployment.

There are **41 full-page PNGs: 18 Off / 23 On**, with hashes rechecked after
export. **24 unrestricted axe audits: 10 Off / 14 On** reported **zero violations**.
Nineteen audits retain incomplete results: 16 color-contrast and five
aria-prohibited-attr occurrences, overlapping. These remain manual-review
candidates. All browser error guards and root-overflow checks passed.
The manifest initially records `visualReview: pending`; an actual subsequent
review is recorded separately, not backdated into the capture.

Chromium, 1440 x 1000, reduced motion, full-page screenshots. The exact browser
version, per-view URL, perspective, Agent mode, visible text and accessibility
snapshot are in each view entry. Forty images use Both and one uses Pharmacy;
this is not an all-three-perspectives static matrix. The separate header checks
visit all three perspectives and the 32-case state proof exercises side changes.
This is not mobile/dark/cross-browser or full
manual accessibility certification. Repeated captures are counted as actual
images, not unique user scenarios or additional axe audits.

## Captured story

The manifest links every image and original JSON attachment with repository-
relative paths. These directories group the actual executed story, not staged
screens with invented outcomes.

| Story | Evidence |
| --- | --- |
| Most items need no person; source/assumption boundary | [Overview Off](1327e65/check-01/04-audit-overview-off.png), [On](1327e65/check-02/05-audit-overview-on.png) |
| Shared edited model, both columns | [Off](1327e65/check-03/04-audit-edited-process-model-off.png), [On](1327e65/check-03/07-audit-edited-process-model-on.png) |
| A/B/C/D current routes | [Four cases](1327e65/check-04/04-audit-canonical-case-cards-on.png) |
| EPS/Paper pharmacy examples | [All six scenario/mode views](1327e65/check-05) |
| Actual staff work versus modelled aggregate | [On](1327e65/check-07/04-audit-actual-worklist-on.png), [Off](1327e65/check-07/07-audit-actual-worklist-off.png) |
| B human referral and corrected EPS paid history | [Off/On record and history](1327e65/check-08) |
| D abstention, explicit capture, RB2B and fresh paper capture | [Off/On original and new capture](1327e65/check-09) |
| E deterministic-only trace | [No agent call](1327e65/check-10/04-audit-deterministic-e-trace-on.png) |
| B recorded evidence replay | [July](1327e65/check-11/03-b-july-replay.png), [August](1327e65/check-11/05-b-august-replay.png) |
| C confirmation leaves 56/84 for human review | [Off](1327e65/check-14/03-c-confirmation-still-conflicted-off.png), [On](1327e65/check-14/05-c-confirmation-still-conflicted-on.png) |
| F original human record | [DR-000871 retained](1327e65/check-15/05-audit-historical-f-record-on.png) |
| Completed Type 1 only, no Type 2 decision | [Off/On queue and case cards](1327e65/check-16) |
| Same-item perspective round trip | [Final shared view](1327e65/check-20/08-audit-perspective-round-trip-on.png) |

## Failure and rehearsal provenance

[Original manual-Type-1 failure](failed-manual-type1-bc557c9.zip) preserves the
local report, trace, screenshot, context and build identities at clean
`bc557c9`. Complete manually keyed B incorrectly entered Type 2 because
factual capture compatibility required declaration reconciliation. This was
a **real model defect**, not a test timeout to dismiss. M's `94e8509` separated
ordinary manual agreement from proposed declaration trust; the exact UI
payload and completed-Type-1 expectation were not weakened. N's `655791e`
separately fixed the completed card's false awaiting-capture label.

The repaired paired-mode local live check passed at `53dac19`; the coherent
32-case instrumented state matrix passed there in 6.7 minutes. Original attempts,
timestamps, IDs, approvals, capture, other cases and history remained in every
comparison. The ordinary artifact stayed unchanged and observer-free. That
matrix's external evidence remains `TEMP/bsa-v-32-53dac19`, not hosted evidence.

Full 20-check local rehearsal then passed at `4f355de` in 3.9 minutes, with
runtime source identical to final N after the shared pharmacy formatter hunk.
The hosted run above is separate and is the actual deployment proof.
Earlier failed harness selections/history-expansion attempts remain in their
original session artifacts and are not counted as passes.

## Reproduction and durable export

Follow [the live instructions](../../../tests/live/README.md), only after
coordinator authorisation, using the exact deployed SHA and a new external
output directory. The committed configuration requires HTTPS and checks clean
build identity before and after each check. No state observer is used live.

After the run, export without modifying its original evidence:

```powershell
Set-Location BSA
node tests\live\export-evidence.mjs <external-checklist.json> <new-evidence-directory>
```

The exporter rejects partial/local/retried/unpinned evidence, invalid image
hashes and an existing export directory. Its copied original report intentionally
retains the original machine artifact paths; the manifest provides portable
relative paths. A capture/audit manifest is not human comprehension evidence.
Final merged-V-main deployment verification remains a separate coordinator gate.
