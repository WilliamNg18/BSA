---
title: One pharmacy, one continuous cycle
description: Five-minute stakeholder walkthrough followed by a synthetic Hillcrest operational demonstration.
ms.date: 2026-09-13
---

## Preparation and evidence boundary

This is the Tasks 25-30 demonstration script, not a record of an executed walk.
[PROGRESS](PROGRESS.md) owns the exact accepted source and deployment.
Earlier Tasks 19-24 captures, including the failed `1327e65` review and repaired
`d5832e0` review, remain unchanged historical evidence.

Use only the coordinator-approved deployment:
https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/.
Check `/build-info.json` against its full expected commit and `dirty: false`.
Do not present a local instrumented state-observer build as this deployment.
The final URL check must be within ten minutes of release closeout.

Choose **Both**, then **Reset demo > Reset demonstration**. Confirm Hillcrest
Pharmacy (FQ123), no pharmacy selector, and the single header **Agent: Off**.
Reset retains perspective and route. During a same-item cycle, never Reset or
reload: use links so the shared browser-memory history survives.

Say: "Everything here is synthetic. The agent verifies and advises; a person
decides. Existing code prices complete items. This demonstration calculates
and approves no payment."

## Part 1: five-minute stakeholder walkthrough

Visit chapters 1 to 3 before operating the live examples. Flip the header
toggle once in each chapter; do not add local switches or imply that toggling
submits, confirms, judges or pays an item.

### 0:00-1:30, chapter 1: the real process

Start at `/#scene`, Off. Show the supplied public context: over 100 million
items monthly; most priced with no person; approximately four per cent touched
by staff; approximately 85,000 referred back. These are attributed figures,
not independently verified measurements from this prototype.

Show EPS as a typed claim message, distinct from scanned paper. Type 1 captures
uncertain paper fields. Type 2 judges endorsements. The two staff cohorts may
overlap; neither is identical to the 85,000 referral subset.

Flip **On** once. Point to separately labelled estimates, not a revision to
the public facts. Say: "The proposal prevents avoidable referrals at the
pharmacy and prepares evidence for people judging the remainder."

### 1:30-3:15, chapter 2: the numbers

Continue to `/#month`, still On. Show the editable assumptions and the two
headline tiles, then flip **Off** once to compare Today. Both model columns
remain readable. At defaults the unrounded arithmetic is:

| Measure | Today | With the agent, estimate |
| --- | --- | --- |
| Items referred back | 85,000 | 5,100 |
| Operator hours, total | 19,479.166666... | 297.5 |
| Pharmacy completion hours | 8,500 | 510 |

Explain the With total: **255 judging hours plus 42.5 hours gathering evidence
on abstentions**. Never headline 255 as total operator work. The central bet
is 80% prevention; 70% of the remainder clears before the queue. Five per cent
of the resulting 5,100 cases abstains: 255 items, not five per cent of all
85,000 and not a measured one-of-six case rate.

Today includes ten minutes gathering, three minutes judging and a second
three-minute judgement for 25% of cases. With assumes three-minute judgement
and no double-check. These are hypotheses, not a guarantee of staffing savings.
The 85,000 denominator represents the referral subset, not all staff work.

Show the permanent estimate qualification and one input definition. If editing
an assumption, follow that same edited result into the queue and pharmacy
strip later. Do not compare edited numbers with unrelated defaults.

### 3:15-5:00, chapter 3: the pipeline

Continue to `/#pipeline`, Off. Trace complete EPS through existing automatic
pricing, then paper through capture and uncertain endorsements through human
judgement. Flip **On** once. Show gathering, dated-rule retrieval, checks and
advice, while the explicit human confirmation and judgement remain.

Say: "The agent verifies and advises; a person decides. Complete items are
priced by NHSBSA's existing rules engine, no person involved."

Before the live cycle, visit `/#cases`: A automatic, B missing the NCSO date,
C unresolved quantities, and D unreadable paper. Keep `/boundary` reachable
and identify the proposed declaration design. Do not turn four illustrations
into a claim that the six canonical cases are a measured evaluation sample.

## Part 2: Hillcrest live demonstration

Use one continuous session. The seeded month includes automatic paid items,
Type 1 capture, Type 2 judgement, Action needed, Resubmitted, Information
requested and a paid-after-correction history. Fixed other-pharmacy queue
background is labelled, unclickable and excluded from operational counts.

### Complete EPS: no person at NHSBSA

Open `/pharmacy`, choose EPS and the complete scenario. Show the visible
synthetic prescription: prescriber and practice, date, synthetic patient,
prescribed item, prescriber endorsement, and the dispenser's fields.

Turn Off if necessary and explicitly **Send claim**. Follow its receipt and
case ID to **Paid**. Attribute pricing to NHSBSA's existing rules engine,
not the agent. The item contributes to the automatic count, not an operator
queue row. EPS has no image and no Type 1 unreadability step.

