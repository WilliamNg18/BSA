---
title: Demo script and discussion guide
description: Exact-click eight-chapter story and a complete human-controlled pharmacy round trip.
ms.date: 2026-09-12
---

## Prepare the demonstration

Use the root-path production build, not the development server:

```powershell
Set-Location BSA
npm run check
$env:PLAYWRIGHT_PORT = "4193"
node scripts\serve-production.mjs
```

Open `http://localhost:4193/` at 1440px. Keep this guide beside the application.
There is no presenter timer, Discussion mode or `/notes` route. The live demo is
https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/ on the existing App Service.
The [hosted evidence](live-verification/README.md) is pinned to its tested build;
check `/build-info.json` before attributing a rehearsal to a later release.
No SWA token or new owner setup is needed. Infrastructure remains frozen.

**Verified Task 18 story:** [FIRST-TIME-VIEWER](FIRST-TIME-VIEWER.md) and the
[live walk](screens/task18/c0203fc/walk-completed.json) pin the chapter 2/6/7
observations, perspective switches and human-controlled B cycle to clean
`c0203fc`, built `2026-09-12T21:16:45.865Z`. The walkthrough used reduced
motion; with normal motion, wait for settled numbers and advisory results.

Click **Reset demo**, then **Reset demonstration**. Confirm **Agent: Off**.
Reset retains the current route, so click **Overview** to begin at scene if
necessary. Cancel with **Keep working** or Escape when demonstrating the dialog
without losing work. Reload also loses session history; do not reload mid-story.

Say: "All case data and rule text are synthetic. Interpretation is scripted.
The agent gathers evidence and recommends; code validates; a human decides.
Nothing here calculates or approves a payment."

Say: "The public figures are attributed, not independently verified. The annual
figure concerns primary-care items in England with no reporting year specified;
the monthly referral approximation uses 2024/25 context."

### Frame the aim before the walkthrough

The owner-approved references are *William Ng Single Page - Embrace the
Change.pdf* and *nhsbsa-FINAL-complete-pack-v5.docx*, indexed with qualifications
in the [source register](../data/reference/source-audit.ts). Naming them in this
guide is permitted; do not add their names to the website interface.

Say: "The problem we are testing is evidence assembly for uncertain endorsements
under a dated rule. Existing capture and pricing stay. We need to establish
whether assembly effort is material and whether simpler rules or a pre-fetched
screen would be enough."

Say: "The outcomes to test are less repeat handling, usable operator capacity,
reconstructable decisions and less pharmacy rework. None is a measured result
of this demo. Keep pharmacy value separate and agree evidence and stop criteria."

Use PDF-A02/A03/A04 for those validation questions, H08/H10/H13 for candidate
outcomes and D-VALUE/D-STOP for benefit accounting and stop conditions. Do not
turn the pack's stronger assumption that assembly takes more time than judging
into an observed fact. The current side-by-side demo is not proof that both
operational integrations should be deployed together.

The header contains Overview, Operations, How it works, Perspective, Agent and
Reset. Select **Both** for the full tour; **Pharmacy** or **NHSBSA** filters
operations and hides the tour/Follow controls without changing session history.
Perspective and Agent are independent; Reset retains perspective.
Under Operations in Both are Pharmacy check, Pharmacy claims and NHSBSA
queue. Under How it works are Evaluation, Boundary, Assumptions and Architecture.
At narrow widths use **Open navigation**.

## Tour: eight chapters, nine stops

Use the rail's **Next** and **Back**, not old presenter beats. The chapter
selector has eight entries. Pharmacy check is chapter 5's additional stop.
Alt+ArrowRight/Left also works outside editable fields and menus.

