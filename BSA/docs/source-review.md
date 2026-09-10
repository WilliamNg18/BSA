---
title: Tour foundation source review
description: Two-document evidence boundary, material discrepancies, implementation mapping and deferred source migration.
ms.date: 2026-09-10
---

## Evidence boundary

The supplied one-page PDF and version 5 researcher pack are the only documentary
sources. The full PDF text and complete researcher review were read before
tour copy was implemented. The preceding complete-source review records reading
every emitted main-document paragraph P0001-P3750 and footer P0001. Blank
paragraphs were omitted by extraction. This increment does not claim a new
visual inspection of the PDF, Word fields, specimen images or hyperlink targets.
No public websites or named publications were fetched or independently verified.

The pre-existing [source registry](../src/lib/domain/source-claims.ts) contains
354 consolidated claim families and remains unchanged by this tour increment.
Its 19 existing tests are retained. The count is not one row per source sentence
or every repeated numerical token. Document hashes are supplied metadata, not
newly recomputed verification of the source binaries.

The UI uses curated `TOUR_CONTENT`, five PDF assumptions and seven PDF questions.
Disclosures show eligible claim IDs, source class, named-publication attribution,
document filename and PDF page/section or DOCX part/paragraph identifiers.
Raw source quotations, personal context, contradictory claims and reference-only
claims are not automatically made displayable. Unknown/withheld IDs fail closed.

## Source discrepancies and adjudication

| Issue | Evidence | Treatment in this increment |
|---|---|---|
| Referral subset versus all exceptions | Pack P0151, P0694-P0695; PDF problem section | Approximately 85,000 refers only to referred-back items; total operator volume unknown |
| Monthly approximation | Pack P0694; registry N01 | One million / twelve is approximately 83,333, not exactly 85,000; qualification is accessible |
| Items versus forms | Pack P0686-P0687, P0705 | Annual figure is items, not physical documents or scans |
| Target versus achieved accuracy | Pack P0207-P0212 versus P3463 | 99.85% is the stated PPIA/PPPA target, not achieved accuracy or an error budget |
| Monthly publication versus rule changes | Pack P0106-P0108, P0758 | Monthly publication retained; relevant change frequency requires validation |
| Existing manual effort and rationale | Pack P0730-P0751 | Assumptions, not established absence of tools or records |
| Existing pharmacy pre-checks | Pack P0434 versus P2765/P2772 | Unknown; a proposed extension does not prove that nobody checks |
| Need for a model | PDF code boundary; Pack P0329-P0331 | Compare deterministic prefetching, rules and templates before attributing benefit to interpretation |
| Discovery lists | PDF five assumptions/seven questions; pack P0708-P0773 and P2367-P2420 | PDF-first lists retained separately, not silently merged with the pack |
| Fee arithmetic | Pack P0110/P0696 | 152p equals GBP 1.52, not an increase; withheld from tour |
| Sample medicine arithmetic | Pack P3025/P3075 | 5 ml x 3 x 5 is 75 ml, not 100 ml; no fixture imported |
| Evaluation scoreboard | Pack P2173-P2179 | Inconsistent slice/miss and tier counts; not imported as measured results |
| Version replay | Pack P2351 versus P2664 | Existing July/August replay is synthetic counterfactual testing, not evidence of an actual rule change |
| Guaranteed payment or safety | Pack P3147, P2579 | No WILL PRICE, no guaranteed savings, no assurance that human review eliminates harm |
| Common service | Pack P0436-P0437 | Proposed architecture; current pharmacy regex and scripted case readings are not a common live model |
| Annex 7 | Pack P3610-P3750 | Stale PDF comparison is not authoritative; actual supplied PDF controls its wording |

## Source to implementation mapping

Source case letters are not the application's case letters. The registry's
`CASE_SOURCE_MAPPING` documents the differences; no canonical fixture was edited.

