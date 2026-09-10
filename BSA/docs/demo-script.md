---
title: Demo script and discussion guide
description: Seven timed beats, current controls, discussion questions, challenge answers and recovery guidance for the synthetic prototype.
ms.date: 2026-09-09
---

## Scope and setup

The prototype is a single-page web application with no back end. All case data
is synthetic and held in browser memory. No case data is sent anywhere. Load
the application and its bundled assets before disconnecting; in-session route
navigation works offline, but an offline reload is not guaranteed. No external
services or sign-in are needed for the local demo.

Open this guide beside the application. Presenter mode, its timer and beat
buttons, Discussion mode and the `/notes` page have been removed in phase 1.
Use the existing primary navigation and case-view links instead. There is no
Start or Go to screen control in the current application.

The header retains the product shield and name, the Agent recommendations
on/off switch and Reset demo. Reset demo immediately restores seeded case
states, removes session-created human records, retains DR-000871 and turns
recommendations on. It does not reset pharmacy-local edits or the locally
selected replay version. Restore resets the current pharmacy endorsement.
Reset confirmation is planned for the next PR, not implemented here.

Primary navigation is still Overview, Pharmacy check, Exception queue,
Evaluation, Boundary, Assumptions and Architecture. Grouped navigation and a
dedicated toggle-comparison experience are planned, not current controls.
Header restructuring, baseline modelling and domain-rule changes are outside
this phase.

Keep the synthetic banner and governing principle in view:

> The agent gathers evidence and recommends. Deterministic code validates and
> calculates. A human decides. The prototype does not calculate or approve payments.

## Ten minutes, seven beats

End on the decisions and evidence needed next, not on "any questions?".
Timings are rehearsal guidance, not an application timer.

### Beat 1: NHSBSA, the exception, what is already automated

Time: 0:00 to 1:00. Route: `/`.

Say: One disclosure: this is anchored to a UK public body my employer holds
relationships with, so everything is public and every figure is synthetic
where it says so. NHSBSA pays every community pharmacy in England for about
1.1 billion prescription items a year. It already scans, reads and prices
almost all of them by machine. Around a million a year still go to a person,
because the pharmacy's note does not satisfy a rulebook that changes every month.

Show: Overview, the queue counts and the statement that nothing here prices
or approves a payment. Use Overview in the primary navigation. Distinguish
public framing figures from synthetic operating counts and validate current
public figures before presenting them externally.

### Beat 2: The manual journey, interpretation, not OCR

Time: 1:00 to 2:00. Route: `/queue`.

Say: Here is what an operator does today: find the image, look up the product,
check the claim against the ledger, find this month's rule, judge the note,
send it back with a code. Reading is solved. What is not solved is judging a
free-text note against prose that changed last month, and finding everything first.

Show: Exception queue, its six states and twelve rows. Use the state filters
and All to restore the full queue. Open a case to show the five structural
confidence signals rather than a model-reported percentage. Six filler rows
are not interactive cases. The manual journey is a hypothesis to validate
with operators, not a measured baseline implemented by this prototype.

### Beat 3: The pharmacy pre-submission check

Time: 2:00 to 3:30. Route: `/pharmacy`.

Say: Before the claim leaves the pharmacy, the proposed service checks the
endorsement against the rule for the dispensing date and says exactly what is
missing, while the person who knows the answer is still at the counter.
Advisory: it never blocks a submission. The current typed-field interpretation
is a deterministic mock, not a live model call.

Show: Use Pharmacy check. Information missing is selected initially. Choose
Complete endorsement, Information missing and Unreadable form to show Ready
to submit, Information may be missing and Agent unable to determine.
In Information missing, edit Endorsement entered by the pharmacy to
`NCSO RK 21/08/26`, or use Correct the information to append the dispensing
date. The check reruns automatically; there is no separate re-check button.
Restore returns the original endorsement. Switch Agent available off to
demonstrate local unavailability. Continue with submission stays enabled
and produces only a synthetic submission notice.

### Beat 4: The exception queue and a complete case pack

Time: 3:30 to 6:30. Routes: `/case/EX-24112` and `/case/EX-24112/trace`.

