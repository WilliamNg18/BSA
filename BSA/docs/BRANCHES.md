---
title: Final integration and protected branch record
description: Accepted application revisions, documentation delivery and immutable rollback/checkpoint references.
ms.date: 2026-09-12
---

# Current integration

Current `main` after opacity repair #42, quarantine removal #40 and V #43 is
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
after V #43. Initial D #39 is merged; the coordinator serialises this scoped
records refresh PR merge. D does not self-merge.
The earlier generated D branch remains the pushed checkpoint, not an active
acceptance branch. No empty checkpoint is claimed as a feature increment.

# Protected references

The [root branch policy](../../BRANCHES.md) remains authoritative for rollback
and archive protection. Its old active-development paragraph is historical;
the integration revisions above describe this closeout.

| Reference | Immutable resolved commit |
| --- | --- |
| `last-known-good` and annotated `lkg-2026-09-09` | `23ca3312336fe76a349db6b7f29cff0f13c6dd82` |
| `cowork-v1` branch and annotated tag | `a2ab8019ad80796eeeb7b06807d5d0062d98f11f` |
| Main `checkpoint-2026-09-12` | `b7e63ac6bc1825fe0f92527faf3e9fd647c34126` |
| Original D checkpoint branch/head | `76b36b72ccd0f45750e46daa26edb5ba2e4956da` |

All nine annotated transfer checkpoint tags remain preserved. Full stream
checkpoint heads and ownership are in HANDOVER's historical record. Transfer
was cancelled; WilliamNg18 remains owner and the public-reference/security
decisions remain in force. Do not move archive, rollback or checkpoint refs.

Application/documentation completion does not promote a new rollback point
or prove live hosting. Azure deployment remains owner-blocked under #37;
no live URL or preview is asserted.
