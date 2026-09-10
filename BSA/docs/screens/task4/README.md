---
title: Task 4 pharmacy screenshots
description: Synthetic pharmacy receipts, checks and timelines in both assistance states.
ms.date: 2026-09-10
---

## Coverage

Twelve screenshots cover A/B/D with assistance On and Off, desktop light at
1440 pixels and phone dark at 360 pixels. All default axe rules passed for
these twelve states. Screens show an immutable receipt after the current
month-end assumption changes to 30 days; its timeline correctly retains 14.
No real claim is sent and no payment transition occurs.

## Selected visual review

* [B On desktop](B-on-light.png): amber date gap, explicit Apply, performed-check receipt
* [B Off desktop](B-off-light.png): manual submission, no checks, illustrative referral timeline
* [D On phone](D-on-dark.png): capture STOPPED, downstream NOT RUN, no guaranteed payment

Captures were regenerated from scroll position zero so sticky navigation stays
at the top of full-page images. The sixteen pharmacy tests passed again after
this screenshot-only adjustment. See [progress](../../PROGRESS.md) for the full
404-test gate and [capture log](../../../../.copilot-tracking/tasks/4/screenshot-verification.log).