Say: Now the NHSBSA side. This item was initialled but not dated. Watch what
the agent did before the operator opened it: planned the unknowns, gathered
from the sources, retrieved the August clause, judged the note three times,
and a piece of code, not the model, checked that refer back is what the rule
permits. Same outcome as today; one look, not one hunt; and the pharmacy is
told exactly what to add. This is a scripted demonstration of the proposed
workflow, not evidence of measured time savings.

Show: Open EX-24112 from Exception queue. The case pack has REFER BACK,
gate PASS, a missing-date requirement, the proposed fix and its source.
Use Case-building trace in Case views. Replay step by step reveals a step
every 900 ms; Show all and Clear are the other current controls. There is
no trace pause or manual next-step button yet. Return with Operator case pack.

Exercise the human decision: choose Amend, then Record decision with an
empty reason, seven characters and seven characters padded with spaces.
Each is rejected. Enter a meaningful reason of at least eight trimmed
characters and Record decision. The case becomes Human decision recorded
and opens Decision and audit record with the reason and pinned versions.
For a separate recommended-decision run, Reset demo first, return to the pack
and record the preselected Refer back (as recommended).

On the record view, use Replay with and choose July 2026 (2026-07).
The replay becomes SUFFICIENT because July did not require a date. The
historical August record is unchanged. Turn Agent recommendations off to
withhold the replay recommendation, then back on to restore it. This is the
existing switch plus version select, not a dedicated comparison control.
Clear beside Replay with removes the selected replay without altering the record.

### Beat 5: Evidence conflict and the deliberate abstention

Time: 6:30 to 8:00. Routes: `/case/EX-24119` and `/case/EX-24123/trace`.

Say: Two harder ones. Here the form says 56 and the claim says 84; the agent
flags both and refuses to choose. And here, a poor handwritten scan: no
readable margin, no rule matched, three readings that disagree. It abstains
and names what failed. Beside a 99.85 per cent accuracy target, a confident
wrong answer costs more than an honest abstention. Validate that public
target before quoting it; the demo is not an accuracy measurement.

Show: EX-24119 case pack with both quantities and REQUEST INFORMATION.
Use Back to queue to reach EX-24123. Its trace ends through ABSTAIN and
human hand-off. Its pack names three abstention reasons: no provision,
quality 0.31 below 0.60 and only 1 of 3 readings agreeing. Gate is NOT RUN.
These are the three abstention-triggering reasons, not an exhaustive list of
failed confidence signals. Additional failed signals are not a Case D defect.
No guessed rule, hidden conflict or pharmacy draft is substituted.

### Beat 6: Agent, deterministic code, human decision

Time: 8:00 to 9:00. Route: `/boundary`.

Say: Every action is one of four things: something NHSBSA already does,
deterministic code, the agent, or a person. The agent gathers evidence and
recommends. Code validates and calculates. A human decides. Pricing and the
gate are never a model.

Show: Boundary and the classification of every action. The prototype does
not price at all. Also open EX-24101 through Exception queue and choose
Case-building trace: Cleared by rules; agent not invoked. Only pre-check and
hand-off appear, with no agent step.

Turn Agent recommendations off. Queue recommendations disappear, including
filler rows, without changing case states. Packs and traces provide evidence
only; pharmacy guidance is withheld while Continue with submission remains
available. Historical human records are not rewritten. Restore the switch
or use Reset demo before another decision scenario. This demonstrates the
flag-off path, not resilience of a real NHSBSA production service.

### Beat 7: Evaluation, assumptions and the questions to ask next

Time: 9:00 to 10:00. Routes: `/evaluation` and `/assumptions`.

Say: Before this touches live work: shadow mode against operator decisions,
agreement, calibration, abstention, cost per case, per category, and the
accuracy guardrail. Two assumptions decide whether it is worth building at
all, and two weeks of NHSBSA's data would settle them. So what I would want
from you today: access to two years of referral reasons, a named owner for
the accuracy guardrails, and which exception pattern to start with.

