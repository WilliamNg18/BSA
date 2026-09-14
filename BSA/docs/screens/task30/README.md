# Task 30 evidence

**Repaired hosted functional acceptance passed; new visual review is pending.**

The coordinator-approved repaired runtime is
`34d7567917a4c2fcdb447e2a9a0239d2c8cebe0e`. The complete hosted inventory passed
30/30 without retries from `2026-09-13T22:46:41.922Z` to
`2026-09-13T22:52:52.227Z`, with 60 clean matching identities, 58 original
images (25 Off, 33 On) and 26 zero-violation axe audits. Eighteen audits retain
incomplete findings. See the [immutable manifest](34d7567/manifest.json).
The export was committed at `f64095a58cb38a8f9d0b4a9719c29cc63143bdd2`
before the same independent reviewer's new full-height assessment began.

After the overnight pause, that reviewer runtime was unavailable. Its
[unchanged recovered ledger](review-34d7567-interrupted/README.md) marks
120/202 tiles inspected, covering 40/58 images, but every final verdict remains
NOT VERIFIED. The remaining 18 images have 82 uninspected tiles. No final
report was recovered; no restart or replacement was performed. Visual
acceptance is blocked pending the coordinator's explicit recovery decision.

The user subsequently authorised one bounded recovery reviewer,
`17e49f6d-93ba-404d-b112-4dc52a232671`. Its
[preserved recovery report](review-34d7567-recovery/review-result.md) is also
blocked: the image tool reported a maximum-one-image viewing limit. It retains
one accepted new tile, 120 inherited markers, no accepted reinspections and
all 58 final verdicts NOT VERIFIED. Provisional observations were withdrawn,
not promoted to defects or passes. No further image attempts or quota
workarounds are authorised. Supported image capacity or independent human
review is required before final visual acceptance can proceed.

**Technical clarification:** the same reviewer subsequently could not
distinguish original delivery refusal from historical-image omission in the
retained transcript. A hard session-wide quota is therefore not established;
see the [separate addendum](review-34d7567-recovery/delivery-clarification.md).
The original report remains unchanged. All verdicts are still NOT VERIFIED,
and the coordinator's stop on further image attempts remains in force.

[Direct keyboard and contrast observations](manual-34d7567/README.md) record
actual mobile focus, error recovery and declaration guards on this source.
They are bounded observations, not full WCAG certification. Final release
acceptance still requires the new all-image verdict, documentation-only
follow-up CI and the coordinator's latest-main repeat.

## Preserved initial visual failure

The immutable `b05b06a` bundle contains all 30 passing hosted checks, 60 identities,
58 images and 26 zero-violation axe audits. `review-b05b06a` preserves the complete
independent 58-image review, its 24/34 image PASS/FAIL verdicts and separate F02
correction. `manual-b05b06a` preserves actual keyboard/contrast observations and
limitations. None of these failures is relabelled as final acceptance.

The bounded runtime/capture repair merged as #87 after all four exact CI
checks passed on `a6f8e49038be34f1610f5fb0181fef21bfacb200`
(run `34787130520`): 1,134 unique units in 60 files, 1,202 ordinary browser
tests and 34 separate instrumented tests. Its coherent final local 30-check
run also passed before coordinator merge and deployment. Historical Task 24
evidence and every original b05 artifact remain unchanged.

## Local rehearsal, not release acceptance

The complete named 29-check local rehearsal passed on clean application source
`145d4ca636ab7e0ef536c89ae2c8004ece2c19b7`, with 58 before/after identity checks,
56 local full-page images and 26 unrestricted axe audits with zero violations.
The report identifies itself as **local rehearsal, not hosted acceptance**.
The export tool rejects loopback reports for hosted publication.

That rehearsal predates later owner-approved correction and concise-copy
changes. Its images have **not** received final full-height novice/functional
review. Zero axe violations are not WCAG 2.2 AA certification or a manual
keyboard, screen-reader or contrast assessment.

The original local runs remain separately named in session artifacts:
`task30-local-selected-01` (server binding failed before tests),
`task30-local-selected-02` (empty selection),
`task30-local-selected-03` (8/9 passing, missing All-filter action),
`task30-local-full-01` (25/29 passing),
`task30-local-full-02` (27/29 passing, including the correctly rejected dirty
capture), and `task30-local-full-03` (29/29 passing).
These are local execution records, not portable hosted evidence.

## Final evidence requirements

V's functional pull request supplies the six-chapter runtime and merges last
after the other functional streams. Its four exact CI checks and complete
local rehearsal precede normal main deployment. The final hosted run then
targets that actual deployed runtime, never the earlier eight-chapter site.

The final named inventory has expanded to **30 checks**, including generic
supplier-field referral correction and human re-check. The earlier 29-check
local rehearsal is historical, not completion of this expanded inventory.

Use a fresh source-named subdirectory for every hosted run. Export the complete
inventory, exact clean application source, runner source, timestamps, URLs,
before/after identities, original symptoms and image hashes without modifying
the original report. Failed runs, interrupted runs and retries stay separate.

Every new image must be reviewed at its full height for both novice clarity
and functional truth. A review records the specific image hash, source, all
observed regions, findings and verdict. Capture-time `visualReview: pending`
remains immutable; a separate review supplies the actual later result.

Preserve the hosted export, actual review and final tracking in a separate
documentation/evidence-only follow-up, without application or configuration
changes. Do not mark final acceptance until the complete hosted inventory
passes on the approved source, every image is reviewed, the follow-up's four
exact CI checks pass and the coordinator completes the latest-main repeat with
a URL check within ten minutes.