| Stop and exact action | What to show and say | Toggle moment |
| --- | --- | --- |
| Open `/#scene` | Three attributed figures and existing process. Approximately 85,000 monthly referrals is a subset, not all exceptions. Monthly publication does not prove monthly rule changes. Expand Figure qualification to show the unverified-source caveats. | Stay Off; attribution does not depend on assistance. |
| Click Next to `/#month` | Three assumptions and two tiles. Default Today is 17,000 hours and 630 manual items per operator. Show the public referral-subset qualification; Show the detail holds weights and cohorts. | Switch On: 4,250 displayed hours and 3,780 built-case capacity. Judging stays 2 minutes; abstentions keep all 12 Today minutes. These are not measured savings. |
| Click Next to `/#pipeline` | What exists today and what changes. Show all six stages; existing scanning, capture and pricing remain existing capabilities. | Start Off, then On. Wait for the phase-related evidence preparation; the animation records no decision. |
| Click Next to `/#cases` | Four cases has its own chapter. Show Open case and Follow this item on A-D. | Compare Off pain with On results: A sufficient, B needs a date, C retains 56/84, D abstains. |
| Click Next to `/#two-places` | One agent, two places. Local shared history exists; a shared operational service remains proposed. Follow the same ID rather than imagining two unrelated systems. | Compare On/Off; neither changes a case lifecycle. Finish Off. |
| Click Next to `/pharmacy` | Information missing is the B example. Manual endorsement and Continue with submission remain usable without advice. | Keep Off here; the live round trip below introduces On at a specific human review. |
| Click Next to `/queue` | One six-column table and counted filters; 70,833 operator slots excludes 14,167 modelled pharmacy catches. Click Compare, Run one hour, then Close comparison. | Compare shows projected 5 versus 8 decisions, 60 versus 36 operator minutes and 3 versus 3 cited decisions. Agent changes work presentation, never records the projected decisions. |
| Click Next to `/pharmacy/claims` | Start with Action needed, Waiting on NHSBSA, Paid this month and All; every amount is claimed (synthetic). Open B via Correct and resubmit. | Off shows the raw reason; On shows only an actually approved draft or explicitly says none exists. Use the uninterrupted cycle below to create approval and resubmit. |
| Click Next to `/#close` | Where it ends. Request two years of item-level referral reasons, test concentration, then proceed, reshape or stop. Open assumptions and discovery questions as needed. | Either state; do not present proposals as validated operational facts. |

Back reverses all nine stops, including Pharmacy check. Dismiss tour hides the
rail; **Restore tour** in the footer brings it back. Detail/reflective pages
offer **Start** rather than pretending to be a tour chapter. The skip link
focuses main without changing the selected fragment.

When comparing numbers, distinguish projected referrals from the risk residual:
referrals use deficient shares of built and abstained items; risk includes
every abstention. The referral-free percentage uses the full scenario volume,
not just the residual queue, and is not measured accuracy. Zero volume or
residual means Not established. Monthly assisted effort charges built cases
judging only and abstentions all Today minutes. The capacity tile is built-case
capacity, not mixed throughput; queue Compare uses the same twelve examples
and one elapsed-time allowance per operator. Neither is
measured savings, and the two-second presentation is not work completed.

## Complete round trip: B, manual submission to assisted correction

### Verified chapter 6/7 audience beats

These controls were exercised on the actual live build. The screenshots show
the initial chapter views; the separate walk record proves the stateful actions.

**Chapter 6, NHSBSA perspective.** Begin Off. Point to the counted work filters
and ask which items need an operator. Open a Today model row to show competent
manual work, not an unavailable-service error. Close it, open **Compare** and
click **Run one hour**. Say: "These are assumed capacities, not items we processed. On prepares
evidence; a human still makes the decision." Toggle On and distinguish actual
session rows from illustrative volume; never describe a sweep as recorded work.

**Chapter 7, Pharmacy perspective.** Keep the same session and select the
**Pharmacy** radio in **Perspective**, not Agent. This retains the current URL;
open **Operations > Pharmacy claims** if the other-side guard is showing.
Point first to **Action needed** and open EX-24112.
Show the exact raw Off reason. If no operator-approved draft exists, On must
say so rather than give the raw text a new label. Return to the NHSBSA side
for an explicit review, approve the actual draft and record Refer back. Return
to the same pharmacy item; now On can show the approved note, rule/version
and suggested correction. Checking and applying text do not resubmit it.

**Same-item continuation, no Reset or reload.** Follow EX-24112 from its
submission through operator review, approved referral, pharmacy correction,
explicit resubmission and human re-check. Switch perspective through the
visible controls when the other side is hidden. Keep the ID visible after
every navigation. Before the final sufficient disposition, show that the
resubmitted state still awaits human review. Afterwards compare Off/On and
Both: all retain the same attempts, approval and decisions. The synthetic
paid state belongs to existing pricing; it is not a payment made by the agent.

Use **Both** to show the two operational sides in one tour. Use Pharmacy and
NHSBSA independently to demonstrate audience filtering. A direct link to an
opposite-side page is expected to show a guard, not its operational content.
Change perspective to continue; do not use Reset to get around the guard.
Perspective survives Reset, but Reset would erase the session story.

### Exact-click sequence, same item without Reset

This is a separate uninterrupted session sequence. Leave time to show the
human approval boundary, not just a green end state. Use exact button labels
below; no hidden store edits, test hooks or direct lifecycle manipulation.
Two minutes is a rehearsal target, not a performance budget. Do not omit
human approval or uncertainty to meet a stopwatch.

