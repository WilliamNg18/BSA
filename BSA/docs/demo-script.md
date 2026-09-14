---
title: Eleven desktop steps, one shared case
description: Synthetic Today and With the agent walkthrough with explicit human actions and two verification gates.
ms.date: 2026-09-14
---

## Preparation

This is the Tasks 31-36 script, not evidence that the walkthrough passed.
[PROGRESS](PROGRESS.md) records the actual source, deployment and acceptance.
Use the coordinator-approved [demo](https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/)
only after `/build-info.json` matches its full expected commit and `dirty: false`.
The final URL check must be less than ten minutes old.

Use a 1280 or 1440 px desktop. Choose **Both**, then **Reset demo > Reset
demonstration**, then **Enter demo mode**. Start **Agent: Off**. On each step,
compare Today with With the agent using the single header toggle. Navigation
and toggling never submit, confirm, apply, refer, resubmit or release.
Read-only scenario projections are comparisons, not executed item history.

Everything is synthetic. The agent verifies and advises; a person decides.
Code validates and releases eligible items to existing pricing. Nothing here
calculates or approves a payment. Never use this demonstration as medicine advice.

## Eleven steps

Use **Next** once to enter each successive row; **Back** revisits the same
shared state. The click column names the principal control on that screen,
not permission to skip the explicit actions needed by an operational case.

| Step | What to click | What to say |
| --- | --- | --- |
| 1. The real process | Enter demo mode; toggle Agent On | Most items need no person; Type 1 captures paper, Type 2 judges, and 85,000 monthly referrals are a subset of staff work. |
| 2. A month in numbers | Next; expand the detail only if needed | Today and With use one model; every With figure is an estimate, and 297.5 operator hours includes abstention gathering. |
| 3. EPS: complete item | Next; Send claim | Today is priced by NHSBSA's existing rules engine, no person involved; On verifies both gates and releases without operator action. |
| 4. EPS: missing date | Next; Apply suggested correction | The date is missing; applying the supported fix fills the actual endorsement, but sending remains a separate pharmacy action. |
| 5. EPS: plausible but wrong | Next; Send claim | Complete-looking fields pass Gate 1; independent pack reconciliation fails Gate 2, so this item is never automatically released. |
| 6. Paper: declaration before posting | Next; Post paper | This is declared by the pharmacy, not read from the form; check the declaration before posting the same unreadable D item. |
| 7. Paper: human confirmation | Next; Confirm capture | A person confirms known evidence rather than claiming to read the poor image; unreconciled evidence still abstains and is never automatically released. |
| 8. What NHSBSA sees | Next; open the row and Apply suggestion | Applied by the operator from the agent's suggestion means populated fields, not a decision; release still requires valid code checks and human judgement. |
| 9. What the pharmacy sees | Next; Apply suggested correction, then Resubmit | Read the approved reason, inspect the highlighted correction and Ready check, then explicitly resubmit the same item with its history intact. |
| 10. Follow one case | Next; Pharmacy view and NHSBSA view | Follow D through submission, human capture, referral, correction, resubmission and human release; switching sides never changes its identity or evidence. |
| 11. Where it ends | Next | The agent verifies and advises; a person decides. Test prevention and evidence quality before promising savings; existing pricing stays unchanged. |

## Operational demonstrations

Only A (`EX-24107`), B (`EX-24112`), wrong-information EPS
(`SYN-FQ123-MISMATCH`) and unreadable D (`EX-24123`) are playable.
C and F are labelled, unclickable background. E's deterministic no-model
behaviour is represented within A's Today path, not a fifth operational item.
The canonical six-outcome rules fixtures remain semantic regression evidence.

On step 8, **Apply suggestion** fills the outcome, RB code and note visibly.
It must not release the item. **Release to pricing** is disabled when the
required checks fail. **Refer back** needs an RB code and reason; **Request
information** needs a question; **Escalate** records the operator's reason.
Off supplies no new suggestion: the person works from **experience only**.
Previously applied human drafts and history survive a mode switch.

On step 9, inspect the real changed endorsement or declaration field before
**Resubmit**. Off uses **Resubmit blind** with unaided editable fields.
For information requested, enter **Confirm**, then **Send confirmation**.
Neither applying a correction nor typing confirmation sends it automatically.
An unsupported correction must remain unresolved, not invent source evidence.

On step 10, keep the same `EX-24123` item without Reset or reload. Explicitly
submit a paper attempt, key or confirm known synthetic evidence, refer back
with RB2B, correct the supported fields, resubmit and perform the new revision's
human recheck before release. Use both side buttons after each state change.
The unreadable image remains unreadable: the known worked declaration and
separately human-supplied prescriber are not text recovered from that image.

If a perspective hides the destination, a side button temporarily shows Both
and says so. Returning with the origin-side button restores that perspective;
an explicit header choice keeps the new choice. Step, Agent setting, item,
drafts and operational history persist throughout.

Only an automatic release says **released to existing pricing, no operator
action**. A human button reaches the same `released_to_pricing` lifecycle with
human origin and visible operator involvement. Off may release after existing
code checks and human judgement, while both proposed gates remain `none`.
No release label claims that this prototype completed a payment.

## Shared numbers

Read the values rendered by the shared monthly model, not independent
presentation arithmetic. At unchanged defaults:

| Measure | Today | With the agent, estimate |
| --- | --- | --- |
| Referred-back items | 85,000 | 5,100 |
| Total operator hours | 19,479.166666... | 297.5 |
| Pharmacy completion hours | 8,500 | 510 |

With total operator hours includes 255 judging plus 42.5 gathering on
abstentions. The assumptions are 80% prevention, then 70% clearance of the
remainder, then 5% abstention among the remaining 5,100 items. These are not
measured savings, an observed case rate or all NHSBSA staff work.
When assumptions change, use the same changed model figures on every screen.
An assisted supported record says **rule and reason recorded**, not agent approval.

## Evidence boundaries

The final named live inventory covers all eleven steps in order, Back/Next
Off and On at both desktop widths, same-case side controls, both human action
panels, wrong-information rejection, header layout and zero axe violations
on every step. Full-domain equivalence is separate instrumented local evidence
with controlled clocks and IDs, including verification and both draft maps.
The normal production build must not expose that observer.

Capture new step images at 1440 px only, Off and On. A local rehearsal,
partial selection, retry or missing build identity is not hosted acceptance.
Zero automated axe violations are not manual WCAG certification.
If image inspection is tool-blocked, record that limitation without bypassing
the restriction or inventing a visual pass.

Historical [Task 30 evidence](screens/task30/README.md) remains historical.
Its interrupted independent image review is unverified. Mobile/tablet files
were withdrawn from the active checkout by explicit owner request; original
Git evidence is not rehashed or relabelled as new desktop acceptance.