### NCSO: Off referral, On prevention

Select the EPS missing-date scenario. Off, show the editable endorsement and
the unchecked-rule/send pain markers. Send the incomplete claim. Follow its
ID into Type 2, start review and record a human **Refer back** decision with
the exact NCSO correction and RB code. A generated note is not approved until
the person explicitly approves it. Show the pharmacy's **Action needed**.

For the On prevention comparison, select a new missing-date attempt, turn On
and show recognition, dispensing-date rule selection, clause and requirement
checks. Apply the suggestion to add the date beside the initials. Applying
does not submit. Send only after the checks resolve; show automatic pricing.

Also show the third EPS scenario: generic missing the brand or manufacturer.
The advice must address that missing field, not repeat the NCSO date fix.
Do not represent the simulated delay as elapsed real weeks.

For a referred generic item, use **Correct the EPS supply evidence** in claim
details. Confirm the actual brand/manufacturer, pack size and form, re-check,
then explicitly resubmit. Follow the same ID to human review and Paid.
Retain the original message and referral; a corrected field is not a decision.

### Unreadable paper: manual capture and RB2B

Choose Paper, Off. Show the synthetic image and the absence of a pharmacy
declaration form. Submit the paper. In Type 1, show manual keying, the human
tag and stopwatch. Key only the known synthetic example fields; leave unknown
fields unknown. Confirm capture explicitly, then follow Type 2 judgement to
a human RB2B referral for missing presentation. Show the same pharmacy item
in **Action needed**, with its actual reason and preserved earlier attempt.

### Proposed paper declaration: checked, then human-confirmed

Turn On and load the worked declaration:
**Co-codamol 30/500 tablets; 100; NCSO JB 27/08/26; 27 August 2026**.
Show the declaration check against the synthetic August provision requiring
initials and a date. The advice concerns the declared fields and what the
paper must show, not successful reading of the image.

Submit explicitly and follow the same revision into Type 1. Show **image
cannot be read** beside fields labelled **declared by the pharmacy, not read
from the form**. A complete declaration is not established source agreement.
Do not call the case built before valid human confirmation.

The frozen declaration does not contain a prescriber. Supply the required
synthetic prescriber as separate human capture evidence; do not invent it
from the illegible scan. Explicitly reconcile the known worked example and
confirm. An edit must clear reconciliation and require confirmation again.
If the sources cannot be reconciled, abstain and use the manual path.

Only after valid confirmation show Type 2's **Sufficient** recommendation,
clause, requirement checks and trace of the person's confirmation. A person
records the decision. The declaration path is **proposed**; shorter confirmation
time is an assumption, not a measured stopwatch saving or repaired handwriting.

### Action needed, correction, resubmission and Switch side

Open the seeded Action needed item in `/pharmacy/claims`. Read its actual
RB code and human reason. Correct the endorsement or declaration required by
that item, then explicitly resubmit. Keep the ID visible.

Use **Switch side** to follow the same item and revision in the staff view.
Opening or switching is not a new submission, capture or decision. Where
re-check is required, show **Resubmitted**, perform the human review and follow
the accepted item back to **Paid**. Where complete EPS clears automatically,
show existing pricing without inventing a second operator approval.

Inspect the original submission, referral, correction, resubmission and result
in one history. Today judgements say **experience only**; assisted supported
records say **rule and reason recorded**. Switching Off does not erase a
real earlier rule record or an approved human note.

Compare the chapter 2 result, queue summary and pharmacy strip under the same
inputs. Automatic monthly context and actual seeded work counts are different
quantities; do not equate them.

### Chapter 6 close: the central bet

Return to `/#close`. Name the current editable prevention assumption, **80%
at defaults**: pharmacy checks prevent would-be referrals before they enter
the manual loop. If observed prevention is substantially lower, the estimate
fails. Show the first test, required history and proceed/reshape/stop criteria.

Say: "Test prevention and evidence quality before promising savings. The
agent verifies and advises; a person decides. Existing pricing stays unchanged."

## Rehearsal and final acceptance are separate

Repeat the whole cycle in Both and while switching perspective at each step,
Off and On. Exact-state tests compare every action and Reset against the same
seed using a separate instrumented artifact; they are not hosted observations.

Final acceptance requires the complete named hosted inventory on the approved
source, not a passing subset. Export to a new Task 30 evidence directory.
Review every screenshot at full height for novice comprehension and functional
truth. Record actual keyboard and contrast observations separately. Zero axe
violations do not establish WCAG 2.2 AA or substitute for manual review.

The repaired deployment at `34d7567` passed the complete 30-check hosted
inventory. Its [new images](screens/task30/34d7567/manifest.json) and
[direct keyboard/contrast record](screens/task30/manual-34d7567/README.md)
are source-pinned. Final all-image review and release gates remain separate;
the original `b05b06a` visual failure is preserved, not relabelled.