Show: Evaluation scoreboard, then The assumptions this tests or Assumptions
in primary navigation. Counts, costs and evaluation scores are illustrative
synthetic values. Handling-time and repeat-referral baselines still need
NHSBSA data. End with a decision to validate, reshape or stop.

## Questions for the first fifteen minutes

Ask these across the table, without assigning questions by job title. Each
validates the problem, tests an assumption, exposes a constraint, establishes
value or moves towards a decision. Screen cues retain the original context;
pack, trace and record refer to their respective case views.

1. Queue or pack: When an item reaches an operator today, where does the time
   actually go: finding the evidence, or making the judgement?
2. Pack or Evaluation: How often would two operators reach the same conclusion
   on the same exception, and where is the reason for a decision recorded today?
3. Pack or trace: How do monthly rule changes reach operators, and what
   currently breaks in that handover?
4. Overview or Evaluation: Which outcome would make this worth pursuing for
   NHSBSA: capacity released, pharmacies paid on time, or being able to explain
   any decision on demand?
5. Overview, Evaluation or record: Which payment-accuracy or assurance measures
   must not move, whatever we build?
6. Trace or Architecture: What information may reach an AI model, and what
   must remain outside it?
7. Pack or queue: Where would the recommendation need to appear so operators
   do not open another system?
8. Pack or Evaluation: What would make operators trust, ignore or actively resist this?
9. Evaluation or Assumptions: What evidence would justify scaling the prototype?
10. Evaluation or Assumptions: What result should cause the work to be reshaped or stopped?
11. Pharmacy: Which endorsement mistakes cause the most preventable referrals,
    and would a check before submission change what pharmacies do?
12. Boundary or Architecture: What must stay as deterministic code, and who
    would own and run this after handover?

## Challenge questions and answers

Use these during the following thirty to forty minutes. Production safeguards
and outcomes are proposals to validate, not evidence established by this demo.

### Why does this need an agent rather than a rules engine

A rules engine handles what is explicit: is a field present, is a value in
range, is a concession listed. It cannot read a handwritten sentence against
a paragraph of prose that changes monthly. The agent's work is recognising
what the note claims, finding the provision for that month, reconciling
sources that disagree, explaining the gap and knowing when to stop.
Everything explicit stays as code: the requirement check, the gate, pricing.

### Why not improve OCR

NHSBSA already reads at high accuracy. Items reach this queue because they
need judgement, not because the read failed. Assumption 1 tests exactly this:
if referral reasons turn out to be mostly illegibility, the answer is
capture, not an agent, and I would say so.

### Is this problem large enough to matter

By share of volume, no: under 0.1 per cent. By where the human effort sits,
it is the whole queue. Each referred-back item is handled by a specialist,
sometimes twice, and paid weeks late. The right denominator is exception
effort, repeat processing and payment delay. The two numbers that size it,
cost per touch and the assembly-versus-judgement split, are NHSBSA's and I ask for both.

### What happens when the model is wrong

It cannot be wrong about a payment: it never prices and never disposes.
A wrong reading is caught three ways: the other two readings disagree and
confidence falls; the gate blocks any outcome the rule does not permit;
and the operator sees the evidence beside the recommendation and overrides.
I monitor the override rate with a floor: a rate near zero means people have
stopped checking.

These are safeguards, not a guarantee that every wrong reading is detected.
Correlated wrong readings and automation bias still need evaluation. No model
is called here, and production monitoring is not built.

### How do you stop the agent inventing a rule

It may only cite a passage that retrieval actually returned, and deterministic
code checks that the cited span exists in the corpus for the version in
force. No retrieved provision, no recommendation: the agent abstains.
Case D shows exactly that path.

### How is confidence measured

Never by asking the model. Five structural signals: was a provision found;
do the three readings agree; do the sources reconcile; is the image above
the quality threshold; is this category within the validated set. Combined
in code and shown to the operator as the signals, not as a bare percentage.
In production the composite is calibrated against operator outcomes.

### What happens if the system is unavailable

The queue runs exactly as today. The agent is read-only against every source,
sits behind a feature flag, and can only add a case pack to an item that is
already in the operator's queue. Nothing it does can block an item. The
flag-off path is exercised deliberately, monthly.

