---
title: Durable project facts
description: Read first at each task; correct facts in place rather than appending history.
ms.date: 2026-09-15
---

## EPS error evidence

Verified 2026-09-15: Um IS, Clough A, Tan ECK. *Dispensing error rates in
pharmacy: a systematic review and meta-analysis.* Research in Social and
Administrative Pharmacy. 2024;20(1):1-9.
DOI <https://doi.org/10.1016/j.sapharm.2023.10.003>.
The primary indexed abstract/bibliography at
<https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=37848350&retmode=xml>
confirms 62 studies, pooled prevalence 1.6% (95% CI 1.2-2.1) and database
search January 2010-September 2023. The proposed 39/44/34 error-type study
counts and ranking remain unverified; do not display them as established
facts. The abstract's 44 refers to hospital-setting studies.
Label exactly: "study on dispensing errors, used to make the scenario
realistic; not an NHSBSA claim statistic". It is not an NHSBSA claim rate.

Verified 2026-09-15: NHSBSA, *Endorsing correctly in EPS: actual medicinal
product pack*, n.d.,
<https://www.nhsbsa.nhs.uk/endorsing-correctly-eps-actual-medicinal-product-pack>.
Opening paragraph and **Reimbursement**, paragraphs 1-2, support incorrect-
endorsement referrals/delays and automatic processing when the selected AMPP
has a dm+d price. Short quote: "what you have endorsed and not what you have
supplied". Label exactly: "public, NHSBSA". Preserve that conditional context;
do not invent a Tariff clause for the proposed strength reconciliation.
LEARNINGS records acquisition limitations and the bibliographic details.

Task 39's synthetic source is prescribed and actually supplied Amlodipine
10mg tablets, 28, with 5mg/28 selected in the claim. The actual supply record
does not come from the selected claim. Apply corrects only its code/name from
corroborated source records, never submits or decides. An editable 1% assumed
share over total submitted claims may estimate pre-pricing mismatch catches;
it is separate from the study rate and the referral-loop calculation.
This W domain handoff is not live completion; G integrates the canonical
four-case model before the consuming streams and live verification.

Current C5 authority: operator and pharmacy views may show prescribed and
selected source facts, but the exact proposed corrected pack and preview
appear only in the pharmacy's "your agent's suggestion from your records"
card. Operator advice and outbound notes name the field/rule with no proposed
value. The full Off wrong-strength cycle first prices the endorsed pack and
then uses a real explicit human audit/query reopening; toggling never discovers
or reopens the mismatch.

The pure `epsStrengthForAudience` adapter enforces the proposed-value split
without changing the source assessment: operator `suggestion` is always null;
pharmacy proposals retain the exact own-records caption. G integrates it into
the shared recommendation projection; views must not bypass it by rendering
the raw assessment's proposal on the operator side.

## Purpose and principle

Current scope is Tasks 25-40: a desktop-only eleven-step demonstration, explicit
operator/pharmacy action panels, a persistent followed item and two verification
gates. Verify at 1280 and 1440 px; capture new screenshots at 1440 px only.
The owner explicitly removed mobile/tablet layouts, navigation and test/capture
coverage. The 15 September Parts A-C addition explicitly authorises the new
wrong-strength and paper-incomplete cases and supersedes older case, header,
referral and re-check contracts below. Decision authority and Live first remain.

## Vision

This is a proof of concept showing the art of the possible with agentic AI on one real problem at NHSBSA, presented as a Forward Deployed Engineer would show it to stakeholders: the problem first, then the outcome, with the audience watching the change rather than being told about it.

The header toggle is the story. Off is Today: what NHSBSA and the pharmacy have now. On is With the agent: the same step, solved. Every step shows both, side by side.
Both perspective is the guided walkthrough: the problem in numbers (over 100 million items a month; most priced with no person; roughly four per cent touched by staff; 85,000 a month referred back), what they have now, what they are trying to achieve, then the agentic outcome step by step.
Wherever the agent is On and the item is not automatic, a case is built, the agent advises, and one button acts on the advice: at the pharmacy, Apply suggested correction then Send or Resubmit; at NHSBSA, Apply suggestion then Release to pricing or Refer back. The agent never presses the final button.
The cycle is live and shared: submit from the pharmacy and the item reaches NHSBSA; EPS satisfied at both gates is released to existing pricing with no operator action and the pharmacy sees Paid on the normal schedule (the agent pays nothing); paper always needs the operator's release press. Not satisfied means NHSBSA is notified, the operator opens a case with image where applicable, extracted fields, evidence and recommendation, prepares a decision or refers back, and the pharmacy sees exactly why. Following a case shows the same item at every point; switching perspective shows exactly what that side sees, without Reset.
Four real cases only, playable end to end and re-playable; everything else is labelled background.

The four required playable examples are synthetic: complete EPS `EX-24107`,
wrong-strength EPS `SYN-FQ123-MISMATCH`, unreadable paper with a declaration
`EX-24123`, and paper with an incomplete endorsement `EX-24112`. The last case
uses a missing brand/manufacturer for a generic with several suppliers, with
NCSO correctly initialled and dated. All underlying scenario, image,
declaration and claim dates are correct. A missing-date headline is retired;
initialled-and-dated remains a Tariff requirement check, not a headline case.
C and F are fixed unclickable background; E's rule-only behaviour is
illustrated within complete EPS Today. No fifth playable case is introduced.
Historic six-case records and domain regression evidence are not rewritten.
The latest four-case instruction supersedes the earlier four- and ten-item sets.
Paid means the existing pricing path and normal schedule, not a payment performed
or approved by this prototype. Failed gates never imply automatic completion.
ALIGNMENT distinguishes these requirements from what is actually on main and
live; a published model or interface contract is not deployed acceptance.

For the wrong-strength example, the prescription and independent supply record
are Amlodipine 10mg tablets, 28; the selected EPS pack is 5mg tablets, 28.
Today can price the known selected pack automatically as endorsed, with no
processing-team review; discovery needs a later audit or query. With the agent,
Gate 1 names the strength mismatch and the pharmacy's card proposes the actual
10mg pack with an exact preview. If sent uncorrected, Gate 2 prevents automatic
release. Keep "this is the proof the agent does not rubber-stamp" on the step.
No proposed price or payment calculation is invented when changing the pack.

