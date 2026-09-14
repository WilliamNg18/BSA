---
title: Branch and rollback policy
description: Active development, the verified rollback point and the immutable original archive.
---

## Active development

Use `main` as the integration branch. Create focused changes from the latest
merged main. Repaired Tasks 25-30 runtime is integrated at
`34d7567917a4c2fcdb447e2a9a0239d2c8cebe0e`; source-pinned acceptance and the
final evidence-only release boundary are recorded in
[PROGRESS](BSA/docs/PROGRESS.md). A stale local `main` is not the active
integration baseline. The Tasks 14-18 commit below is rollback history.

## Last known good

`last-known-good` is rollback only. On the owner's explicit 13 September request,
that branch and the new annotated tag `lkg-2026-09-13` now resolve to
`80d955bdde6a7ef4e59ceb720d9c9a654efbe5e3`, the current main before the
header-only Agent control change. Annotation: **Last known good after Tasks 14 to 18**.
The older annotated `lkg-2026-09-09` remains at
`23ca3312336fe76a349db6b7f29cff0f13c6dd82`.
Do not develop or commit on the rollback branch. Move it only on another
explicit owner request; do not move or recreate existing tags.

## Original archive

The `cowork-v1` branch and annotated tag resolve to
`a2ab8019ad80796eeeb7b06807d5d0062d98f11f`. They are the original archive.
Never commit on the archive branch, move either reference or retag the archive.