That is the proposed production contract and drill. The current demonstration
verifies its synthetic switch-off path, not a live queue or service outage.

### Why should NHSBSA fund this when some benefit reaches pharmacies

Because the case stands on NHSBSA's own exception cost: operator time,
repeat touches, consistency, a reconstructable record, accuracy held. The
pharmacy benefit, the exact fix sooner and fewer repeat referrals, is real
and is kept separate so it never props up the NHSBSA case.

Validate both benefits; neither is measured by the synthetic demonstration.

### How does this progress from a prototype to a production service

Two weeks with referral data decide whether to build. Then: read-only
integration with capture output and the queue tool inside the existing
accredited environment; the data-protection assessment; the corpus pipeline
with monthly versioning; an evaluation set labelled with operators, run in
CI; shadow mode with no influence on live work; assisted mode only when
agreement, calibration, abstention and override thresholds are met; then
widen by exception pattern.

### What would NHSBSA own after the engagement ends

The versioned corpus and its ingestion pipeline; the evaluation set and
evaluators in their CI; the gate, requirement resolver and pricing tests;
infrastructure as code in their landing zone; the runbook and the monthly
fail-open drill; operators who labelled the set and can challenge the agent.
Stated in the first meeting, not the last.

### Why is this agentic rather than a chatbot

Nobody asks it anything. For each item it decides what it needs to know,
calls read-only tools, reconciles what comes back, judges, cites and stops,
unprompted. The conversational surface for pharmacies is a possible later
phase and is retrieval, not adjudication.

### What did you deliberately not build

Real capture integration, a live queue, authentication, pricing, the pharmacy
dispensing-system integration, monitoring dashboards and the model call
itself. Each is well-understood integration work and none was the risk.
The risk was whether the judgement layer could be made grounded, gated and auditable.

Integration, security and operational delivery still carry risks requiring
customer validation. See the detailed omissions below.

## Startup speed inside a regulated body

Speed comes from testing the highest-risk assumption early, not from skipping
security, evaluation or human oversight. This is a proposed delivery sequence,
not the PR sequence for the interface cleanup.

1. Start with synthetic data and one exception pattern (Done). This prototype.
   NCSO endorsements only; nothing touches a live system.
2. Validate the concentration of exception reasons (Weeks 1 to 2). Two years
   of referral codes at item level. Long tail means stop.
3. Establish operator agreement and baseline handling effort (Weeks 1 to 2).
   Fifty items, two operators, blind; a day of timing split between locating
   evidence and judging.
4. Build a golden evaluation set (Weeks 3 to 4). Around 200 adjudicated cases,
   stratified by category and print versus handwriting, labels agreed with
   operators, harness in CI.
5. Run the agent in shadow mode (Weeks 7 to 10). Recommendations generated on
   the live exception stream with zero influence on outcomes.
6. Compare its recommendations with human decisions (Weeks 7 to 10).
   Agreement against the inter-operator ceiling, per exception category and
   per print or handwritten slice.
7. Measure evidence quality, calibration, abstention, overrides, handling time
   and cost (Weeks 7 to 10). Groundedness must be 100 per cent; calibration
   error within an agreed bound; abstention honest; cost per case within budget.
8. Move to operator-assisted mode only when guardrails are met (Weeks 11 to 13).
   Volunteer operators; payment-accuracy measures in the definition of done;
   override rate above a floor.
9. Scale, reshape or stop based on evidence (Week 14). A documented decision
   and the next exception pattern, or a documented stop.

NHSBSA owns the corpus and ingestion pipeline, evaluation set and CI evaluators,
gate, requirement resolver and pricing tests, infrastructure as code, runbook,
monthly fail-open drill and the ability for operators to challenge the agent.
The demonstration itself never implements pricing.

## Failure points and recovery

### The preview does not load or a screen renders blank

Do not debug live. Switch to a verified recorded run or the one-pager's build
panel and continue verbally. The former notes suggested saying "That is the
fail-open path you are watching; in production the queue runs exactly as it
did before this existed, and nothing is blocked." Do not present a browser
crash as proof of that property. Say instead: "The demo has failed. The intended
production design leaves the existing queue available; this failure does not
verify that design." Demonstrate the working switch-off path separately.

