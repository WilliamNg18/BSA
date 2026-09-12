---
title: First-time viewer clarity review
description: Chapter 2, 6 and 7 understanding criteria, observed baseline and source-pinned final acceptance.
ms.date: 2026-09-12
---

# First-time viewer review

Task 18, issue #60. This is an **agent novice-perspective review**, not human
user testing. Ten seconds is a first-glance review target, not a measured human
comprehension score or a performance gate. No claim of WCAG certification is made.

**Status: final live review complete at clean `c0203fc`.** The coordinator
released the capture gate after N/Q/P/X merged and its 14 live checks passed.
V then captured and reviewed all 18 requested views and completed the actual
UI walkthrough below. Old baselines remain unchanged and are not this proof.
This is bounded AI evaluator acceptance, not measured human comprehension.

## What should land within ten seconds

Read the initially visible chapter before expanding technical detail. Judge
each point separately as Lands, Partial, Miss or Not observable. Record the
visible evidence and the limitation, not just a pass/fail impression.

### Chapter 2: A month in numbers

| Point | Understanding | One-click evidence |
| --- | --- | --- |
| 2.1 | The figures estimate operator effort for a month, not money saved or measured NHSBSA performance. The 85,000 volume is a qualified referral-subset proxy. | Toggle Agent from Off to On without changing inputs. |
| 2.2 | Today includes gathering and judging. Assisted built items remove gathering, not human judgement; abstentions still take the full manual time. | The same toggle changes the monthly-hours tile, with the manual comparator still understandable. |
| 2.3 | One operator's capacity uses 7,560 assumed working minutes. Assisted capacity is for built cases, not the mixed queue or actual completed cases. | The same toggle changes capacity from 630 Today to 3,780 built cases, separately from monthly effort. |

Default arithmetic to reconcile against the shared model: 85,000 items x
12 total Today minutes / 60 = 17,000 hours. Judging is included in those 12
minutes, not added to them. Assisted effort is 255,002 / 60 hours
(approximately 4,250.03 before display rounding). Built items take 2 judging
minutes and zero gathering; abstentions take all 12 minutes; caught/cleared
cohorts take no operator time. Seven gathering weights, cohorts and Sankey
remain inspectable but collapsed initially. None of these are measured savings.

### Chapter 6: The queue

| Point | Understanding | One-click evidence |
| --- | --- | --- |
| 6.1 | This is NHSBSA work awaiting a human decision, with counted filters that identify the selected work. | Select a counted filter and confirm its rows and selected state agree. |
| 6.2 | Today remains usable manual work. On adds evidence preparation and recommendations, not automatic decisions or payments. | Toggle Agent for the same visible work; explain what changes and what does not. |
| 6.3 | The one-hour comparison is a read-only capacity illustration, not work performed or lifecycle progress. | Open Compare, then Run one hour; distinguish the two modes without recording a decision. |

The chapter's difference-demonstrating click is **Compare**, followed by
**Run one hour** to inspect the projection. These are Q's confirmed labels,
confirmed in the final live walkthrough. Check the six-column virtual table,
reactive New items and side-appropriate states. A synthetic model row must not
be mistaken for a full clinical evidence pack; Today must open usable manual work.

### Chapter 7: What the pharmacy sees

| Point | Understanding | One-click evidence |
| --- | --- | --- |
| 7.1 | Action needed, Waiting on NHSBSA, Paid this month and All identify where this pharmacy should act; amounts are synthetic claimed amounts. | Select Action needed and confirm its count and filtered rows. |
| 7.2 | The selected item's actual response determines the next action: correction or information. Off shows the exact raw reason; On never invents an approved note. | Open the same claim from its explicit row action. |
| 7.3 | An actual operator-approved note can support a suggested correction and precheck. A human must still resubmit, and NHSBSA must review again. | On a claim with a recorded approved draft, toggle Agent to expose the actual approved instruction rather than relabel the raw reason. |

The chapter's difference-demonstrating click is the **Agent toggle on the same
referred claim with an explicitly approved draft**. A seeded claim without an
approved draft should instead say so; that is an authority guard, not failed
assistance. The five-column table and single detail card should make the action
clear before the historical explanation. Model context and actual session
revision/lifecycle counts must be labelled separately.

## Perspective and authority checks

| Requested chapter | Pharmacy | NHSBSA | Both |
| --- | --- | --- | --- |
| 2, `/#month` | Chapter content | Chapter content | Chapter content |
| 6, `/queue` | Opposite-side guard expected | Queue content | Queue content |
| 7, `/pharmacy/claims` | Claims content | Opposite-side guard expected | Claims content |

Capture each cell with Agent Off and On: **18 requested combinations**,
including four expected guard views. Label guards as guards, not as missing
screens or reviewed operational content. Perspective defaults to Both, remains
independent of Agent, and survives Reset. Switching perspective must not copy
history or create a second item. In the final round trip do not Reset or reload.