1. Open **Operations > Pharmacy check**. Click **Reset demo > Reset
   demonstration**. Confirm **Agent: Off**, **Information missing** and the
   endorsement `NCSO  RK`. Show **Not checked: manual submission** and say:
   "No advisory check has been performed. Submission remains available."
2. Select **Pharmacy** in Perspective. Click **Continue with submission**,
   then **View submitted claim**. The
   selected ID is **EX-24112**, status **Submitted, awaiting processing**.
   Expand **History and attempts** in Shared case history.
3. Select **NHSBSA** in Perspective. The URL stays on the pharmacy claim and
   an other-side guard appears. Open **Operations > NHSBSA queue**, locate
   EX-24112 marked **New**, and click **Open for review**. Keep Agent Off to show the manual pack,
   evidence and human choices without an agent proposal.
4. **Toggle On now.** Wait for the assembly presentation to complete. Show
   the missing date, August provision and gate PASS. PASS means a proposed
   Refer back is permitted, not that a payment or referral has been approved.
5. Select **Refer back (as recommended)** if not already selected.
   Tick **Approve this draft for the pharmacy**. Enter
   `Please add the dispensing date beside the initials` in **Reason**.
   Click **Record decision**. Only this human action creates the referral.
6. The decision record proves the recorded referral. Optionally choose
   **July 2026 (2026-07)** in **Replay with** to show the historical rule
   counterfactual. July did not require a date; it does not revise the August
   decision. This optional replay is covered by the separate hosted checklist,
   not V's 22-checkpoint walk.
7. Select **Pharmacy**, open **Operations > Pharmacy claims**, and use
   B's **Correct and resubmit** row action. Show the **Operator-approved note** and
   its approval metadata. Enabling assistance did not approve it; the
   checkbox and recorded decision did. The status is now referred back.
8. Click **Re-check endorsement**, then **Apply suggested correction**.
   The field becomes `NCSO  RK 21/08/26`. Show **Not checked for this edit**.
   Click **Re-check endorsement** again to get **Ready to resubmit**.
   Applying text and validating that new text are deliberately separate.
9. Click **Resubmit claim**. Show **Resubmitted, awaiting re-check**.
   Select **NHSBSA**, open **Operations > NHSBSA queue**, find **EX-24112**
   and click **Open for review**. A new human review is required.
10. The corrected B evidence now supports **Sufficient: release to pricing
    once confirmed**. Leave **Accept (as recommended)** selected, enter
    `Human reviewed the corrected date and complete evidence` in **Reason**,
    and click **Record decision**.
11. Expand **History and attempts** in Shared case history. Show the original
    seed, manual submission and corrected resubmission as separate immutable
    attempts. The latest result did not overwrite the original endorsement
    or the referral's August record.
12. Select **Pharmacy**, open **Operations > Pharmacy claims**, select **All**
    and open B via **View**. Show **Payment approved (synthetic)** and
    the matching ID/history. Say: "This label represents release to existing
    pricing in the synthetic story. No payment was calculated or approved
    here, and the agent did not move the lifecycle."
13. **Toggle Off now**, then select **Both**. The final disposition and
    immutable attempts remain; no decision is undone. Both restores the tour
    and same-item Follow links; single-side views deliberately omit them.

### Separate catch-counter demonstration

Use a fresh session for this comparison, not Reset in the middle of the cycle
above. In Pharmacy perspective, turn On and open Pharmacy claims: **Caught
before submission** begins at 0. Open B and note its seeded history.
Navigate to Pharmacy check, wait for **Information may be missing**, click
**Apply correction**, and wait for **Ready to submit**. There is no receipt.
Return to claims: the count is 1, but B's original state and attempts are
unchanged. The event records advisory evidence, not a submission.

Returning to Pharmacy check restores its local example. Apply the correction
again and wait for ready; this does not double-count the same next attempt.
Now explicitly click **Continue with submission**, then **View submitted
claim**. Only this creates the submission; the caught count stays 1. Select
NHSBSA, open the queue and show the same EX-24112 as **New**,
**Submitted, awaiting review**, with **Open for review**.

### Entirely manual comparison

Reset and repeat steps 1-3 with Agent Off throughout. Choose **Refer back**,
enter the same reason and Record decision. At the pharmacy, type
`NCSO  RK 21/08/26` into **Corrected endorsement**, then **Resubmit claim**.
Select NHSBSA, open the queue and **Open for review**. Choose **Sufficient (human
choice)** explicitly, enter the review reason and record. There is no
Re-check, suggested correction, approved agent draft or counterfactual replay
in this manual comparison. The human still controls the same round trip.
Show **No advisory sufficiency check** as a synthetic manual-work assumption.
It is not a claim that real pharmacy checks are absent. If you turn On before
any approved draft exists, the pharmacy shows **No operator-approved draft**,
not the raw unapproved human reason. Turn Off to inspect the manual reason;
this changes presentation, not history.