### An interviewer asks to change an input

Use the pharmacy check: edit the endorsement and the check reruns. For the
operator side, use Replay with on the record page to choose a different Tariff
version. Do not promise arbitrary inputs; the cases are constructed.

### Is the abstention hard-coded

Yes, the readings are scripted; the composite and gate are real code. Open
the trace and point at the five signals and the threshold. Production would
replace the scripted readings with three sampled model calls while retaining
the deterministic checks and boundaries. That replacement still needs evaluation.

### Why is the missing date an agent problem when code can check a date

Agree. The date check is code; show its Boundary row. The agent's proposed
part is recognising that the free-text mark is an NCSO claim, finding the
August clause and writing the fix. Offer Case D to show where interpretation
fails and the workflow stops rather than guessing.

### Time overruns before the abstention case

Skip the pharmacy screen. The abstention case and the Boundary page carry
more weight than the pharmacy check.

### A question about NHSBSA's real numbers

Operating counts and evaluation values are synthetic and labelled. Public
context figures are separate, not measurements made by the prototype. Name
the NHSBSA inputs that would replace the illustrative values: cost per touch,
the assembly-versus-judgement split and the second-referral rate.

## Deliberately not built in the static demo

* Real capture integration: the prototype reads pre-annotated regions on synthetic forms.
* A live queue: cases are a fixed synthetic set; nothing here can touch NHSBSA's work.
* The model call: interpretation is scripted for repeatability and no data leaves the browser. Scripted inputs do not guarantee a crash-free UI.
* Pricing: never, by design. The prototype refuses to price or approve payments.
* Application authentication, networking, secrets and lineage: production concerns listed in Architecture. Hosted infrastructure is separate from local app behaviour.
* Pharmacy dispensing-system integration: the pre-submission check is a surface; the supplier API is a later phase.
* Monitoring dashboards and alerting: Evaluation is illustrative.
* Calibrated confidence thresholds: set by hand here, to be calibrated against operator outcomes in shadow mode.
* Durable audit storage: human records are in memory and reset with the demo.

## Archived first-build presenter wording

> [!IMPORTANT]
> Historical wording only, not current click instructions or factual claims
> about NHSBSA performance, operating processes or production safeguards.
> The first-build wording below is retained for preservation, not endorsed.
> In particular, a browser failure does not prove fail-open behaviour, scripted
> inputs do not guarantee a crash-free demo, and offline use requires loaded
> assets. Use the current guidance above to present or recover the demo.

Recovered read-only from `origin/main`, from `WALKTHROUGH`, `FAILURE_POINTS`,
`SETUP_NOTES` and `NOT_BUILT` in the original content module and prose in the
removed notes page. Only passages not already included verbatim above are
repeated. Wording is unchanged apart from line wrapping and replacing any
em dash punctuation with commas. Original timings and routes remain in the
seven beats above; obsolete controls below are historical references only.

### Original walkthrough passages

Beat 1, Show:

> Overview: the queue counts, and the statement that nothing here prices or
> approves a payment.

Beat 2, original title and Show:

> The manual journey: interpretation, not OCR
>
> Queue: the six states, the confidence signals rather than a percentage.

Beat 3, Say and Show:

> Before the claim leaves the pharmacy, the same agent checks the endorsement
> against the rule for today's date and says exactly what is missing, while
> the person who knows the answer is still at the counter. Advisory: it never
> blocks a submission.
>
> Switch scenarios: ready, information missing, unable to determine. Correct
> the endorsement and re-check.

Beat 4, Say and Show:

> Now the NHSBSA side. This item was initialled but not dated. Watch what the
> agent did before the operator opened it: planned three unknowns, gathered
> from four sources, retrieved the August clause, judged the note three times,
> and a piece of code, not the model, checked that refer back is what the rule
> permits. Same outcome as today; one look, not one hunt; and the pharmacy is
> told exactly what to add.
>
> Case pack for EX-24112, then the trace for the same case.

Beat 5, original title and Show:

