---
title: Pharmacy-first process demonstration
description: EPS pricing, human endorsement judgement, proposed paper capture and one shared referral history.
ms.date: 2026-09-13
---

## Prepare and identify the build

This script targets the integrated Tasks 19-24 interface. Earlier accepted
walks in [FIRST-TIME-VIEWER](FIRST-TIME-VIEWER.md) and
[live-verification](live-verification/README.md) remain historical evidence,
not proof that the new process has been accepted live.

For a strict-header local rehearsal:

```powershell
Set-Location BSA
npm run check
$env:PLAYWRIGHT_PORT = "4193"
node scripts\serve-production.mjs
```

Open `http://localhost:4193/pharmacy`. For a hosted demonstration, use the
coordinator-approved deployment at
https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/pharmacy and verify
`/build-info.json`: exact expected commit and `dirty: false`.
Never treat an instrumented test artifact as the deployed application.

Select **Both**, then **Reset demo > Reset demonstration**. Confirm the sole
header switch says **Agent: Off**. Open **Operations > Pharmacy check**.
Reset retains perspective and route; it discards session work. Do not reload
or Reset during a same-item cycle.

Say: "All prescriptions, people, declarations and rule text here are synthetic.
Interpretation is scripted. Existing code prices complete items; the agent
verifies the submission and advises; a person decides when judgement is needed.
No payment is calculated or approved by this demonstration."

Perspective only changes what is shown. Selecting **Pharmacy** or **NHSBSA**
retains the current URL and hides the other side until you navigate or switch
back. **Both** also exposes the guided tour and Follow/Switch side controls.
The Agent switch changes assistance, not evidence, approval or history.

## 1. Begin at the pharmacy: a complete EPS item needs no operator

1. Choose **Complete endorsement**, then explicitly select **EPS**.
2. Leave Agent Off. Show **Not checked: manual submission** and click
   **Continue with submission**, then **View submitted claim**.
3. Show EX-24107 and **Paid on the normal schedule (synthetic)**, attributed
   to the existing rules engine with no person involved.
4. Open **Operations > NHSBSA queue**. A and E are not staff worklist items.
   The automatic monthly total is a projection, separate from actual work.

Say: "EPS is a typed message, not a scanned form. No one needs to capture or
approve this complete item. Turning the agent on is not what makes it payable."
To compare On, use a separate explicit submission; do not invent a human
approval step or relabel an existing automatic event.

## 2. An incomplete EPS endorsement needs Type 2 judgement

1. Open **Pharmacy check**, choose **Information missing**, and keep **EPS**.
   With Agent Off, the endorsement is `NCSO  RK`; submission remains available.
2. Click **Continue with submission > View submitted claim**. Keep EX-24112
   visible and inspect **History and attempts**. This is a new submission,
   not an edit to B's historical referred-back seed.
3. Switch to **NHSBSA**, open **NHSBSA queue**, click **Open EX-24112**, then
   **Start review**. Opening the item alone is not a review or decision.
4. Show the manual evidence and human choices. Turn Agent On in the header.
   Show the dated provision, missing dispensing date, evidence and code gate.
   Gate PASS permits advice; it does not approve a referral or payment.
5. Select **Refer back**, choose **SYN-NCSO** in **RB code (required)** and
   enter `Please add the dispensing date beside the initials` as the reason.
   A reason requires at least eight non-padding characters.
6. To demonstrate an approved generated note, explicitly tick
   **Approve this draft for the pharmacy**, then **Record decision**.
   Alternatively leave it unchecked: your reason and RB code still create a
   valid human referral, but no operator-approved generated note is invented.
7. On the record, replay **2026-07** and **2026-08**. July is sufficient;
   August refers back. The original evidence, recorded August rule and human
   decision remain unchanged. Replay never creates another decision.

Say: "The Type 2 stream averages roughly 12-14 seconds per item in the supplied
public context. The four-minute investigation assumption applies to the
referred-back subset, not every Type 2 item. A built case is not necessarily
faster than a straightforward item."

## 3. Follow that same referral back to the pharmacy

1. Switch to **Pharmacy**, open **Pharmacy claims** and click
   **Correct and resubmit EX-24112**.
2. Show the actual RB code and human response. On shows an operator-approved
   note only if the checkbox was explicitly approved when recording it.
   Off shows the human reason; switching modes neither approves nor erases it.
3. With an approved note, click **Re-check endorsement**, then
   **Apply suggested correction**. Otherwise type
   `NCSO  RK 21/08/26` into **Corrected endorsement** yourself.
   Editing or checking alone does not send the claim.
4. Click **Resubmit claim**. Complete EPS now reaches
   **Paid on the normal schedule (synthetic)** immediately through existing
   routing. There is no second operator approval.
5. Inspect **History and attempts**: seed, initial submission and corrected
   resubmission remain separate. The referral, its reason and any explicitly
   approved note remain intact. The now-automatic item is not in the staff queue.

Repeat the cycle entirely Off to show a manual human reason and correction.
The corrected EPS result is still automatic; do not add an unnecessary
"Accept" step merely because assistance was off.

Public process context: referrals appear in **MYS Unpaid items**, with an
**NHSmail** notification; the pharmacy has 18 months to complete and resubmit.
Only the affected item's payment is delayed. The supplied payment context is
80% advance and balance when priced. This application sends no notification
and performs no payment operation; illustrated delays are not measured timings.

### Separate prevention demonstration