| Source pack example | Application relationship |
|---|---|
| A: deterministic clearance | Canonical E, EX-24101 |
| B: absent endorsement | No exact canonical counterpart |
| C: undated endorsement plus ledger mismatch | Canonical B, EX-24112, for the undated behaviour only; source mismatch not copied |
| D: deliberate failure | Canonical D, EX-24123 |
| E: alternate rule version | Canonical B counterfactual replay |
| Canonical A and C | Existing complete-endorsement and quantity-conflict fixtures, not a renaming of pack A/C |

Chapter 3 invokes `runAgent` rather than maintaining a second outcome table.
B's date fix is shown only for its actual REFER_BACK result. C renders the
engine's two source values without resolving them. D renders three abstention
signals and the exact engine reasons in disclosure, with gate NOT RUN.
Gate FAIL still withholds advice centrally; no domain gate is changed.

| Tour content | Registry or implementation authority |
|---|---|
| Scene figures | O02; O23/O24/N01; O36/O37 through `TOUR_CONTENT.keyFigures` |
| Existing-process branches and rulebook | O18/O19/O20/O21; O11/A07 |
| Manual assumptions | A03/A04/A05/A10 and curated chapter 3 |
| A-D results, conflicts and abstention | Existing cases, `runAgent`, `QUALITY_THRESHOLD`; S-ALL labels them synthetic |
| Two-place diagrams | D-PHASES/D-ADVISORY/D-PLUMBING/A13; implementation limitations disclosed |
| First test | PDF-A01 and D-STOP |
| Discovery lists | `TOUR_CONTENT.assumptionsDisclosure` and `questionsDisclosure` |

## Chapter 2 addition

The calculator now consumes the same qualifications without modifying the
canonical source registry. Its approximate 85,000 monthly default is pinned
by a unit test to O23; full research records are not newly imported into the
browser. O24/N01 retain the subset and annual/monthly discrepancy. A03/A10
support validation needs, not the invented five/two-minute default durations.

The current seed queue supplies synthetic proportions with explicit sequential
denominators (2/12 pre-check candidates, 2/10 cleared, 2/8 abstained). The
pharmacy-catch proxy assumes missing date/invoice information is correctable;
it is not a measured effectiveness claim. Only active recommended canonical
A/B/C supply engine latency and the 3/3 validated-citation sample. D/E do not
acquire a citation. Historical records stay historical; fillers supply metadata
only, never invented engine runs. See [SPEC.md](SPEC.md#chapter-2-baseline-model)
for formulas, default IDs, rounding, bounds and exclusions.

## Tour foundation status and remaining exclusions

Built here: qualified scene, A-D summaries, On/Off proposal diagrams, PDF-first
close, six-chapter rail with pharmacy substop, 56 px grouped header/mobile sheet,
Agent tooltip, confirmed reset and session-only disclosure/rail visibility.

The Chapter 2 calculator and pure manual baseline arithmetic are now built.
Planned, not built: workload simulation, manual case views,
a new pharmacy split/comparison experience, a shared live
service, and the broader next-phase navigation/presentation work. Existing
pharmacy and queue screens are destinations, not evidence those future features
exist. No source correction silently changes canonical outcomes.

The registry migration is not universal. Queue ages/filler counts, case evidence
amounts and durations, replay, evaluation metrics, pharmacy notices and other
legacy numeric copy still need a separate inventory and classification pass.
Legacy assertions about avoided delays, shared logic and deployment capability
also remain follow-up work. Domain fixture values must remain synthetic, with
clear implementation authority rather than false public-source citations.

No backend, model service, payment functionality, account action or deployment
is included. No commit, push or merge is authorised for this increment.

## Verification and screenshots

The [tour test suite](../tests/e2e/tour.spec.ts) checks seven widths, both themes
and assistance states, route sequence, reset semantics, source locators,
disclosure controls, shortcuts and chapter prose. The existing domain, canonical,
gate, crash-boundary and offline tests are retained. The expanded axe suite
covers every Overview chapter in both states/themes as well as existing surfaces.
Run results and limitations are recorded in [KNOWN-ISSUES.md](KNOWN-ISSUES.md).

Selected generated PNGs are saved in [the QA index](qa/tour-foundation/README.md)
for review and a later authorised commit. They have not been committed by this
increment. These are local production screenshots, not hosted verification.
