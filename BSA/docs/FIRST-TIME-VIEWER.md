---
title: First-time viewer clarity review
description: Chapter 2, 6 and 7 understanding criteria, observed baseline and source-pinned final acceptance.
ms.date: 2026-09-12
---

# First-time viewer review

Task 18, issue #60. This is an **agent novice-perspective review**, not human
user testing. Ten seconds is a first-glance review target, not a measured human
comprehension score or a performance gate. No claim of WCAG certification is made.

**Status: preparation and pre-redesign baseline complete; final review pending.**
The coordinator must explicitly confirm N, Q, P and X are merged before the
final rebase, captures and latest-main live walkthrough. Old observations below
cannot establish acceptance of those changes.

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
still awaiting final live verification. Check the six-column virtual table,
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
illustrative assumptions, not published facts." Preserve that distinction;
the final live tooltip still requires observation.

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

**Not run yet.** Do not replace this with a planned or local run described as
live. After the coordinator's functional-merge notification, record the exact
live commit, clean build identity before/after, build UTC, observation UTC,
viewport/theme/motion, actual clicked controls and preserved same-item history.

| Point | Final live result | Observed evidence / limit |
| --- | --- | --- |
| 2.1 | Pending | Await merged live interface. |
| 2.2 | Pending | Await merged live interface. |
| 2.3 | Pending | Await merged live interface. |
| 6.1 | Pending | Await merged live interface. |
| 6.2 | Pending | Await merged live interface. |
| 6.3 | Pending | Await merged live interface. |
| 7.1 | Pending | Await merged live interface. |
| 7.2 | Pending | Await merged live interface. |
| 7.3 | Pending | Await merged live interface and actual human draft approval. |

Keep fresh screenshot/audit provenance separate from the original
[107 captures](screens/integrated/README.md) and
[64 route reproductions](screens/route-opacity-parity/README.md).
Preserve old screenshots, timestamps, source hashes, failed runs and retries.
Actual axe counts and incomplete results must be reported without inventing
CI-wide audit totals or manual WCAG conformance.
