# Tasks 19-24 integrated live evidence

## Repaired hosted run at d5832e0

The [new manifest](d5832e0/manifest.json) and unchanged
[new original checklist](d5832e0/original-checklist.json) record a separate
**20/20 hosted PASS**, with one attempt per check, after the coordinator opened
the repaired deployment gate. Application:
`d5832e0faa44c32242cb75f2970288d4499befae`, built
`2026-09-13T15:31:01.43Z`, clean. Capture/test source:
`59bdf65be2601a174f197ddb43f87c507f649451`, with application ancestry and
identical runtime/configuration. Execution:
`2026-09-13T15:33:04.170Z` to `2026-09-13T15:37:41.131Z` (4.6 minutes).

All **40 clean build identities** matched. All **198 artifact hashes** verified.
There are **43 PNGs: 19 Off / 24 On**, comprising 41 enriched view entries
(18 Off / 23 On) and two supplemental perspective-helper images. The manifest's
`counts.images` counts enriched views, not the two supplemental PNGs.
The enriched views are 40 Both / one Pharmacy, and the two supplemental views
also use Pharmacy: this is not an all-three-perspectives static matrix.

All **24 unrestricted axe audits (10 Off / 14 On) reported zero violations**.
Sixteen audits retain 121 color-contrast node occurrences for manual review.
The former five `aria-prohibited-attr` incompletes are absent after the Claim
filters group repair. No browser-error or root-overflow guard failed.
This is not full manual WCAG or screen-reader certification.

The repaired positive contracts cover [Claim filters](d5832e0/check-06),
[D's initial and fresh capture](d5832e0/check-09), and
[E's deterministic closing](d5832e0/check-10/04-audit-deterministic-e-trace-on.png).
Independent actual full-height review of this complete new 43-image set is
**pending**; functional PASS alone does not clear the original novice findings.
The [review record](../../FIRST-TIME-VIEWER.md) separates the two sources.
The original source and failed review below remain unchanged evidence.

## Original hosted run at 1327e65: functional PASS, novice-content FAIL

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

There are **43 full-page PNGs: 19 Off / 24 On**. Forty-one enriched view entries
(18 Off / 23 On) have per-view hashes, text and accessibility snapshots; this
is the manifest's `counts.images` value. Two additional images from the existing
perspective helper retain per-check build identity and artifact hashes:
[Off](1327e65/check-20/04-perspective-decision-off.png) and
[On](1327e65/check-20/06-perspective-decision-on.png).
All 198 exported artifact hashes were checked.
**24 unrestricted axe audits: 10 Off / 14 On** reported **zero violations**.
Nineteen audits retain incomplete results: 16 color-contrast and five
aria-prohibited-attr occurrences, overlapping. These remain manual-review
candidates. All browser error guards and root-overflow checks passed.
The manifest initially records `visualReview: pending`; an actual subsequent
review is recorded separately, not backdated into the capture.
The [subsequent independent review](../../FIRST-TIME-VIEWER.md)
inspected **43/43 full-height PNGs** and returned **novice-content FAIL**:
D asserts source agreement before readable/confirmed evidence, and E's
closing invents an unnecessary human handoff. Functional PASS is unchanged;
this capture set is not clean final novice acceptance.

Chromium, 1440 x 1000, reduced motion, full-page screenshots. The exact browser
version, per-view URL, perspective, Agent mode, visible text and accessibility
snapshot are in each enriched view entry. Of those 41 entries, forty use Both
and one uses Pharmacy; the two supplemental decisions also use Pharmacy.
This is not an all-three-perspectives static matrix. The separate header checks
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