The eleven-step order remains. The former readable-paper step becomes the
unreadable paper's pharmacy declaration/submission; the next step shows that
same item's NHSBSA capture/confirmation. These are two distinct human hand-offs,
not a fifth scenario or two copies of one panel.
Task 37 adds the separate How it works reference page: panels under 60 words
there only, with built/proposed/assumption labels. Vendor names are permitted
only in its single "Reference mapping, one example" table; all other interface
copy stays capability-based. ALIGNMENT tracks drift against actual main and
in-flight commits; a contract decision alone is not deployed acceptance.

### Header and footer

Part A removes the global synthetic notice bar, its collapse control and its
presentation state. "All data is synthetic" appears once in the footer, small
and muted; factual per-item synthetic-source labels remain.
Replace the old global principle bar with the following exact line only when
Agent is On:

> Outcome: the agent gathers evidence and recommends. Deterministic code validates and calculates. A person decides.

It is one line directly below the header, identical on every route, perspective
and demo step, with its bounding-box centre within 2 CSS pixels of the content
column centre at 1280 and 1440 px. Off removes the line and reserved space.
Use toggle fading and reduced-motion crossfade without clipping, tiny text or
another Agent control. These requirements supersede the older global notice.

### Recommendation always visible and concrete

The latest addition extends Tasks 25-37; it does not replace their safeguards.
Every Agent-On item view shows an expanded Recommendation card with the
dispensing-date clause/version, requirement results, missing facts, concrete
suggestions and exact corrected previews, outcome and five confidence signals.
The card says "the agent verifies and advises; a person decides".
Complete items say what is complete and that nothing needs adding. A missing
provision or unknown value is disclosed, never fabricated. Non-item reference,
pipeline and monthly screens do not invent a selected prescription.

Preview and Apply use one shared, source-bound patch. Correct dates come from the
dispensing date; manufacturer, pack and form suggestions cite actual product
evidence. An unknown invoice price remains a required human input with a
placeholder, not a value inferred from the claim or an invented invoice.
Applying a suggestion remains distinct from sending, resubmitting or deciding.
The exact proposed value and corrected preview are pharmacy-only, labelled
"your agent's suggestion from your records". The NHSBSA card and outbound note
name the field, rule and request for accurate information, never the proposed
correct value. Factual as-submitted, prescribed, supplied, scan and extraction
evidence is not redacted or replaced by that note-wording restriction.

The unreadable-paper demonstration has explicit scanner-preview and complete/
missing-declaration preparation controls. They prepare a synthetic draft, never
silently send it or rewrite the original scan. Post remains available when
advice is incomplete; unreadable paper always needs an actual operator release.
Type 1 confirms or corrects declared evidence, then Type 2 takes the final action.
Disagreement stays visible: safe Refer back/Request information advice must not
turn abstention into verified agreement or permit release. Only a separate
human decision can approve a communication or change disposition.

All four cases must show each successful business action on both sides within
one second, with the same item, exact reason/answer, and truthful last event.
The Follow controls preserve the ongoing case without Reset. Timed browser
assertions must measure the actual action and destination view, not a timeout
started after an arbitrary sleep. The expanded requirements are recorded in
ALIGNMENT and verified on the latest deployed main before completion.

## Decision authority

1. For any question about how to implement, interpret, name, lay out, order, style, test, or resolve a conflict between two instructions, choose the option that best fits these tie-breakers, in this order, and continue without asking: (a) keeps the governing principle intact (the agent gathers evidence and recommends; deterministic code validates and calculates; a human decides; nothing here calculates or approves a payment); (b) keeps the six case outcomes and the two-gate rule intact; (c) makes the difference between Today and With the agent more visible to a first-time viewer; (d) is simpler and faster to build; (e) matches the most recent instruction over an older one. Record the choice in docs/DECISIONS.md in one line: the question, the option chosen, the tie-breaker that decided it.
2. Ask me only if: (i) a decision would change the governing principle or one of the six case outcomes; (ii) an action needs a credential, permission or payment only I hold (an Azure or GitHub setting, a token, billing); or (iii) an instruction I gave says in so many words "check with me before" or "double check". Nothing else qualifies. If unsure whether a question qualifies, it does not; decide and record.
3. When you post a question that does qualify, post it as STATUS with the exact steps or the exact choice, and keep every other stream building while you wait. Never pause a stream that is not blocked by that question.
4. Default answers for questions that have already come up, so they are never asked again: naming and labels, use the words in docs/MEMORY.md "Words that must and must not appear" and the lifecycle label table; layout, desktop only at 1280 and 1440 px, side by side Today left and With the agent right; copy, under 25 words per panel, UK English, no em dashes; figures, every With figure tagged "estimate", every assumption editable and tagged; time model, the defaults in Task 28; ordering, the eleven demo steps in Task 31; scope, if a request is ambiguous build the smaller version that still shows the Today versus With difference and log the larger version as a follow-up issue; tests, keep only the blocking checks (npm run check, Vitest, crash and dead-control and six-outcome Playwright, axe) and make everything else informational; data, one pharmacy, Hillcrest, other pharmacies as unclickable background; motion, two-second sequence with reduced-motion crossfade; anything about mobile or tablet, out of scope, do not build or test.

## Live first, local backup

STANDING RULE: LIVE IS THE PRODUCT, LOCAL IS A BACKUP THAT MUST MATCH IT EXACTLY

