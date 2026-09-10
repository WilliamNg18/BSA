---
title: Task 1 synthetic baseline model
description: Seven-step gathering, fixed-reference judging, bounded referrals and shared scene construction.
ms.date: 2026-09-10
---

## Scope and authority

Task 1 changes scenario arithmetic and its calculator/scene presentation only.
All numeric scenario defaults live in [baseline.ts](../src/lib/domain/baseline.ts).
[baseline-defaults.ts](../src/lib/domain/baseline-defaults.ts) derives fixture
provenance only. The source registry is unchanged; no documentary references
or filenames are removed in this task. No agent makes an automatic decision.
The six cases, compliance gate, pricing boundary and existing history remain
unchanged. Existing uncommitted focus fixes are retained.

## Editable synthetic assumptions

| Input | Default | Meaning |
|---|---:|---|
| Volume V | 85,000 | Approximate referred-back subset scale proxy, not all exceptions |
| Find form minutes | 0.5 | Synthetic time per item |
| Read endorsement minutes | 0.75 | Synthetic time per item |
| Product and pack minutes | 0.5 | Synthetic time per item |
| Claim records minutes | 0.5 | Synthetic time per item |
| Tariff version and clause minutes | 1 | Synthetic time per item |
| Compare sources minutes | 0.75 | Synthetic time per item |
| Record reason minutes | 1 | Synthetic time per item |
| Built evidence review r | 1 | Synthetic minutes per built item, separate from judging |
| Judging j | 2 | Synthetic minutes per reference item, identical comparison cohort |
| Pharmacy share p | 2/12 | Fraction of incoming volume, derived synthetic seed proxy |
| Cleared share c | 2/10 | Fraction remaining after pharmacy catches |
| Abstain share a | 2/8 | Fraction remaining after catches and clearances |
| Deficient built share db | 25% | Invented scenario referral assumption, not fixture outcomes |
| Deficient abstained share da | 50% | Invented scenario referral assumption, not fixture outcomes |

Manual gathering g is the sum of all seven editable step durations, default
5 minutes. All minutes are labelled synthetic assumptions; the seven-step
breakdown is expandable. Recording the reason covers evidence preparation,
not an extra decision or approval.

The 85,000 default is pinned to registry O23, attributed by the supplied pack
to Community Pharmacy England, not externally verified. O24 says total
operator exceptions are unknown. N01 retains the distinction between
1,000,000 / 12 (approximately 83,333.33) and approximately 85,000.

## Sequential integer cohorts

With shares expressed as fractions:

* P = round(V * p)
* C = round((V - P) * c)
* A = round((V - P - C) * a)
* B = V - P - C - A

Each rounded cohort is removed before calculating the next share. Rounding
is nearest integer, halves up. Counts are disjoint, non-negative integers
and sum exactly to V, including V = 0. Defaults produce P = 14,167,
C = 14,167, A = 14,167 and B = 42,499.

Pharmacy-caught means assumed caught and corrected before submission, never
entering the NHSBSA queue. This is an avoidance count, not operator savings.
Rule-cleared means code establishes certainty without a person touching the
case, with existing pricing unchanged and no AI call. Abstained cases retain
reasons and the unchanged manual hand-off. Built cases retain gated evidence
and recommendations, with a human reviewing and deciding.

## Gathering and judging hours

* Today gathering hours = V * g / 60
* With agent gathering hours = (A * g + B * r) / 60
* Today judging hours = With agent judging hours = V * j / 60
* Reference operator hours = gathering hours + judging hours

Equal judging hours are a fixed reference-cohort comparison assumption,
even though the routing cohorts differ. This deliberately does not forecast
actual staffed workload or claim judgement savings from pharmacy avoidance.
Pharmacy effort is excluded. No causal net-time or measured savings claim is
made. Increasing review time above manual gathering can increase assisted
hours; no clamp manufactures a saving.

Defaults: Today gathering 425,000 minutes, judging 170,000 minutes, reference
total 9,916.7 displayed hours. With agent gathering 113,334 minutes, judging
170,000 minutes, reference total 4,722.2 displayed hours.

Assembly remains separate synthetic engine latency from active recommended
A/B/C packs, not operator labour. Built expected time before decision is
r + j + assemblySeconds / 60; abstained is g + j. Queue delay, parallelism,
pharmacy effort and extra failed-assembly latency remain unmodelled. Existing
3/3 citation provenance is not a scaled accuracy measure.

## Referral assumptions and Task 3 risk proxy

Today referrals = V is a scenario volume proxy for the referred-back subset,
not a claim that every real exception is referred back. Actual exceptions
remain unknown.

With agent referrals = round(B * db) + round(A * da). Each term is rounded
separately, bounded by its own cohort, and their sum cannot exceed A + B or V.
Defaults produce 10,625 built referrals + 7,084 abstained referrals = 17,709.
Deficiency shares are editable, not actual measurements or engine outcomes.

Task 3 replaces the misleading accuracy field with referralFreeProxyPercent.
Residual risk R = A + round(B * db): every abstained item plus deficient built
items. The deficient abstained subset is already inside A and is not added
again. This risk count is distinct from the unchanged assisted-referral formula.
Default R = 24,792; for V = 12, R = 4 while assumed referrals = 3.

For positive V and R, the proxy is (V - R) / V * 100. Otherwise it is null
and displays Not established: zero residual proves no accuracy. Display values
round down to one decimal, so positive residual never rounds to 100% (maximum
99.9% displayed). This is a disclosed precision policy, not an invented residual
or empirical accuracy cap. No observed endorsement correctness, measured
first-time accuracy, or pricing-target achievement is claimed.

## Validation, state and construction proof

All 15 editable fields retain raw strings in session memory. Volume is a
whole number 0-1,000,000,000. Each of nine minute inputs accepts 0-1,440;
each of five percentage inputs accepts 0-100. The derived assembly input
accepts 0-3,600 seconds. Decimal syntax and exact string bounds are checked
before Number conversion, so precision cannot hide out-of-range fractions.
Blank, negative, non-finite, exponent, hex, separator, malformed and overflow
inputs reject rather than clamp or retain stale results. Arithmetic checks
reject non-integer, non-finite, overflowing or non-conserving results.

[useBaselineScenario](../src/hooks/use-baseline-scenario.ts) memoises one
shared selector over the current draft. The calculator, chapter 1 and Task 3
pipeline consume it. There is no second scene formula or hard-coded estimate
table. Invalid drafts suppress estimates everywhere; edits and resets update
all surfaces. On/Off
changes visibility only; history, case states and inputs stay intact.

The accessible SVG flow uses count / V * 240 as ribbon thickness. Zero
counts have empty paths, not minimum-width ribbons. Four ordered DOM labels
and exact counts accompany the SVG title/description, with a responsive
viewBox and no colour-only meaning. The generated summary stays below 25
words. The wider Task 2 copy cap is not claimed complete.

Unit tests cover all seven independent step contributions, editable review,
equal judging, referrals, conservation, bounded accuracy proxy, all field
validation and store isolation. Browser tests exercise live edits on both
surfaces, invalidation, reset, source privacy, responsive flows, zero paths,
disclosures and retained focus tests. Full local results belong in
[the task evidence](../../.copilot-tracking/tasks/1/verification.json).

## Deployment gate

Azure, rather than private GitHub Pages, is the user-approved hosting target
following Pages HTTP 422. Local production Chromium tests use `/BSA/` to
retain sub-path compatibility. No deployment, Git action or account action
is performed; hosted validation and CI are pending independently of local
task validation. Tasks 2-7 are not implemented here.