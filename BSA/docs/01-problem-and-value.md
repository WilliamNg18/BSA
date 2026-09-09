---
title: Problem and value
description: Synthetic NCSO exception investigation experiment and business-case evidence.
---

## Governing boundary

All examples and experimental results are synthetic. All customer context comes from public sources or the supplied brief, not internal NHSBSA data. This is not a claim about NHSBSA performance.

The agent gathers evidence and recommends. Deterministic code validates and calculates non-payment checks. A human decides. Nothing in this MVP calculates or approves a payment.

## CFO perspective

NHSBSA already reads and prices prescriptions at enormous scale. The opportunity is not to replace that automation. It is to reduce the effort needed to investigate exceptional endorsements and avoid preventable repeat referrals that delay pharmacy payment. We do not know operator cost, handling time or the avoidable share of referrals. This experiment measures evidence-assembly time, decision time and recommendation quality before claiming savings. Scale only if measured time saved exceeds operating cost without weakening the human decision or payment-accuracy guardrails.

## CTO perspective

An exception investigation joins the captured form, product reference, claim, contractor history and date-effective Drug Tariff provision. Monthly rule changes and ambiguous notes make a single field check insufficient for some cases. Test one residual task: extracting structured facts from synthetic NCSO endorsements, then validating those facts against a retrieved provision. Straightforward items bypass the model. Record evidence, conflicts, versions and human decisions so the result can be inspected and replayed. No integration with internal NHSBSA systems is assumed or implemented.

## CISO perspective

This is a synthetic-only, advisory experiment with no payment authority. Treat every note and model response as untrusted data. The model receives only a synthetic cropped note or redacted text, has read-only evidence access and cannot invoke the compliance gate or record writer. Code rejects unsupported citations and withholds invalid recommendations. A human records the final action. Azure deployment requires managed identities, authenticated surfaces, least-privilege access and explicit retention. A successful demonstration is not permission to introduce real patient data or connect production systems.

## Current process and uncertainty

The supplied public context describes approximately 1.1 billion prescription items annually, with scanning, recognition and automated pricing already established. It reports payment accuracy around 99.85%, checked against a 50,000-item monthly sample. These describe the existing service, not an improvement delivered here.

Community Pharmacy England reports approximately one million referred-back items annually, often expressed as around 85,000 monthly. This is the referred-back workload, not a measured total exception workload or its resolve-versus-refer split. An operator may resolve an exception without referring it. The experiment must collect exception counts by reason rather than treat every referral as an addressable saving.

A likely investigation involves reading an unclear endorsement, checking the claim and product, finding the rule for the dispensing month, and deciding whether more information is needed. Referral can delay payment by a cycle and add pharmacy administration. Cost and consequences per exception matter more than its small share of total volume. The supplied 2026 pharmacy pressures figures (75% loss-making, 86% spending longer sourcing medicines) provide context, not a causal estimate of MVP value.

MYS supports month-end submissions and digital referred-back items; supplier APIs and Real Time Exemption Checking show integration precedents. Their existence does not establish an available item-level API for this experiment.

## Why investigate a change

Rules include prose and change monthly. Notes can be handwritten. Evidence is spread across sources. A date-effective evidence pack could make review more consistent and make rationale visible. Whether NHSBSA currently records rationale, and whether operators disagree materially, are validation questions: absence of rationale and inconsistency must not be asserted as established internal facts.

## Why AI, and where it is unnecessary

OCR transcribes marks but does not by itself establish whether a note meets a provision. A rules engine reliably checks structured fields and should do so here; not every monthly change requires code changes, since requirements can be configuration. A classifier can label familiar examples but needs monitoring as rules and notes change; monthly retraining is not inevitable and citations are not intrinsic to classification. A language model can attempt structured extraction from a note, including ambiguous handwriting. That capability must be tested, not assumed accurate. The deterministic validator, not the model, applies the retrieved requirements.

## Why an agent rather than a single prompt

