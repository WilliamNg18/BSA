---
title: Architecture and product decisions
description: Append-only decisions with reasons and rejected alternatives.
ms.date: 2026-09-10
---

## 2026-09-10: Meet today first

Default and Reset are Agent Off so the audience meets the manual scenario first.
Reject default On: it hides the baseline and implies an already-deployed service.

## 2026-09-10: Constant judging and item-based pharmacy catch

Hold judging constant across calculator columns to isolate evidence gathering.
Count pharmacy catches as items that never reach the queue, not saved minutes.
Reject inferred judgement savings and pharmacy handling-time claims without data.

## 2026-09-10: Payment and lifecycle authority

Paid is a synthetic state attributed to existing pricing; no money is calculated
or approved here. The agent never changes a lifecycle state. Reject automatic
state transitions from recommendations; operator actions remain authoritative.

## 2026-09-10: Attribution and concise copy

Use one Sources line and no documentary filenames in the interface. Keep the
full documentary register offline. Reject repeated citations and paragraph-heavy
panels; preserve synthetic operational rule references and meaningful evidence.

## 2026-09-10: Parallel contract freeze

Freeze lifecycle types, exact user-provided labels, typed method signatures and
one heading-only claims route before parallel implementation. Methods throw
not implemented, rather than silently succeeding. No lifecycle behaviour or
Task 8 completion is implied. Preserve the existing Exception queue navigation
label to avoid an unrelated rename during the freeze. Methods return void;
operator decisions reuse HumanDecision and drafts are operator-approved strings.
History timestamps are ISO 8601 strings, validated by Stream B, not branded types.

## 2026-09-10: Pharmacy receipt isolation

Task 4 will use a separate in-memory pharmacy store and the frozen precheck
snapshot type. Stream A must not edit Stream B's lifecycle store. Stream B can
later consume the same snapshot via submit/resubmit. Reject queue integration
and throwing lifecycle calls during Task 4. Receipt facts, checks and timestamps
must be immutable; Off records no performed checks.

## 2026-09-10: Ownership and pending integration

Stream A owns existing page tests and new pharmacy tests; Stream E owns new
round-trip tests only. This resolves the plan's overlapping generic test ownership.
Only new cross-stream tests may be tagged pending-integration and temporarily
skipped before integration. Never weaken or skip existing regression tests.
Tasks 5-7 lack a current detailed brief in the repository; Task 4 remains the
only implemented Stream A increment until their exact requirements are available.
## 2026-09-10: Task 9 claims are local, fixture-only

Pharmacy claims view built entirely on synthetic, page-local fixtures typed
against the frozen `lifecycle.ts` contract; no lifecycle store method is
called, since Stream B's methods still throw not implemented. Pharmacy actions
(confirm, resubmit) record a local, session-only note rather than a lifecycle
transition. Reject any local reimplementation of state transitions ahead of
Task 8; only the shared store may later change a lifecycle state. Reason
wording follows the toggle: On shows only the operator-approved draft, labelled
as such; Off shows the manual operator context instead.