1. LIVE ALWAYS REFLECTS THE LATEST COMPLETED WORK. Every merge to main deploys to the live web app automatically. A task is not complete until its commit is on main, the deployment is green, and the change has been seen on the live URL. STATUS for any completed task includes the live URL and the commit hash it now serves. If the deployment fails, fixing it is the first priority of the stream that merged; nothing else is marked complete until the live site is back in step with main. Add a post-deploy check to the workflow that opens the root page and one deep link and fails loudly if the served build's commit hash does not match main.
2. THE REPOSITORY IS ALWAYS UP TO DATE. No work sits only in a session or a working tree. Every stream pushes its branch at least every thirty minutes of activity and at every STATUS. docs/PROGRESS.md, docs/SCOPE.md, docs/ALIGNMENT.md, docs/DECISIONS.md and docs/LEARNINGS.md are updated in the same commit as the change they describe, never afterwards.
3. THE LOCAL BACKUP IS AN EXACT COPY OF LIVE, NOT A SEPARATE VERSION. Nothing is developed locally that is not on main. Provide one command, npm run backup, that produces a self-contained folder containing: the production build of the current main (built with the same base path and settings as live), a copy of docs/, the four playable cases' seed data, and a one-line README with the commit hash, the build time and the live URL. Provide npm run backup:serve that serves that folder locally at the same routes as live, with the same deep-link fallback, so the demo can be run offline exactly as it runs online. Add a CI job on every push to main that builds the backup folder, compares its file list and content hashes against the deployed build, and fails if they differ. Record in docs/DECISIONS.md: "Live is the product; local is a backup built from the same commit; any difference is a defect."
4. RECOVERY IN UNDER TEN MINUTES. docs/DEPLOYMENT.md gains a "Backup and recovery" section: how to produce the backup, how to run it offline, how to redeploy main to the web app by hand from the Actions tab, and how to recreate the web app from infra if it is ever lost. Test the offline backup once now on a clean machine or container and record the result in docs/LEARNINGS.md.
5. STATE AT THE END. When ALL DONE is posted, it includes: the live URL and the main commit hash it serves; confirmation the deployment check passed; the backup command run on that same commit with its hash; and the line "live and backup are identical".

Published working branches remain incomplete work, not an alternative product
or an offline release. Only the current main artifact verified on the live URL
may be packaged or described as the local backup. CI instrumentation and retained
failed diagnostic artifacts are not backups or completion evidence.
This rule applies to G, D, O, P, F, S, U, R and V and supersedes older
candidate-first/local-release instructions. It does not alter Decision authority,
the clinical/payment boundary, source provenance or protected rollback refs.

## Words that must and must not appear

Required interface wording: "released to existing pricing, no operator action";
"priced by NHSBSA's existing rules engine, no person involved";
"the agent verifies and advises; a person decides";
"applied by the operator from the agent's suggestion";
"declared by the pharmacy, not read from the form"; "rule and reason recorded";
"experience only"; and "estimate" on every With figure.
The no-operator phrases apply only to actual automatic paths, never human releases.
Do not use "approved by the agent", "paid by the agent", implementation vendor,
product or documentary names, or em dashes. Task 37 permits concrete services
only in its single labelled reference-mapping table. Required process names and
synthetic prescription content remain permitted, as recorded in DECISIONS.

## EPS error evidence

Um IS, Clough A, Tan ECK. *Dispensing error rates in pharmacy: a systematic
review and meta-analysis*. Research in Social and Administrative Pharmacy
2024;20(1):1-9. DOI: https://doi.org/10.1016/j.sapharm.2023.10.003;
PubMed: https://pubmed.ncbi.nlm.nih.gov/37848350/.
Stream W verified the original abstract's 62 studies, search from January 2010
to September 2023, and pooled dispensing-error prevalence of 1.6 per cent
(95 per cent CI 1.2 to 2.1). Required label:
"study on dispensing errors, used to make the scenario realistic; not an NHSBSA claim statistic".
The owner's supplied subtype counts (wrong strength 39, wrong medication 44,
wrong quantity 34) and ranking remain pending independent full-text verification;
the abstract's 44 hospital studies do not verify the wrong-medication count.
Do not present an unverified subtype claim as independently verified evidence.

NHSBSA, *Endorsing correctly in EPS: actual medicinal product pack*:
https://www.nhsbsa.nhs.uk/endorsing-correctly-eps-actual-medicinal-product-pack.
W verified its public explanation that an endorsed pack with a dm+d price can
be processed automatically without processing-team review and reimbursed as
endorsed rather than as supplied, including an incorrect pick-list selection.
Use its verified short quotation with the label "public, NHSBSA".
This supports the synthetic mechanism, not an NHSBSA error prevalence estimate.

The separate optional pack/strength-mismatch assumption defaults to one per
cent of total submitted claim volume, not the 85,000 referral subset and not
the study's 1.6 per cent. Its With row is labelled estimate and is non-additive
to the existing referral model until overlap is defined. Existing cohort and
297.5-hour defaults remain unchanged.

## Current desktop contracts

Gate 1 checks typed EPS or declared paper against the dispensing-month provision.
Gate 2 independently reconciles what arrived with source evidence and the claim.
Assisted EPS requires both passing and reconciled for automatic
`released_to_pricing`. Paper never takes that automatic release path.
Unreadable or mismatched source evidence still needs people. The header selects
the proposal for a human-initiated attempt; toggling never rewrites old release
history. The user explicitly approved distinct labels for human releases:
"no operator action" applies only to code-only verification, never an actual
operator Release button. No release here calculates or approves a payment.
The owner also explicitly approved Off human release after the existing
deterministic checks and explicit human judgement; both proposed gates remain
`none`. Today EPS automatic pricing follows the known selected priced pack,
without claiming the proposed gates passed or detected a strength mismatch.
An explicit later audit/query, not navigation or toggling, can reopen that item.

One store also holds revision-bound operator and pharmacy drafts, current
`itemVerification`, and presentation-only `demoStep`. `DEMO_STEPS` is the frozen
eleven-step sequence. Apply buttons fill drafts and append human-attributed
history; Release, referral, information request and resubmission remain
separate explicit controls. Navigation preserves the step, toggle and followed
item without executing business actions. F replaces Switch side with explicit
Pharmacy view and NHSBSA view; hidden sides temporarily use Both with disclosure.

