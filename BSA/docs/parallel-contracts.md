---
title: Frozen contracts and parallel stream ownership
description: Step zero contracts, method signatures and integration boundaries.
ms.date: 2026-09-10
---

## Contract surface

[Lifecycle types](../src/lib/domain/lifecycle.ts) define LifecycleState, Actor,
HistoryEvent, CaseLifecycle, PharmacyPrecheckSnapshot, LifecycleSlice and the
exact LIFECYCLE_LABELS supplied by the user. Pharmacy labels never vary by toggle;
only NHSBSA in_review varies. Types and labels only, no transition implementation.

[The store](../src/lib/store.ts) exposes lifecycles (empty record) and
followedCaseId (null). Each new method currently throws `not implemented`:

* submitFromPharmacy(caseId: string, endorsementText: string,
  precheck?: PharmacyPrecheckSnapshot): void
* arriveInQueue(caseId: string): void
* recordOperatorDecision(caseId: string, decision: HumanDecision, reason: string,
  draft?: string): void
* resubmitFromPharmacy(caseId: string, endorsementText: string,
  precheck?: PharmacyPrecheckSnapshot): void
* sendConfirmation(caseId: string, text: string): void
* followCase(caseId: string | null): void

Precheck snapshots carry typed text, dispensing date, nullable facts/version/clause,
nullable checkedAt, status, mode and readonly requirement checks. No automatic
check or payment authority follows from their presence. Stream B validates input,
copies snapshots and appends history; callers never mutate store records.
The claims route renders only its heading until Stream C implements it.

## Stream ownership

| Stream | Branch | Tasks | Owned files |
| --- | --- | --- | --- |
| A | stream-a-core | 4-7, one scoped increment at a time | Pharmacy check, queue, three case pages; supporting pharmacy domain/components/store; their existing and new tests |
| B | stream-b-store | 8 | Lifecycle slice in store, seeding module, store unit tests |
| C | stream-c-claims | 9 | Pharmacy claims page, detail/action components, their tests |
| D | stream-d-nav | 11-12 | Header, navigation, rail content, Follow banner shell, case header, their tests |
| E | stream-e-verify | 10, 13 | New round-trip tests, integration verification, screenshots, final MEMORY corrections |

Every stream updates its own progress and appends its learnings/decisions.
Stream E resolves progress conflicts and ticks 10/13. No stream edits another's
files; propose contract changes on the tracking issue and await an approved
contract commit. Stream A does not edit the frozen store, claims or navigation.
Task 4 uses its own pharmacy memory store; no queue connection before Task 8.

## Integration

Create all branches from the contracts commit. Merge B first, then A/C/D, then E.
Rebase before PR creation. PRs are permitted for this parallel phase. No merge
with failing check, units or owned browser tests. Only new Stream E round-trip
tests may be pending-integration; E must unskip them and run the full suite.
The agent never changes a lifecycle state; paid is synthetic existing pricing.
On pharmacy reasons must be operator-approved drafts with that label. Keep all
six canonical outcomes, gate predicates, archives and rollback references intact.

## Task 4 acceptance boundary

Off is typed manual submission without performed prechecks, explicitly a scenario
assumption, not proof of absent real checks. After submission, an illustrative
day counter shows submitted, month end, exception, refer back, correction and
payment-cycle stages. A has no fake referral; corrected B avoids referral; D stays
manual with no guaranteed payment. Durations are editable assumptions in baseline.
On shows a revision-safe two-second scripted check, facts, dispensing-date version,
clause, requirement checks and an exact gap. Apply adds B's dispensing date only
by user action. D stops at capture; subsequent steps are NOT RUN. Continue is always
enabled. Receipts are immutable in-memory snapshots; no queue integration yet.
Keyboard Step/Pause/Jump controls and reduced motion are required. Verify all
A/B/D and On/Off combinations, immutable receipts, debounce cancellation, word
limits, axe with all default rules and screenshots under docs/screens/task4.