The synthetic notice and governing principle must stay visible. Narrative
panels aim for fewer than 25 words; tables have at most six columns. Counted
tiles must actually filter. Every internal-process assumption needs the
appropriate **Public** or **Assumption: not published** tooltip classification.
Public attribution does not mean independently verified.

**Exact queue-guide exception:** the owner's exact guides contain 26 words.
Keep their exact copy rather than rewrite it to satisfy the shorter aspiration.
Record the one-word conflict as informational, not a blocking copy budget.
UK English, no em dashes and no UI vendor/document names still apply.

## Observed pre-redesign live baseline

Observed URL: https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/.
One isolated Chromium browser visited chapters 2, 6 and 7 in Off and On from
`2026-09-12T19:21:33Z` to `2026-09-12T19:22:15Z`, at 1440 x 1000, light,
reduced motion. All before/after build identities reported clean commit
`6b0632823514b923b54d3ae9f873fabfa9715851`, built
`2026-09-12T19:15:00.916Z`. This predates N/Q/P/X's new interface.

| Surface | Actual observation | Routing / boundary |
| --- | --- | --- |
| Chapter 2 | Eight top-level scenario fields precede the seven-step breakdown. Today shows 9,916.7 reference hours and 7 minutes/item, not the new 12-minute total-effort model. | N's already-owned replacement; not a new arithmetic bug in the legacy model. |
| Chapter 6 | Eight headers: Case, Exception reason, Evidence status, Agent recommendation, Confidence signals, Recorded seed state, In queue, Actions. A long separate shared-session list precedes the model table. | Q's already-owned six-column/action-first work. |
| Chapter 7 | Five explanatory referral stages precede the selected claim/actions. The guide correctly says it is not claim history; On says drafts require explicit operator approval. | P's already-owned compact action-first work; preserve the authority wording. |
| Perspectives | The current header has no visible Pharmacy/NHSBSA/Both control. | X's already-owned feature; no final perspective or guard claim from this baseline. |
| Runtime | No page or console errors observed during the six route/mode readings. | Not a full functional test, axe audit or certification. |

These findings were sent to the owning streams, not fixed through concurrent
source edits. Existing scope already covers them; do not create duplicate issues.
New concrete misses after integration will receive their own routed issue.

### Independent continuation baseline supplement

The [settled supplemental record](screens/first-time-viewer/baseline-supplement-settled.json)
is a separate isolated-browser observation, **19:24:38 to 19:24:50 UTC**, not
the initial writer's run above. It brackets every chapter with the same clean
`6b06328` live identity. At 1440 x 1000, eight visible chapter 2 inputs precede
the result headings at y=1009; the chapter 6 table has eight columns.
Opening EX-24112 with Agent On confirms "No operator-approved draft. Enabling
assistance does not approve a note." No submission or decision was performed.
All six Off/On views have no horizontal overflow or recorded page/console/CSP
error. No axe or timed human study was performed.

The [initial supplemental probe](screens/first-time-viewer/baseline-supplement-initial.json),
19:21:46 to 19:21:59 UTC, is retained separately. Its input geometry counted
hidden disclosure fields and its selected-claim snapshot preceded detail
rendering. Those observations are not evidence of visible input count or
detail content. The settled retry filters by actual visibility and awaits the
detail/Compare control. This is a probe correction, not a production failure.

For source tooltips, `source-audit.ts` N12 classifies weeks of delay as
illustrative, not a measured distribution. P confirms its guide tooltip says
"Weeks of delay, the delivery channel and internal handling steps are
illustrative assumptions, not published facts." The final live 7.2 checkpoint
also focuses this tooltip and records that distinction.

## Source review boundary

Read the retained verbatim excerpts in
[source-audit.ts](../data/reference/source-audit.ts) directly. PDF-A02 asks
whether evidence assembly consumes material time; it does not establish that
assembly exceeds judging. PDF-A03 and PDF-A04 require validation of source
reconciliation and interpretation beyond deterministic rules. H08, H10 and H13
are proposed capacity, reconstruction and pharmacy-rework outcomes. D-VALUE
requires separate accounting without double-counting; D-STOP requires agreed
stop criteria. D-PHASES makes pharmacy integration optional and D-ADVISORY
keeps submission non-blocking.

The current worktree contains the excerpt register, not the original PDF/DOCX
binaries. Supplied source hashes and historical extraction review are not a
fresh binary inspection. No external publication was independently verified,
and none of these claims establishes deployed NHSBSA internal processes.

## Final latest-main live walkthrough

**Observed, not planned:** clean live
`c0203fc73991c0968329dbc2f4bbfb4aa8c1781f`, built
`2026-09-12T21:16:45.865Z`. The [completed record](screens/task18/c0203fc/walk-completed.json)
contains 22 checkpoints, each with actual URL, build identity, accessibility
snapshot and assertions. It ran **21:23:55 to 21:24:13 UTC** on 12 September,
1440 x 1000, light, reduced motion, isolated Chromium. The first session walks
the nine points and approved-referral cycle; a separate fresh session proves
the catch counter. Neither session uses Reset, reload, store injection or
hidden action hooks. No page/console/CSP error or horizontal overflow occurred.