> Evidence conflict, and the deliberate abstention
>
> EX-24119 case pack; then EX-24123 trace ending in ABSTAIN.

Beat 6, Show:

> Boundary page: the classification of every action.

Beat 7, original title and Show:

> Evaluation, assumptions, and the questions to ask next
>
> Evaluation scoreboard, then the assumptions panel. End on the decisions,
> not on 'any questions?'.

### Original failure and recovery passages

> The preview does not load or a screen renders blank.
>
> Say: 'That is the fail-open path you are watching; in production the queue
> runs exactly as it did before this existed.' Move to the recorded run or
> the one-pager's build panel and continue verbally.

> An interviewer asks to change an input (a different date, a different note).
>
> Use the pharmacy check: edit the endorsement and re-run. For the operator
> side, use the replay under a different Tariff version on the record page.
> Do not promise arbitrary inputs; the cases are constructed.

> 'Isn't the abstention just hard-coded?'
>
> Yes, the readings are scripted; the composite and gate are real code. Open
> the trace and point at the five signals and the threshold. Explain that
> production replaces the scripted readings with three sampled model calls
> and nothing else changes.

> 'Why is the missing date an agent problem? Code can check a date.'
>
> Agree. The date check is code (show it in the boundary row). The agent's
> part was recognising that the free-text mark is an NCSO claim, finding the
> August clause, and writing the fix. Offer Case D as the case that shows
> the difference.

> Time overruns before the abstention case.
>
> Skip the pharmacy screen. The abstention case and the boundary page carry
> more weight than the pharmacy check.

> A question about NHSBSA's real numbers.
>
> Every number on screen is synthetic and labelled. Name the NHSBSA inputs
> that would replace them: cost per touch, the assembly-versus-judgement
> split, the second-referral rate.

### Original setup passages

* The prototype is a single-page web application with no back end. All data is synthetic and held in the browser; nothing is sent anywhere.
* It opens in the app preview from this workspace. No sign-in, no network access and no external services are needed, so it runs offline.
* Demo controls sit in the header: Presenter mode (the timed walkthrough with a 'go to' button per beat), Discussion mode (prompts and challenge cards for the current screen), and the Agent recommendations switch (turning it off shows the fail-open path: evidence only, no recommendation).
* Reset demo returns every case to its starting state and clears the decision records made during the session.
* To rehearse: start Presenter mode on the Overview, press Start, and follow the beats. Each beat's 'Go to' navigates to the right screen and case.

### Original omissions passages

* The model call: the interpretation step is scripted so the demonstration cannot fail live and no data leaves the browser.
* Pricing: never, by design. The prototype refuses to price.
* Authentication, networking, secrets and lineage: production concerns, listed in the architecture view.
* Pharmacy dispensing-system integration: the pre-submission check is shown as a surface; the supplier API is a later phase.
* Monitoring dashboards and alerting: the evaluation page is illustrative.
* Calibrated confidence thresholds: set by hand here; calibrated against operator outcomes in shadow mode.

### Original notes-page prose

Page introduction:

> The ten-minute walkthrough, the questions and challenge cards for the
> discussion, the delivery approach, what could go wrong in the room and
> how to recover, and how to run the prototype.

Walkthrough description:

> End on the decisions and the evidence needed next, not on 'any questions?'.

Live-failure callout:

> "That is the fail-open path you are watching. In production the queue runs
> exactly as it did before this existed, and nothing is blocked." Switch to
> the recorded run or continue from the one-pager's build panel. Do not debug live.

Discussion heading and description:

> What to ask in the first fifteen minutes after the demonstration
>
> As they would be asked across a table. Each validates the problem, tests
> an assumption, exposes a constraint, establishes value or moves towards
> a decision.

Challenge-card description:

> Likely challenges in the thirty to forty minutes, with a concise,
> defensible answer.

Ownership paragraph:

> What NHSBSA owns at the end: the versioned corpus and its ingestion
> pipeline; the evaluation set and evaluators in their CI; the gate,
> requirement resolver and pricing tests; infrastructure as code in their
> landing zone; the runbook and the monthly fail-open drill; operators who
> labelled the set and can challenge the agent.