Tasks 25-30 are historical, not completely accepted: their repaired runtime
`34d7567` passed 30 hosted checks, but final independent visual review remained
unverified after an interrupted review and image-delivery limitation.
Unmerged records are retained through prior V branch commit `3461d57`.
New desktop scope does not retroactively mark those images or reviews passed.
Old mobile screenshots are removed from the active tree by explicit request;
Git history and protected refs preserve their provenance.

Tasks 19-24
completed on main `887d2a4f76d49f1793665aa5068a45abd99ba6aa`: 955 unique
units, 1,186 ordinary plus 32 state checks, and 20/20 final hosted checks.
Final release proof is issue #73 comment 5654511835. Its original failed and
repaired evidence remains immutable. The earlier release-step wording below
is historical, not unfinished work to restart.

Only Hillcrest Pharmacy (FQ123) owns operational items. Other pharmacies are
unclickable, labelled queue background, outside the store and item counts.
Tasks 25-30 use the frozen `EpsPrescription`, `PaperDeclaration` and
`ManualLoopMonthInputs`/`ManualLoopMonthResult` contracts. Current DECISIONS
records the approved cohort denominators and explicit authority boundaries.
The user selected 297.5 total With operator hours at defaults: 255 judging
plus 42.5 manual gathering on abstentions. Do not headline 255 as the total.
The 85,000 manual loop is a referral subset, not all NHSBSA staff work.
The 80% prevention and 70% clearance rates are assumptions, not measured results.
Five per cent abstention applies after prevention and clearance. Every With
figure says estimate; old monthly defaults below become historical comparisons.
EPS has no unreadable image or Type 1 path. Paper declarations are proposed,
declared-not-read evidence; explicit human confirmation remains necessary.

Tasks 25-30 integrate on the accepted `887d2a4` release. N #81, C #83,
U #82, E #84, Q #85 and V #86 merged through initial runtime `b05b06a`;
review repair #87 is deployed at `34d7567`.
PROGRESS owns exact source/CI/hosted evidence. The historical
`1327e65` visual failure and repaired `d5832e0` 43-image review stay immutable.
Infrastructure remains frozen. Both initial and repaired runtimes passed their
separate 30-check hosted runs, each with 60 clean identities, 58 images and
26 zero-violation axe audits. Independent review failed the original image/prose
gate; that report, capture set and manual record stay immutable. Repair #87
corrects source wording, cumulative prose, capture obstruction and mobile focus
without changing domain outcomes or historical records. Independent review of
the new `34d7567` capture remained unverified. That historical release checklist
is superseded by the current desktop acceptance, not retrospectively passed.
Do not infer acceptance from CI.

## Process model

### Task 40 fidelity, scanner and corrected recheck contract

The latest Part C contract supersedes the older manual-EPS-recheck rule below.
NHSBSA displays the exact last pharmacy submission read-only under **As submitted
by the pharmacy**. EPS retains every sent message field; paper retains the typed
declaration and its revision-pinned synthetic scan. Human capture is separate
derived evidence and never edits that submission. Only an explicit pharmacy
resubmission supplies a new corrected revision.

Paper's three columns are **Pharmacy's declaration (as typed)**, **Scan as the
high-speed scanner sees it**, and **Extracted by character recognition
(hypothetical)**. Per-field extraction values/confidence carry **synthetic;
illustrates what NHSBSA's capture would produce**. Unreadable capture requires
Type 1 confirmation before Type 2. Matching fields do not replace deterministic
Tariff checks. Any scanned-paper release still requires the operator's press.

Outbound NHSBSA notes name the field and rule and request accuracy, never the
proposed corrected value. Exact source facts remain visible as evidence.
Concrete correction/preview belongs only in the pharmacy's own suggestion card.
Manual as well as generated outbound notes are checked at the final action;
unsafe text produces a clear error, never a silent rewrite.

Corrected resubmission requires **I confirm the corrected information is
accurate**, bound to the current revision and exact corrected payload in both
toggle modes. Off uses manual corrections, not hidden assistance. Editing or
Apply invalidates acknowledgement. Satisfied corrected EPS proceeds to existing
pricing without an operator; satisfied corrected paper is ready for one human
Release. Every submission, referral reason, acknowledgement, resubmission and
release remains append-only with its actual human or code actor.

These are required contracts, not claims that the old runtime or live site
already satisfies them. G owns canonical integration and historical seed states;
the screen owners adopt the shared contracts before V's exact live verification.
### Tasks 39-40: fidelity, scanner evidence and re-check release

These are the latest required contracts; ALIGNMENT records implementation and
live-verification gaps rather than assuming they are already deployed.

- The operator's "As submitted by the pharmacy" block is a read-only exact
  replica of the last submission object. EPS includes all fields actually sent;
  paper includes the exact typed declaration and its scan. NHSBSA capture and
  interpretation are separate evidence, never edits to that submission.
- Paper always reaches NHSBSA. "Declaration complete" and "Declaration missing
  information" prepare a full declaration or two missing non-date fields.
  They never Post implicitly. Post remains enabled despite incomplete advice;
  its receipt explains scanning and the required operator press.
- Paper evidence is shown in three labelled columns: "Pharmacy's declaration
  (as typed)", "Scan as the high-speed scanner sees it", and "Extracted by
  character recognition (hypothetical)". Per-field recognition values and
  confidence are labelled "synthetic; illustrates what NHSBSA's capture would
  produce". Unknown OCR is uncertainty, not an invented incorrect source date.
- Unreadable capture requires Type 1 confirmation before Type 2. Preserve the
  raw scan/OCR and label separate human-confirmed effective evidence; do not
  describe an unreadable source as independently machine-reconciled.
  Readable high-confidence blanks are missing requirements, not unreadability.
- NHSBSA referral notes name a field, cite its rule and request accuracy, never
  give the proposed correct value. For the chosen paper case: "Brand or
  manufacturer required for a generic with more than one supplier; please
  state the product supplied". Pharmacy suggestions come from pharmacy records
  independently of whether NHSBSA used an agent-authored note.
- Referred pharmacy items show that note, the pharmacy's own concrete suggestion
  and preview, Apply, and "I confirm the corrected information is accurate".
  This acknowledgement is required in both modes, bound to the revision and
  complete correction payload, and invalidated by any later edit or Apply.
  Off uses manual correction, not a hidden agent action.