| Point | Final live result | Observed evidence / limit |
| --- | --- | --- |
| 2.1 | Lands | Three primary inputs, assumption badges and public-default referral-subset hint precede two visible tiles. Keyboard-focused public tooltip says not measured total queue. Today displays 17,000 hours. |
| 2.2 | Lands | One Agent click changes hours to 4,250; per-item bar changes gathering 10 to 0 while judging remains 2. The explicit 12-minute abstention caveat remains. |
| 2.3 | Lands | Same click changes capacity 630 to 3,780. Off says manual-case capacity; On says built-case capacity, not a mixed-cohort guarantee. All six month captures assert exact model-formatted values equal accessible values. |
| 6.1 | Lands | One six-column table and counted filters; selecting Cleared by rules changes selected state and rows. Initial range is 1 to 50 of 70,833 operator slots, not the whole-service 85,000 proxy. |
| 6.2 | Lands | Off shows manual work and D's known abstention; On adds evidence phases but D still says no recommendation. Focused source tooltip classifies the internal view as assumptions. |
| 6.3 | Lands after the required click | Compare then Run one hour gives 60 synthetic minutes: Today 60 operator minutes / 5 decisions / 3 cited, assisted 36 / 8 / 3. Each is explicitly projected; no decision is recorded. |
| 7.1 | Lands | Four counted/amount filters above the five-column table. Initial Hillcrest counts 4 action, 4 waiting, 1 paid, 9 all; every amount says claimed (synthetic). Monthly recorded categories and projected catches are separately labelled. |
| 7.2 | Lands on selected detail | Seed B On says no operator-approved draft. Off shows the raw human reason and rule/clause; focused How was this sent? distinguishes published context from assumed channel/delay/internal process. |
| 7.3 | Lands after real approval | Human submits B, starts review, checks Approve this draft and records Refer back. Only then does the same claim's Agent toggle reveal the actual approved note with operator/time/version/clause. Applying text leaves the referral unchanged; explicit resubmission and another human decision are required. |

The three comprehension targets per chapter are evaluator judgements based
on these visible observations, not a claim that a human read a detail page or
completed the workflow within ten seconds. In Both, chapter 7's table begins
below the 1000px fold, while the action tiles are visible; the single-side
Pharmacy view removes tour chrome and exposes the first actions sooner.
This is recorded as a layout limitation, not an invented timing failure.

### Same-item and catch-counter proof

The approved-referral session retains EX-24112 throughout: seed attempt,
manual submission, approved referral, corrected resubmission, final human
acceptance and synthetic paid state. The final Off/Both switch preserves the
same immutable attempts; it does not recreate the item or undo the decision.
The actual detail distinguishes applying the correction from **Resubmit claim**.

The counter session begins with **Caught before submission = 0**. **Apply
correction** in Pharmacy check followed by **Ready to submit** changes the
selected-pharmacy count to **1**, with the original claim state and attempts
unchanged and no submission receipt. Returning to the workbench restores its
local missing-date form; applying the same correction again does not double
count. Only **Continue with submission** creates the new attempt. The same
EX-24112 then appears as **New**, **Submitted, awaiting review**, with
**Open for review** in the NHSBSA queue. No automatic submission is inferred.

### Failures, review and remaining limits

The [first walk attempt](screens/task18/c0203fc/walk-attempt-1.json) reached
corrected resubmission, then its harness timed out searching for whitespace
between the All tile's separate text spans. The UI was not broken. The selector
was changed to the exact child label and the entire two-session walk was rerun
successfully; the first attempt is retained, not described as a first-run pass.

V found and routed one source-copy issue before final capture: N's Off capacity
footnote incorrectly said built-case capacity. N corrected the calculator,
scene and accessible summary; the final live manual/built labels are observed
above. No remaining concrete application defect was reproduced in this scoped
walk. Existing scope findings were routed to their original issues rather than
duplicated. The exact 26-word queue-guide exception remains informational.

The [final matrix and visual review](screens/task18/README.md) has 18 images,
18 unrestricted axe audits with zero violations and 13 audits with incomplete
results (11 color-contrast, 8 aria-prohibited-attr, overlapping). All images
were reviewed at full height. Natural Agent focus tooltips remain in On images;
they were not hidden or pixel-masked. These results do not establish mobile,
dark, cross-browser, screen-reader or full manual WCAG conformance. The separate
coordinator 14-check record and seven audits are not added to these totals.

Keep fresh screenshot/audit provenance separate from the original
[107 captures](screens/integrated/README.md) and
[64 route reproductions](screens/route-opacity-parity/README.md).
Preserve old screenshots, timestamps, source hashes, failed runs and retries.
Actual axe counts and incomplete results must be reported without inventing
CI-wide audit totals or manual WCAG conformance.
