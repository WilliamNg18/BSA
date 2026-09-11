---
title: Task 6 case view screenshots
description: Local production screenshots of manual and assisted case views at desktop and phone widths.
ms.date: 2026-09-11
---

## Capture matrix

The final 465-test Chromium run generated these twelve images. Desktop is
1440x1000 with light colours; phone is 360x800 with dark colours. Captures use
reduced motion. Pack On includes the optional read-only manual comparison;
only one shared decision panel is rendered. Trace and pack show canonical B;
record shows historical F without inventing a new human decision.

| View | Desktop Off | Desktop On | Phone Off | Phone On |
| --- | --- | --- | --- | --- |
| Pack | [Image](pack-desktop-off.png) | [Image](pack-desktop-on.png) | [Image](pack-phone-off.png) | [Image](pack-phone-on.png) |
| Trace | [Image](trace-desktop-off.png) | [Image](trace-desktop-on.png) | [Image](trace-phone-off.png) | [Image](trace-phone-on.png) |
| Record | [Image](record-desktop-off.png) | [Image](record-desktop-on.png) | [Image](record-phone-off.png) | [Image](record-phone-on.png) |

## Verification

Each capture passed unrestricted axe and document-width overflow assertions.
Twelve Task 6 audits have zero violations. Pack desktop On, pack phone Off,
record desktop Off, record phone On, trace desktop Off and trace phone On were
visually reviewed. Trace tables intentionally scroll horizontally within their
keyboard-focusable regions on phones; content is not discarded.

The historical Off record acknowledges its existing rule version rather than
claiming the rule never existed. Missing slots describe this synthetic manual
comparison only. The manual override-counter caveat remains visible and awaits
Stream B integration. These local images do not establish hosted, cross-browser,
manual screen-reader or production NHSBSA behaviour.

See [progress](../../PROGRESS.md) for final logs and preserved failed runs.