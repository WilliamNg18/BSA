---
title: Demo script and discussion guide
description: Exact-click seven-chapter story and a complete human-controlled pharmacy round trip.
ms.date: 2026-09-11
---

## Prepare the demonstration

Use the root-path production build, not the development server:

```powershell
Set-Location BSA
npm run check
npm run preview -- --host localhost --port 4193 --strictPort
```

Open `http://localhost:4193/` at 1440px. Keep this guide beside the application.
There is no presenter timer, Discussion mode or `/notes` route. A hosted URL is
not available: no subscription was selected and no deployment token exists.
Use [DEPLOYMENT.md](DEPLOYMENT.md) for owner-run Azure Static Web Apps setup,
not a historical hosting address.

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

The single-row header contains Overview, Operations, How it works, Agent and
Reset. Under Operations are Pharmacy check, Pharmacy claims and NHSBSA
queue. Under How it works are Evaluation, Boundary, Assumptions and Architecture.
At narrow widths use **Open navigation**.

## Tour: seven chapters, eight stops

Use the rail's **Next** and **Back**, not old presenter beats. The chapter
selector has seven entries. Pharmacy check is chapter 4's additional stop.
Alt+ArrowRight/Left also works outside editable fields and menus.

| Stop and exact action | What to show and say | Toggle moment |
| --- | --- | --- |
| Open `/#scene` | Three attributed figures and existing process. Approximately 85,000 monthly referrals is a subset, not all exceptions. Monthly publication does not prove monthly rule changes. Expand Figure qualification to show the unverified-source caveats. | Stay Off; attribution does not depend on assistance. |
| Click Next to `/#month` | A month of work. Expand assumptions and change an input; Today represents competent manual work, not a broken service. Gathering and judging durations are assumptions, not measured savings. | Switch On to reveal the assisted comparison, then Off to show unchanged inputs and manual baseline. |
| Click Next to `/#cases` | The pipeline's six stages precede A-D evidence examples. Existing scanning, capture and pricing remain existing capabilities. | Start Off, then On. Wait for presentation to finish; B needs a date, C retains 56/84, D abstains. |
| Click Next to `/#two-places` | One agent, two places. Local shared history exists; a shared operational service remains proposed. Follow the same ID rather than imagining two unrelated systems. | Compare On/Off; neither changes a case lifecycle. Finish Off. |
| Click Next to `/pharmacy` | Information missing is the B example. Manual endorsement and Continue with submission remain usable without advice. | Keep Off here; the live round trip below introduces On at a specific human review. |
| Click Next to `/queue` | Pinned cases, manual evidence work and a bounded synthetic virtual month. Today on a metadata-only row opens manual tasks, not a fabricated case. Close it before continuing. | On enables Run agent on visible rows; Step sweep/Cancel sweep affect projection only. Return Off. |
| Click Next to `/pharmacy/claims` | What the pharmacy sees. Change Pharmacy (synthetic) and Claim state; totals are matching claimed amounts, not payments. Open a claim and expand History and attempts. | Compare Off/On; pharmacy lifecycle labels and existing history stay the same. |
| Click Next to `/#close` | The first test. Request two years of item-level referral reasons, test concentration, then proceed, reshape or stop. Open assumptions and discovery questions as needed. | Either state; do not present proposals as validated operational facts. |

Back reverses all eight stops, including Pharmacy check. Dismiss tour hides the
rail; **Restore tour** in the footer brings it back. Detail/reflective pages
offer **Start** rather than pretending to be a tour chapter. The skip link
focuses main without changing the selected fragment.

When comparing numbers, distinguish projected referrals from the risk residual:
referrals use deficient shares of built and abstained items; risk includes
every abstention. The referral-free percentage uses the full scenario volume,
not just the residual queue, and is not measured accuracy. Zero volume or
residual means Not established. The monthly calculator holds judging hours
constant; the queue day instead projects one operator's capacity. Neither is
measured savings, and the two-second presentation is not work completed.

## Complete round trip: B, manual submission to assisted correction

This is a separate uninterrupted session sequence. Leave time to show the
human approval boundary, not just a green end state. Use exact button labels
below; no hidden store edits, test hooks or direct lifecycle manipulation.

1. Open **Operations > Pharmacy check**. Click **Reset demo > Reset
   demonstration**. Confirm **Agent: Off**, **Information missing** and the
   endorsement `NCSO  RK`. Say: "No advisory check has been performed."
2. Click **Continue with submission**, then **View submitted claim**. The
   selected ID is **EX-24112**, status **Submitted, awaiting processing**.
   In **Shared case history**, click **Follow this case**. The Followed item
   banner now keeps EX-24112 across sides.
3. Click **Switch side: NHSBSA**. Note that navigation alone did not start a
   review. Click **Start review**. Keep Agent Off to show the manual pack,
   evidence and human choices without an agent proposal.
4. **Toggle On now.** Wait for the assembly presentation to complete. Show
   the missing date, August provision and gate PASS. PASS means a proposed
   Refer back is permitted, not that a payment or referral has been approved.
5. Select **Refer back (as recommended)** if not already selected.
   Tick **Approve this draft for the pharmacy**. Enter
   `Please add the dispensing date beside the initials` in **Reason**.
   Click **Record decision**. Only this human action creates the referral.
6. On the decision record, choose **July 2026 (2026-07)** in **Replay with**.
   Show **Sufficient**: July did not require a date. The recorded August
   referral and original evidence are unchanged. Do not describe this as
   revising a decision or approving payment.
7. Click **Switch side: Pharmacy**. Show the **Operator-approved note** and
   its approval metadata. Enabling assistance did not approve it; the
   checkbox and recorded decision did. The status is now referred back.
8. Click **Re-check endorsement**, then **Apply suggested correction**.
   The field becomes `NCSO  RK 21/08/26`. Show **Not checked for this edit**.
   Click **Re-check endorsement** again to get **Ready to resubmit**.
   Applying text and validating that new text are deliberately separate.
9. Click **Resubmit claim**. Show **Resubmitted, awaiting re-check**.
   Click **Open shared queue**, find **EX-24112** in the shared session queue,
   and click its **Open for review** button. A new human review is required.
10. The corrected B evidence now supports **Sufficient: release to pricing
    once confirmed**. Leave **Accept (as recommended)** selected, enter
    `Human reviewed the corrected date and complete evidence` in **Reason**,
    and click **Record decision**.
11. Expand **History and attempts** in Shared case history. Show the original
    seed, manual submission and corrected resubmission as separate immutable
    attempts. The latest result did not overwrite the original endorsement
    or the referral's August record.
12. Click **Switch side: Pharmacy**. Show **Payment approved (synthetic)** and
    the matching ID/history. Say: "This label represents release to existing
    pricing in the synthetic story. No payment was calculated or approved
    here, and the agent did not move the lifecycle."
13. **Toggle Off now.** The final disposition and human history remain.
    Assisted fields disappear; no decision is undone. Stop following with
    **Stop following this case** when finished.

### Entirely manual comparison

Reset and repeat steps 1-3 with Agent Off throughout. Choose **Refer back**,
enter the same reason and Record decision. At the pharmacy, type
`NCSO  RK 21/08/26` into **Corrected endorsement**, then **Resubmit claim**.
Open the shared queue and **Open for review**. Choose **Sufficient (human
choice)** explicitly, enter the review reason and record. There is no
Re-check, suggested correction, approved agent draft or counterfactual replay
in this manual comparison. The human still controls the same round trip.

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