### Entirely assisted comparison

Reset, then enable Agent On before the initial submission. Wait for the
precheck, but deliberately submit the missing-date example unchanged to show
advice is non-blocking. Follow steps 2-12, including explicit draft approval.
This is a scenario demonstration, not a recommendation to submit incomplete
real claims.

## The other five behaviours

Use **Operations > NHSBSA queue** and the canonical case links, or open
the exact route below. Case views contains **Operator case pack**,
**Case-building trace** and **Decision and audit record**.

| Case | Exact route and action | Demonstration boundary |
| --- | --- | --- |
| A: complete | `/case/EX-24107`, turn On; inspect pack and trace | Sufficient, PASS, still a human disposition |
| C: conflict | `/case/EX-24119`, turn On; inspect Conflicts and missing evidence | 56 and 84 both remain; no model-selected winning quantity |
| D: abstain | `/case/EX-24123`, turn On; inspect abstention signals and trace | No provision, quality 0.31 below 0.60, only 1/3 agree; gate NOT RUN |
| E: rules-only | `/case/EX-24101`, compare Off/On and open trace | Cleared by deterministic rules, no model call in either state |
| F: already decided | `/case/EX-24088/record`, compare Off/On | DR-000871 is historical; flag changes do not erase it |

To demonstrate a new human decision on a disposed seed, click **Open pharmacy
claim for another attempt**, expand **Demonstration replay**, then click
**Submit another demonstration attempt**. Click **View NHSBSA case**, then
**Start review**. This appends a new revision; it does not edit seed history.

For C, approve the draft and record **Request information** after that new
review. Click **View pharmacy claim**. In **Pharmacy confirmation**, enter
`Please review both values against the synthetic form`, then **Send
confirmation**. Show Resubmitted and both quantities still present. Open the
shared queue for another human review; confirmation did not resolve the conflict.

For D, changing typed text to include a date does not repair the poor source.
The pharmacy's **Unreadable form** scenario still stops at capture and leaves
submission available. Do not promise payment or let the happy path crowd out
this abstention demonstration.

## Reflective close and challenge responses

Open **How it works > Boundary**: identify the agent's evidence work, pure
checks and the human approval. Open **Evaluation**: figures are illustrative,
not measured accuracy. Open **Assumptions**: establish what evidence could
disprove the proposal. **Architecture** shows proposed tool contracts, not
deployed services.

| Challenge | Response |
| --- | --- |
| Why an agent, not just rules? | Code checks known requirements. The proposed agent assembles and interprets uncertain evidence under a versioned provision. This prototype scripts that interpretation. |
| Why not improve capture? | Poor capture remains important: D stops rather than manufacturing evidence. Do not claim real capture is solved. |
| Is the problem large enough? | Validate referral concentration, volume and actual gathering time. The public referral proxy is not the total exception queue or a measured saving. |
| What if interpretation is wrong? | Keep sources, structural signals, abstention and a pure gate visible; a human still decides. No guarantee of model correctness is claimed. |
| How are citations controlled? | The retrieved version and clause are pinned and checked; the agent cannot cite a rule it did not retrieve. |
| What happens without assistance? | Submission and competent manual review remain available; existing human history is unchanged. |
| Who benefits and owns the work? | Pharmacy correction and operator evidence gathering are distinct proposed benefits. Ownership, actual workflow and integration need validation with the service. |
| What would production require? | Validated sources and evaluation, approved operational integration, identity/access, durable records and monitoring, none supplied by this static prototype. |
| What is the first decision? | Obtain item-level referral reasons, agree evidence/stop thresholds and decide whether to proceed, reshape or stop. |

## Rehearsal recovery

If a page fails, record the route and error rather than hiding it with Reset.
Check the production preview is serving `BSA/dist` at `/`. A route reload
re-seeds session state, so restart the round trip instead of claiming continuity.
For no matched claims, choose **All states** or the correct pharmacy; for a
disposed seed, use the explicit new-attempt sequence above.

If short on time, show B's human-approved correction and D's abstention, then
close on the evidence needed for a first test. The successful path alone is
not the governance story.

The [capture index](screens/integrated/README.md) links current visual evidence.
Older tour scripts and screenshots used different routes, thresholds and
hosting assumptions; they are not instructions for this integrated build.
