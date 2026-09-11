---
title: Task 5 queue screenshots
description: Local production queue projections, desktop and phone, light and dark.
ms.date: 2026-09-10
---

## Capture scope

The Task 5 browser tests capture the full queue at 360px and 1440px, light and
dark, Agent Off and On. Each capture shows the shared clock at 17:00, twelve
pinned examples, a bounded month window and independently labelled day totals.
The inherited Stream D "Simulation planned" shell is intentionally visible;
its copy update remains an explicit integration handoff, not hidden styling.

* [Desktop light On](queue-1440-light-on.png)
* [Desktop light Off](queue-1440-light-off.png)
* [Desktop dark On](queue-1440-dark-on.png)
* [Desktop dark Off](queue-1440-dark-off.png)
* [Phone light On](queue-360-light-on.png)
* [Phone light Off](queue-360-light-off.png)
* [Phone dark On](queue-360-dark-on.png)
* [Phone dark Off](queue-360-dark-off.png)

Desktop light On and phone dark Off were visually inspected. The wide pinned
table scrolls horizontally on phones; the model and day panels reflow. Browser
tests run all default axe rules in each captured combination. Final counts and
limitations are recorded in [progress](../../PROGRESS.md).