- A resubmission creates a new immutable pharmacy source revision and triggers
  a real re-check. Compatible EPS is released automatically to existing pricing;
  compatible paper is "Resubmitted, ready to release" until the operator presses
  Release once. Prefilled decision fields are not a decision.
- A corrected paper revision may contain an explicitly labelled synthetic
  acknowledged pharmacy amendment. It does not rewrite an earlier unreadable
  scan, recycle an old capture as a new human action, or claim that old OCR read
  newly supplied information.
- An Off wrong-strength item first follows Today automatic pricing as endorsed.
  A real, explicitly recorded later audit/query can reopen it for the requested
  correction cycle; toggling or navigation cannot manufacture that discovery.
- Both and single perspectives use the same actual state and Follow history.
  Pharmacy Paid, Action needed and Waiting on NHSBSA tiles show simultaneous
  plausible states from truthful seeded history and subsequent store actions,
  not Reset or narrative navigation. Human actions and code releases have
  distinct, accurate actors; no payment is calculated or approved here.

The owner's 13 September process brief supersedes the earlier referral-only
workload model for Tasks 19-24. Treat the following supplied public figures as
fixed project context, not as a claim of fresh external source verification:

- NHSBSA processes over 100 million items monthly: about 91% EPS claim messages
  with dm+d codes and typed endorsements, and 9% scanned paper/character recognition.
- Straightforward items flow to existing rules-engine pricing without a person.
  Staff do not approve every item; about 4% receive a staff touch.
- Type 1 captures handwritten/low-confidence products, about 2.2 million items
  monthly and roughly 880 per hour. After human capture, code routes again.
- Type 2 handles endorsement interpretation, extra fees and finalisation,
  about 2 million monthly, 260-300 per hour, roughly 12-14 seconds per item.
- About 85,000 items monthly remain insufficient and are referred back.
  Reasons include missing brand/manufacturer, pack size, price, presentation
  (RB2B, especially handwritten forms) and incomplete NCSO endorsements.
- Pharmacies receive referrals in MYS, Unpaid items, with an NHSmail email;
  they complete the endorsement and resubmit. Only that item's payment is
  delayed; unpaid items expire after 18 months.
- July 2026 had about 194,000 unpaid items awaiting action, roughly GBP 1.55m,
  around GBP 150 per pharmacy. Payment context is 80% advance and a balance
  when priced. The demo calculates or approves no payment.

The code outcomes include `auto_priced`, `type1_capture`, `type2_endorsement`
and `referred_back`; channels are `eps` or `paper`. Automatic items appear in
automated counts/records, never as operator work rows. The latest four-case,
audit, acknowledgement and re-check contracts above supersede the older
case-specific routing rules. Unreconciled evidence still prevents verified
automatic release. Never present declared fields as read from a poor image.

## One state

There is one authoritative application store, one header Agent switch and one
Pharmacy/NHSBSA/Both perspective switch. Perspective is never an input to routing,
arithmetic, submission, capture confirmation, decisions or history. Identical
actions in Both and switched perspectives must produce identical domain state.
Timestamps/IDs are controlled in the equivalence tests, not erased from proof.

Pharmacy receipt and queue presentation modules are adapters over the same store
or component-local presentation, not additional operational stores.
No view may duplicate lifecycle,
revision or routing state. Local focus/disclosure/playback is not domain state.
Agent actions never change lifecycle. Code may route/price automatically; humans
explicitly submit, confirm Type 1 capture, judge Type 2 and approve a referral note.
Reset restores seeds and Agent Off, retaining perspective. No page-local Agent
override may return. Apply shared model changes first, then every consuming view.

On 13 September the owner explicitly created annotated `lkg-2026-09-13`
(**Last known good after Tasks 14 to 18**) and advanced `last-known-good`
to that pre-change main `80d955b`. Existing tags and `cowork-v1` remain unchanged.
Do not advance the rollback branch again without explicit owner instruction.

The Prescription Exception Case Builder is a static, offline React 19 and
TypeScript demonstration using synthetic prescriptions, pharmacies and tariff
clauses. No backend, real patient data, runtime services or payment calculation.
The agent gathers evidence and recommends. Deterministic code validates and
calculates. A human decides. The prototype does not calculate or approve payments.

The problem is evidence gathering for uncertain prescription endorsements under
a versioned rulebook. Approximately 85,000 monthly referrals represent a subset,
not total exceptions. Public figures are attributed, not independently verified.
One agent in two places is a proposal: pharmacy advice before submission and
NHSBSA evidence assembly after an exception. Neither is a live model service.

## Fixed vocabulary

* Boundary classes: existing, deterministic, agent, human
* Agent phases: PLAN, GATHER, RETRIEVE, RECONCILE, ASSESS, CHECK, RECOMMEND,
  ABSTAIN, HAND_OFF
* Recommendations: SUFFICIENT, REFER_BACK, REQUEST_INFORMATION, ABSTAIN, NONE
* Case states: cleared_by_rules, agent_review_complete, operator_review_required,
  additional_evidence_required, agent_abstained, human_decision_recorded
* Human decisions: ACCEPT, AMEND, REQUEST_INFORMATION, REFER_BACK, ESCALATE
* Confidence signals: provision found, sample agreement, reconciliation,
  image quality, evaluation coverage; never model self-confidence
* Gate: PASS, FAIL, NOT_RUN; pure code validates citation, mandatory fields,
  recommendation requirements and conflicts. No recommendation means NOT_RUN.
  FAIL withholds recommendation and draft. Image threshold 0.60; agreement 2/3.
