---
title: Final integration and protected branch record
description: Accepted application revisions, documentation delivery and immutable rollback/checkpoint references.
ms.date: 2026-09-13
---

# Current integration

The Tasks 19-24 functional streams merged serially M #76, U #74, P #78,
Q #75 and N #77. Their integrated functional main is
`1327e65fffeafebf43df1b1b566c6e4152452b46`, deployed by 34763282060.
Final functional CI at `f7d9039` passed 923 unique unit tests,
1,186 ordinary blocking browsers and 21 instrumented state-equivalence cases.
Independent visual review then required repair #80, merged as
`d5832e0faa44c32242cb75f2970288d4499befae` and deployed by 34765809076.
Its exact-head CI passed 943 units, 1,186 ordinary browsers and 21 instrumented
cases. The first 1327e65 visual failure remains recorded. Repaired `d5832e0`
passed all 20 hosted checks and independent review of 43 images, with zero
violations in 24 axe audits; incomplete manual-review limitations are retained.
V's final documentation merge and latest-main acceptance follow separately.
No functional release automatically promotes the rollback branch.

## Retained rollback checkpoint

Tasks 14-18 were merged and accepted on main
`80d955bdde6a7ef4e59ceb720d9c9a654efbe5e3`. Final CI 34720652232 passed
774 unique units and 1,086 blocking browsers. Deployment 34720652234 and
all 14 final live checks passed, with clean matching build identities.
The site has eight chapters, shared monthly figures, action-first queue/claims
and independent Pharmacy/NHSBSA/Both perspectives.

On 13 September the owner explicitly promoted this exact pre-change main to
`last-known-good` and annotated `lkg-2026-09-13`, with annotation
**Last known good after Tasks 14 to 18**. Subsequent header-only Agent changes
do not automatically advance that checkpoint.

## Historical integration evidence

The earlier base main after recovery #54/live evidence #55 was
`d1f0bddc736ccec6b9ddbf9836c24188e7c954df`. Exact CI head
`8bee3f205d29178177a6fb1ef5e98394c7655d2c` passed 695 unique units and
1,055 blocking browsers (34705318318). Actual live acceptance belongs to
clean `b813c6241cc084957a30c6bf48fdd65f623f33f6`, not a later documentation
commit. Runtime/source/dependencies/policy/Vite remain unchanged through this
base. Final documentation merges and latest-main deployment verification
are coordinator-owned; no self-merge or automatic rollback promotion.

Historical `main` after opacity repair #42, quarantine removal #40 and V #43 is
`c687a9eab181b02f4fca0eb667e8ab8f94468620`. Accepted application/test source is
`82c18e49e7d1c765e5392b1bec5c028c8f89fd16`, matching tested head
`f295d7f19363cd101af7401f0ba03188ee7d0b2b` (CI 34696637977:
607 units, 1,054 all-blocking browsers, zero quarantine). V #43 adds scoped
64-route provenance and compression evidence, not runtime changes.

Initial main after R PR #33, V PR #24 and parity PR #38 was
`a031fc49f4f616efc3a3a33baa0510e6b82eb880`. V's merge is
`be623ab507e871c27e0889e7db6e64a8595ad10b`. R's application merge is
`898cda594d0dcb34376bddab7112edcddb172440`; its tested head is
`6e424ac75c4980380c31f9e3aab23243a9a013d0` (CI 34689966621).
V's documentation head `5660bbc` supplies the original 107 captures. Those
initial revisions have matching runtime source/configuration, not the later
opacity-repaired runtime. See PROGRESS for current scoped provenance, exact
evidence and limitations; a documentation merge is not a new browser run.

D delivers on `williamng18-final-acceptance-documentation`, rebased on main
after live evidence #55. Initial D #39 and refresh #45 are merged; the coordinator
serialises this hosted closeout PR merge. D does not self-merge.
The earlier generated D branch remains the pushed checkpoint, not an active
acceptance branch. No empty checkpoint is claimed as a feature increment.

# Protected references

The [root branch policy](../../BRANCHES.md) remains authoritative for rollback
and archive protection. Its old active-development paragraph is historical;
the integration revisions above describe this closeout.

| Reference | Immutable resolved commit |
| --- | --- |
| `last-known-good` and annotated `lkg-2026-09-13` | `80d955bdde6a7ef4e59ceb720d9c9a654efbe5e3` |
| Older annotated `lkg-2026-09-09` | `23ca3312336fe76a349db6b7f29cff0f13c6dd82` |
| `cowork-v1` branch and annotated tag | `a2ab8019ad80796eeeb7b06807d5d0062d98f11f` |
| Main `checkpoint-2026-09-12` | `b7e63ac6bc1825fe0f92527faf3e9fd647c34126` |
| Original D checkpoint branch/head | `76b36b72ccd0f45750e46daa26edb5ba2e4956da` |

All nine annotated transfer checkpoint tags remain preserved. Full stream
checkpoint heads and ownership are in HANDOVER's historical record. Transfer
was cancelled; WilliamNg18 remains owner and the public-reference/security
decisions remain in force. Archive and existing tags remain immutable. The
rollback branch moves only by explicit owner instruction, as recorded above.

Application/documentation completion does not promote a new rollback point
or establish future availability. Actual App Service live acceptance is recorded
in PROGRESS and live-verification at the exact tested release. F1 has no live
PR preview slots; no outstanding SWA token/owner action remains.