Five evidence sources are involved: form/capture, product, claim, contractor history and Tariff. The endorsement type selects the provision; the dispensing date selects its version; conflicts or insufficient evidence determine whether to stop. An observable, bounded investigation can choose the next read-only tool, reconcile sources, cite evidence and stop rather than silently guess. A single prompt over a preassembled bundle may be sufficient for this narrow scope. Code-first orchestration is the baseline; genuine adaptive tool selection must earn its additional cost through evaluation. Three extraction samples do not alone prove agentic value or statistical independence.

## Simpler solutions and comparison arms

| Option | Sufficient when | Remaining limitation |
| --- | --- | --- |
| Deterministic pre-checks | Required fields exist, no endorsement is required or supplied, claim at basic price | Does not interpret ambiguous notes; tier 0 is included and calls no model |
| Better OCR | Transcription error is the main cause and structured rules are sufficient | Does not assemble other evidence or establish the effective provision |
| Configurable rules engine | Inputs and monthly requirements are structured | Cannot reliably extract facts from ambiguous handwriting alone |
| Workflow tool | Routing, ownership and turnaround are the dominant problem | Investigation still falls to the operator unless evidence integration is added |
| Standard chatbot or single prompt | An operator already has a complete, bounded evidence bundle | Does not inherently ensure provenance, date filtering, independent validation or audit writes |
| Bounded agent investigation | Evidence gathering is costly and findings determine subsequent reads | Adds latency, model cost and another failure mode; compare with the simpler arms |

## Kill or reshape criteria

* If operators mostly exercise expert judgement rather than gather evidence, reshape around evidence presentation or stop the automation claim.
* If exception reasons are a long tail, stop extrapolating an NCSO experiment to the full workload.
* If operators already agree on almost every item, consistency is not a credible primary benefit.
* If item-level referral history cannot be obtained, repeat-referral and payment-delay benefits cannot be evaluated; stop that business-case claim.
* If deterministic extraction and rules match the model at lower cost, remove the model.
* If safety gates cannot contain unsupported recommendations, stop before real-data use.

## Outcome measures and customer evidence

| Measure | MVP evidence | Customer data required |
| --- | --- | --- |
| Handling time | Assembly duration and time from opening case to decision, synthetic | One day of timed operator baseline, gathering versus judgement split |
| Adjudication agreement | Agreement against synthetic expected outcomes, precision on non-abstentions | About 200 independently adjudicated cases, inter-operator agreement ceiling |
| Citation validity | Exact span and date/version checks; target 100%, invalid results withheld | Approved source and version governance |
| Evidence completeness | Provenance per finding and missing-evidence counts | Required evidence definitions and source availability |
| Abstention | Overall rate, reasons and coverage slices | Acceptable workload and safety thresholds |
| Human overrides | Rate and mandatory reasons, with both unusually low and high rates investigated | Representative operators and independent review for automation bias |
| Repeat referrals and payment delay | Explicit unavailable placeholders, never fabricated | Item-linked referrals, second referrals and payment dates |
| Cost per case | Measured tokens, calls and durations; service allocation assumptions | Cost per operator touch, exception volume by reason, contracted Azure rates |
| Payment accuracy | No pricing or payment disposition paths | PPPA and ACV monitored by NHSBSA; no claimed causal improvement |

A two-week shadow experiment should pre-register thresholds with NHSBSA, compare rules-only and single-prompt baselines, stratify handwritten and printed notes, and decide scale, reshape or stop. Synthetic agreement validates implementation consistency, not clinical, financial or operational effectiveness.

## Public-source starting points

* [NHSBSA prescription services](https://www.nhsbsa.nhs.uk/prescription-services)
* [NHSBSA Drug Tariff](https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/drug-tariff)
* [NHSBSA Manage Your Service](https://www.nhsbsa.nhs.uk/manage-your-service-mys)
* [Community Pharmacy England](https://cpe.org.uk/)

Numerical context above is attributed to the supplied brief. Publication-specific verification is required before external business-case use. Synthetic July to September clauses deliberately demonstrate a rule change and are not quotations or claims about the real 2026 Drug Tariff.