* Monthly model: 100 million is a conservative calculation baseline for the
  supplied "over 100 million" figure. EPS/paper partition the total; Type 1
  and Type 2 can overlap within the approximately 4% staff-touch cohort.
  The separate manual loop starts with 85,000 referrals. Sequential assumptions
  are 80% prevented, 70% code-clearance of the remainder and 5% abstention of
  the remaining queue: 68,000 prevented, 11,900 cleared, 5,100 queued, 255
  abstained and 4,845 built. All queued items are assumed still referred back.
  Today gathering/judging is 10/3 minutes, with a second three-minute judgement
  on 25% of items: 19,479.166666... operator hours. With total is 297.5 hours,
  including 255 judging and 42.5 manual gathering on abstentions. Pharmacy MYS
  completion at six minutes is separately 8,500 versus 510 hours. All rates
  and handling times are assumptions; 85,000 is public referral context, not
  all staff work. `monthModel(ManualLoopMonthInputs)` and `useManualLoopMonth`
  supply current figures from one store. Render hours with `formatProcessHours`
  and items with `formatProcessItems`; round displayed values, not underlying
  hours. Earlier process/12-minute models remain historical calculations only.
* Routing: `auto_priced` means no person was involved in that revision.
  Human-completed Type 1/Type 2 work retains its staff route with
  `requiresHuman: false`; do not misclassify it as an untouched automatic item.
  Generic legacy submissions preserve the recorded channel. Only explicit
  channel-bearing submissions change it. Seed channels derive from the claim
  message rather than contradictory legacy display text.
  Corrected referrals require an actual re-check, including after escalation
  or a further information request. A compatible EPS re-check can release by
  code; paper still requires the operator's press. Do not turn a pending
  re-check into untouched pricing or erase the earlier human referral.
  New EPS draft previews use a prospective submission revision, never old
  capture, recheck or human-paid evidence.
* Lifecycle contracts: submitted, in_review, information_requested,
  referred_back, resubmitted, paid, escalated. Distinct from existing case states.
  The four current Hillcrest items cover the requested cycle. Submitted and Escalated
  remain supported states created through explicit actions, not extra seed rows.
  F's original decision remains alongside its later human-confirmed correction.
  Paid is synthetic, attributed to existing pricing.

## Historical six-case contract

This table records the earlier contract, not the active Tasks 39-40 scenario
set. The owner explicitly replaced its date-headline and re-check outcomes
above. Preserve old Git evidence without displaying it as a current scenario.

| Case | ID | Fixed behaviour |
| --- | --- | --- |
| A | EX-24107 | Complete endorsement; existing rules-engine pricing without operator involvement |
| B | EX-24112 | Initialled, not dated; August refer back; July sufficient |
| C | EX-24119 | Quantity conflict surfaced, request information |
| D | EX-24123 | Poor paper image remains unreadable. Manual capture continues to Type 2; a compatible, explicitly reconciled declaration can build a proposed case. Unreconciled evidence abstains; missing mandatory evidence withholds the recommendation |
| E | EX-24101 | Cleared by deterministic rules without a model call |
| F | EX-24088 | Already decided; historical record preserved |

Scenario edits must clone data, never change these fixtures or gate semantics.
The agent never changes a lifecycle state. Human-approved drafts are labelled
as such and optional: a human may record their own reason without using a draft.
Code performs ordinary automatic routing/pricing attribution; humans explicitly
confirm capture and record decisions. No agent approval, referral or payment.
Complete non-D manual capture can route on matching confirmed facts without
claiming a pharmacy declaration was reconciled. D and declaration-based trust
keep their stricter reconciliation checks. Original pharmacy attempts are never
enriched after submission; capture evidence is appended to revision-linked history.

## Presentation and storage

The following earlier responsive/tour details are historical. Tasks 31-36
replace the chapter rail with an eleven-step desktop strip and remove
small-screen layouts. The single operational store and authority boundaries
continue to apply; current desktop widths and contracts above take precedence.

Header has Pharmacy/NHSBSA/Both immediately before Agent. Navigation and cross-side
links are filtered by perspective; the same pages and operational store remain.
Both is the default and the only perspective with the tour rail. Hidden deep
links offer a perspective switch, not an error. The header stays one row at
normal 360-1920 widths and wraps at narrower widths or enlarged text, with
measured focus/scroll clearance. Default and confirmed Reset are Agent Off.
Reset restores seeded data, assumptions and local controls but retains perspective.
Agent On/Off is controlled only by the top-right header switch. No page may call
`setAgentEnabled` or keep its own assistance override. The queue toggle and
pharmacy's local availability switch are removed; pharmacy checks use the header
state directly. On-only actions are conditionally shown by that state. The
read-only Compare projection never toggles assistance or changes lifecycle.
The current staff worklist excludes automatic rows, separates Type 1 capture
from Type 2 judgement and retains completed human work under Decided.
Perspective hides an already-open form using `hidden` and `inert`, preserving
unsaved fields without a second operational store. Explicit guard restoration
returns focus to the selected view's contextual heading.
`pharmacyCorrections` records validated missing-to-ready evidence after a human
applies a correction; it never submits or changes lifecycle/history. It is
session-only, cleared by Reset, and distinct from whole-scenario projections.
Use stable Zustand slices; derive arrays with useMemo or useShallow.

Copy uses UK English, no em dashes, and no implementation vendor/product or
document names in the interface, including Architecture. The owner's latest
Part D instruction supersedes the former Architecture exception. Use
presentation-only capability aliases; retain original source mappings, tool
contracts, payloads and decision history. NHSBSA, MYS, NHSmail, EPS, dm+d and
Drug Tariff remain valid process names. Narrative panels are under 25 words;
structured labels are not a hiding place for prose. One Sources line in chapter
one; documentary audit stays outside the client. Synthetic operational citations
remain visible. Keyboard, focus, contrast, reduced motion and non-colour status
are requirements. Shared two-second animation is presentation, not processing.

## Public repository and current state

Initial functional release: `1327e65fffeafebf43df1b1b566c6e4152452b46`.
Exact N candidate `f7d9039` passed check, 923 unique units, 1,186 ordinary
browser tests and 21 instrumented state-equivalence tests in four CI shards.
V then ran the complete 32-case exact-state suite locally and 20 real hosted
checks against clean `1327e65`, without an observer in the deployed build.
Hosted evidence includes 41 metadata-paired screenshots (18 Off/23 On) plus
two separately identified perspective-helper screenshots (one Off/one On),
43 images in total (19 Off/24 On), and 24 axe audits
(10 Off/14 On), zero violations and 19 incomplete audits requiring judgement.
These captures are primarily Both perspective; they are not a static matrix
of every route in all perspectives. Header route checks and per-action state
equivalence cover those requirements separately.

