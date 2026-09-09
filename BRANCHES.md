---
title: Branch and rollback policy
description: Active development, the verified rollback point and the immutable original archive.
---

## Active development

Use `main` as the integration branch. Create focused PR branches from the latest
merged main. Phase 1 uses `refactor/remove-presenter-ui`, based on merged commit
`23ca3312336fe76a349db6b7f29cff0f13c6dd82`. A stale local `main` is not the active
integration baseline.

## Last known good

`last-known-good` is rollback only. Both that branch and the annotated tag
`lkg-2026-09-09` resolve to `23ca3312336fe76a349db6b7f29cff0f13c6dd82`.
Do not develop or commit on it. Move the rollback branch or retag only at the
user's explicit request, after verification of a replacement rollback point.

## Original archive

The `cowork-v1` branch and annotated tag resolve to
`a2ab8019ad80796eeeb7b06807d5d0062d98f11f`. They are the original archive.
Never commit on the archive branch, move either reference or retag the archive.