In a separate submission, turn On and choose **Information missing**.
Click **Apply fix**. The typed date and recorded catch evidence change, but
there is no receipt until **Continue with submission** is clicked.
**Caught before submission** counts a checked human-applied correction once
per attempt, not a projected saving or an agent-created submission.

## 4. Unreadable paper requires Type 1 capture before Type 2

1. Open **Pharmacy check**, choose **Unreadable form** and verify **Paper**.
   With Agent Off, all declaration fields are genuinely blank. Submit without
   pretending the poor image contains known fields.
2. Open **NHSBSA queue**. D is in **Type 1 capture lane**, not Type 2.
   A person keys what can actually be read; leave unknown fields blank.
   The confirmation is an explicit human action, not a model reading.
3. Click **Confirm capture and continue to Type 2**. This appends capture
   evidence, not a Type 2 decision. The original attempt and image remain.
4. Open EX-24123, choose **Refer back**, explicitly select **RB2B**, and give
   a human reason requesting the missing product presentation. Record it.
5. Return to D's pharmacy claim and show the referral. For this synthetic
   example, fill the paper declaration with product `SYN-COCOD-100`, quantity
   `100`, prescriber `Dr Demo (synthetic)` and endorsement `NCSO AB 27/08/26`.
   Click **Resubmit claim**.
6. The new paper revision requires fresh capture. The old capture and referral
   remain in history; neither silently confirms the new declaration.

### Proposed confirmation, not invented handwriting recognition

Turn On and open that new Type 1 item. The prior pharmacy declaration may be
prefilled beside the unchanged poor image, labelled **declared by the pharmacy,
not read from the form**. Without a declaration, the fields remain blank.

Try confirming without reconciliation: it must be rejected. Inspect and
explicitly tick **I have reconciled the declaration with the paper**, then
confirm. Editing a field clears reconciliation and requires it again.
Compatible human-confirmed fields can support a built Type 2 case; uncertain
or conflicting fields still withhold advice. A missing prescriber fails the
mandatory compliance gate, even if other fields support interpretation.

The seed image stays quality 0.31, below 0.60, with only one of three readings
agreeing. Do not claim the image was repaired or successfully read.
If a person subsequently accepts sufficient evidence, the resulting item
remains identifiable as human-decided work under **Decided**, unlike A/E's
no-human automatic path.

## 5. Keep conflict, code-only clearance and history visible

| Case | Show | Boundary |
| --- | --- | --- |
| C, EX-24119 | A new demonstration attempt, explicit review, Request information and pharmacy confirmation | Form quantity 56 and ledger quantity 84 both survive; confirmation returns to human review, not automatic resolution |
| E, EX-24101 | Deterministic clearance trace | Existing code only, no agent call or approval |
| F, EX-24088 | Record DR-000871, Off/On and rule replay | Historical human record and original rule remain unchanged |
| B, EX-24112 | July/August replay of the recorded referral | Counterfactual rule comparison, not retrospective mutation |

For a disposed seed, use **Open pharmacy claim for another attempt**,
**Demonstration replay > Submit another demonstration attempt**, then return
to the case and **Start review** where required. Paper replay explicitly names
the retained declaration rather than substituting the old scan reading.
Replay creates a revision, never capture confirmation.

## 6. Put the process and proposed benefits in context

Use **Overview > Choose tour chapter** after the operational story.
The eight chapters/nine stops are still navigable with Next/Back or
Alt+ArrowRight/Left outside fields and menus. Pharmacy check is chapter 5's
additional stop; Pharmacy claims is chapter 7.

Show the supplied context: over 100 million monthly items, approximately
91% EPS / 9% paper, roughly 2.2 million Type 1 and 2 million Type 2 items,
and about 85,000 monthly referrals. These are attributed owner-supplied public
figures, not independently measured operational data.

Chapter 2 displays **Today** and **With the agent** together. Change a shared
input and show the same scenario in the scene, queue and pharmacy projection.
Distinguish projections from recorded session counts. Type 1 and Type 2 can
overlap; do not add their populations or labour twice. The 13-second Type 2
average, four-minute referral investigation and six-minute pharmacy completion
describe different work. Confirmation/keying and built-case durations are
editable assumptions, not measured savings or universal speed-ups.

Describe the proposed agent in three places: checking typed pharmacy
submissions before sending; helping a person confirm a supplied paper
declaration; and assembling Type 2 endorsement evidence for human judgement.
The session shares one operational state; real organisational integration,
durable storage and notification services remain proposed.

## Close with evidence and stop criteria

Open **Boundary**, **Evaluation**, **Assumptions** and **Architecture** as
needed. Architecture uses provider-neutral capability labels and read-only
tool contracts, not a claim that a production stack is deployed.

Ask whether referral concentration and actual evidence-gathering effort justify
this intervention, whether deterministic rules or a pre-fetched screen would
suffice, and what evidence would make the team proceed, reshape or stop.
Measure pharmacy rework separately from operator labour; do not count a handling
reduction again as independent capacity savings. Source documents and caveats
remain in the [reference register](../data/reference/source-audit.ts), not in
interface branding or invented citations.

If a control fails, retain the route, build identity and error. Do not Reset
to hide it. If a claims table is empty, select the correct pharmacy and **All**.
Reload loses the session; restart the story rather than claiming continuity.
Current screenshots and novice-review evidence must identify the final tested
build. The older [capture index](screens/integrated/README.md) is historical
unless explicitly revalidated for this process.