The first 43-image review failed D/E content truthfulness despite zero axe
violations. Repair #80 at `d5832e0` passed 943 units, 1,186 ordinary browser
tests and 21 instrumented cases, then deployment 34765809076. Missing or
unconfirmed comparison evidence is Not established, never green agreement
inferred from no conflicts. In-review history is labelled Awaiting operator,
not automatically Case built. Automatic trace closing says no agent/person is
involved; human paths remain distinct. Claim filters use an accessible group.
New repaired captures and review are separate evidence; never erase the failure.
The repaired run has 40 clean before/after identities, 43 reviewed images
(19 Off/24 On) and 24 axe audits (10 Off/14 On), zero violations. Sixteen
contrast incomplete audits covering 121 nodes remain manual-review caveats;
there are no remaining prohibited-ARIA incomplete results. The novice/content
review passed with no blocker, not as a participant study or WCAG certification.
Thirty-two exact-state scenarios passed coherently with no production observer.
The minor "1 items" wording is retained as a non-blocking KNOWN-ISSUES entry.
No blocking application issue is deferred; final release evidence follows #79.

Each final documentation merge changes the build identity. Its latest-main
deployment and full hosted checklist must pass again before ALL DONE; earlier
capture images and test artifacts must not be relabelled as later source.

### Retained public and prior-release decisions

Transfer is not proceeding: the enterprise identity is an Enterprise Managed
User and cannot join or own this external repository. Owner remains WilliamNg18.
The repository is public for Actions capacity. Any later visibility change
requires a fresh explicit owner instruction; this task changes none. Actions
billing/entitlements belong to the repository owner.
The owner has explicitly authorised all streams to resume from HANDOVER.

Reference documents are public by the owner's decision and remain committed.
Use the reference material directly for the aim, problem and outcomes while
preserving attribution and uncertainty. Naming documents in working docs and
code comments is allowed; document names remain prohibited in the website UI.
No deletion or history rewrite was performed. Secret scanning and push
protection are enabled, `.env*` is ignored, and no actionable credential was
found in the recorded local tree/reachable-history scan. Deployment uses the
existing site-scoped OIDC identity; no SWA token or publish-profile action remains.

The accepted Tasks 14-18 release is `80d955bdde6a7ef4e59ceb720d9c9a654efbe5e3`,
after N #64, P #66, Q #67, X #65 and V #63. Exact final-main CI 34720652232
passed check, 774 unique units and 1,086 blocking browsers across four shards
(272/272/271/271), zero quarantine. Main OIDC 34720652234 succeeded.
The coordinator's actual live run passed 14/14 checks, 28 clean identities
and seven axe audits (three Off/four On), zero violations. It includes the
same-item perspective round trip Off then On without Reset. V separately
at the preceding identical runtime `c0203fc`
captured/reviewed 18 states (14 content/four guards), with 18 zero-violation axe
audits; 13 retain incomplete rules requiring judgement. Nine novice clarity
points and 22 walk checkpoints passed, including the live caught-item counter
and explicit submission boundary. Its first selector-failed walk is retained.
Final latest-main verification completed after V's documentation merge.
The header-only Agent follow-up verifies its own deployment; no later build
is silently attributed to these results. No application issue IDs were deferred.

### Historical foundation and provenance

Git root contains the nested application `BSA`. Application main at transfer freeze was
`98c888184db1df9c03539413b5e3b1db47f1ebfe`; annotated
`checkpoint-2026-09-12` pins the main handover/tracking commit. Stream tags
and full branch heads are listed in [HANDOVER](HANDOVER.md).

Tasks 1-13 are Done against the accepted application and hosted evidence in
PROGRESS. Scope is 18 Done; the separately maintained PARITY record owns its
final hosted row. Documentation merge and latest-commit deployment recheck
remain coordinator release steps, not a claim that this unmerged revision is live.
Eight chapters/nine stops,
full referral-cycle guide, queue Compare, scene count-in, healthy manual
pharmacy status and S's CSP/focus/motion fixes are merged. R's approved-only
On reasons and manual-resubmission pain fixes merged through PR #33 at
`898cda594d0dcb34376bddab7112edcddb172440`. V's final PR #24 merged at
`be623ab507e871c27e0889e7db6e64a8595ad10b` without changing runtime source.
The original source-pinned manifest at `898cda5` contains 107 reviewed captures/audits:
53 Off and 54 On, all with zero axe violations, overflow and browser/CSP errors.
Its 51 audits with incomplete rules still require human judgement; automated
checks are not complete manual WCAG certification.

Historical main after route-opacity repair #42, quarantine removal #40 and scoped
V refresh #43 is `c687a9eab181b02f4fca0eb667e8ab8f94468620`, with application
source `82c18e49e7d1c765e5392b1bec5c028c8f89fd16`. Only the route opacity fade
was removed to repair intermediate-frame contrast; slide/focus/motion guards
remain. V reproduced 64 settled route images byte-identically (32 Off/32 On):
64 fresh axe reports have zero violations/errors/overflow; 39 retain incomplete
rules. The other 43 stateful images were not rerun. Original 107-image provenance
is unchanged; do not describe all 107 as fresh evidence for the repaired runtime.

Overview has eight chapters/nine stops, including separate Pipeline and Four
cases chapters and cross-page Queue/Claims stops. Operations includes Pharmacy
check, Pharmacy claims/detail and Exception queue; case pack, trace and decision
record preserve all six canonical outcomes. Follow and Switch side retain the
same item. Pharmacy On reasons are operator-approved drafts, labelled as such;
the original history and raw Off comparison are preserved.

The existing Azure App Service F1 in Sweden Central is the owner-selected
hosting target (issue #48 supersedes SWA). Production and local browser tests
use `/`. Root `hosting.config.json`, a portable static server and Git build-info
are emitted into BSA/dist. PM2 runs the server to preserve strict headers;
built-in PM2 serve lacks those headers. Main/manual OIDC deployment uses the
configured five repository variables; no deployment credential in the bundle.
F1 has no slots; PRs get CI/artifacts, not live previews. The
project has no byte/performance budgets. Gzip size, word counts, Lighthouse and
screenshot differences are informational; typecheck, lint, build, units,
crash/control/six-outcome tests and axe block.
The pre-redesign records base was `d1f0bddc736ccec6b9ddbf9836c24188e7c954df`, after recovery
#54 and live evidence #55. Public CI 34705318318 passed at exact head
`8bee3f205d29178177a6fb1ef5e98394c7655d2c`: check, 695 unique units/26 files
(repeated by each shard, not 2,780 unique tests), and 1,055 blocking browsers
partitioned 264/264/264/263, zero quarantine. Observed verdict: 6m25s.
Older 607/1,054 and 1,019-plus-three counts remain historical.
Do not infer CI-wide axe/CSP artifact totals from V's scoped reports.
The coordinator measured the actual deployed seven-file ZIP at clean
`d1f0bddc736ccec6b9ddbf9836c24188e7c954df` (build UTC
`2026-09-12T16:44:36.023Z`): 209,062 bytes, Python independent-resource
`gzip.compress(mtime=0)` default level 9, informational. It is not a rebuild
or a fixed total for later commit metadata; PROGRESS records all seven values.
Historical frontend capture-build evidence is in docs/screens/route-opacity-parity: 203,721 bytes
across all four independently gzipped resources using the original Python
method (previously 203,723). The separately recorded Node level-9 variant is
203,964 bytes; never mix compressor methods. All sizes are informational,
with no budget.

Live URL: https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/.
The clean `b813c6241cc084957a30c6bf48fdd65f623f33f6` artifact passed 13/13 live
checks and 26 matching before/after identities; six actual axe audits
(three Off/three On) had zero violations. A separate unchanged mixed-mode
test passed on the same item/history, four attempts and three human decisions.
Main OIDC 34704994346 and manual OIDC 34705843955 succeeded at `b813c62`;
main 34705915808 succeeded at `d1fbe85`. Durable evidence is in
docs/live-verification and the linked recovery record in INFRA-DONE.
The old SWA token/resource actions are superseded by #48, not outstanding.
No PR live preview is promised on F1. #34 is closed after
removal of all three quarantine tags and the all-blocking pass; #41 is closed
after the route-opacity repair and 32 new frame cases. #35 is closed as not reproduced: its axe error occurred
during timeout teardown after slow navigation, with no actionable axe defect
established. Historical evidence is retained; the unchanged blocking test passed.

Preserve the owner-promoted `last-known-good` at `lkg-2026-09-13`, and never
move existing tags or `cowork-v1`; see
[branch policy](../../BRANCHES.md) and [current branch record](BRANCHES.md).

Read AGENTS first, then this file, DECISIONS, LEARNINGS, PROGRESS, SCOPE and
HANDOVER. N/Q/P/X/V are merged. Changes land through coordinator-serialised
validation; explicit owner requests may authorise direct main commits.
Current acceptance is in PROGRESS; checkpoint sections
in HANDOVER remain historical and all checkpoint tags stay immutable.
Old issue text mentioning size budgets or transfer waiting is superseded by
the current gates and the owner's public-repository resumption.

## Blockers and status

If anything blocks, stops, or needs an action only the owner can take, post it in the chat immediately as a STATUS message with the exact steps, without waiting for the next scheduled update. Never let a blocker sit silently. Every STATUS message includes an 'Owner actions for me' line, or 'none'. ALL DONE is posted only when every task, every scope row and the live-site verification are complete.

Monitor the selected App Service deployment and Actions without printing
credentials. Do not race coordinator local deployment with the main workflow.
OIDC identifiers are repository variables, not a SWA deployment token.
Verify actual build-info commit, root/deep links and strict headers after deploy.
Completed streams remain delivered; do not invent work or rerun accepted tests
merely to describe them as busy.

Latest owner direction: use `bsa-bsa-demo-r2j2l3dxhtohy` in `rg-bsa-bsa-demo`,
subscription `8b02c7be-06b9-4d15-a916-eba62a775f02`. Azure login works; the
coordinator created the deployment identity, main-branch federation, site-only
Website Contributor grant and five GitHub variables. Owner actions for setup:
none. The current strict-header application has actual 20-check hosted acceptance
at clean `1327e65`; earlier `c0203fc` and `b813c62` evidence remains source-pinned. DEPLOYMENT records
startup and commit verification; coordinator owns Azure mutations and the
fresh latest-commit check after each new deployment.

## How changes land

Use one issue per functional change, with explicit file ownership. Branch from
current main, implement the change, run `npm run verify` from `BSA`, and open a
pull request. PR #47 delivered the same entry point for local and four-shard CI,
with an observed successful verdict in 7m45s. Shards must collectively cover
every blocking test; this hosting migration does not alter them.

The App Service workflow deploys main/manual builds using OIDC. F1 has no
deployment slots; PR build artifacts are not live previews. Merge when blocking
checks are green; main deploys automatically, followed by a STATUS message with
the verified live URL and commit. Target issue-to-live time for a small change
is under one hour, not a correctness waiver or a CI timeout gate.

Infrastructure is complete and frozen. No stream spends time on hosting, gates or tooling from here; all effort goes to the application.

This declaration covers the owner-selected App Service scope. INFRA-DONE.md
records actual main/manual OIDC, live checks, CI/setup/artifact
evidence and 82.08-second non-destructive Incremental configuration reapplication
with unchanged tags and post-apply live checks. This is not deleted-resource
disaster recovery, a future availability guarantee or permission to skip release
verification. Final ALL DONE remains the coordinator's post-merge/latest-deploy
and fresh-URL verdict.
Revisit hosting only for an explicit owner decision or functional
requirement, with a decision record; do not weaken the strict CSP for speculation
about future features.