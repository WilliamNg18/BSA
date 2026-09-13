---
title: Prescription Exception Case Builder
description: Synthetic prescription exception investigation, shared lifecycle and human decisions.
---

A static demonstration of evidence gathering for prescription exceptions at
NHS Business Services Authority. React and TypeScript run locally in the browser
with synthetic cases, scripted interpretation and deterministic guardrails.
**The owner-selected existing Azure App Service F1 delivers the site at `/`.
Each release must verify its actual build commit and strict headers.**

Live URL: https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/.
The accepted Tasks 14-18 release `80d955bdde6a7ef4e59ceb720d9c9a654efbe5e3`
is pinned by annotated `lkg-2026-09-13` and `last-known-good`.
The single Agent On/Off switch is in the header, top right: pharmacy, queue
and all other pages read that shared state and have no local overrides.

> The agent gathers evidence and recommends. Deterministic code validates and
> calculates. A human decides. The prototype does not calculate or approve payments.

## What it demonstrates

An advisory pharmacy check and an NHSBSA evidence pack share one session-only
case history. A human can refer an item back, approve a draft instruction,
correct and resubmit it from the pharmacy, then review it again. The final
`paid` label is synthetic and attributed to existing pricing, not an agent
payment decision. Toggling assistance never advances the lifecycle.

The documentary context includes approximately 1.1 billion primary-care items
per year in England (reporting year unspecified) and approximately 85,000 monthly
referred-back items (2024/25 context). Referrals are a subset, not the total
exception queue. These are attributed public figures, not independently verified
operational measurements. Monthly publication does not establish monthly rule changes.
Calculator durations, cohorts and benefits are editable demonstration assumptions.

## Aim, problem and outcomes to test

The supplied references frame the problem as assembling uncertain endorsement
evidence against the rule in force, not replacing existing capture or pricing.
Whether operators spend material time on that assembly, and whether a model
adds value beyond a pre-fetched screen or deterministic rules, need validation.

The aim is to test a bounded evidence-building assistant with inspectable
sources and human control. Potential outcomes are less repeat handling,
redeployable operator capacity, easier decision reconstruction and less pharmacy
rework. These are hypotheses, not delivered savings or guaranteed payment timing.
Measure pharmacy benefits separately and avoid counting the same handling
reduction again as a separate capacity saving.

The owner-approved public [reference register](data/reference/source-audit.ts)
identifies *William Ng Single Page - Embrace the Change.pdf* and
*nhsbsa-FINAL-complete-pack-v5.docx*, with source locators and qualifications.
The single-page assumptions and questions guide discovery; stronger pack
assertions do not override their caveats. Start with referral-reason evidence,
observe actual work and agree accuracy/stop criteria before assisted use.

| Route | Screen |
| --- | --- |
| `/#scene`, `/#month`, `/#pipeline`, `/#cases`, `/#two-places`, `/#close` | Overview chapters: context, calculator, separate pipeline/Four cases, two places and closing discovery |
| `/pharmacy` | Manual submission or optional scripted precheck; never blocks submission |
| `/pharmacy/claims` | Counted action/waiting/paid/all filters, five-column claims table, approved-only detail and shared history |
| `/pharmacy/claims?caseId=EX-24112` | Same-item pharmacy link, correction and resubmission |
| `/queue` | Counted six-column virtual queue, actual New submissions and read-only one-hour Compare |
| `/case/:id`, `/case/:id/trace`, `/case/:id/record` | Evidence pack, observable trace, human record and counterfactual rule replay |
| `/evaluation`, `/boundary`, `/assumptions`, `/architecture` | Reflective pages |

Eight tour chapters have nine stops: Pharmacy check is chapter 5's substop;
Pharmacy claims is chapter 7. Header navigation groups Overview, Operations and
How it works (the queue menu item is **NHSBSA queue**). The header's sole Agent
switch defaults **Off**; confirmed Reset restores Off and seeded
session data. Perspective defaults to **Both** and survives Reset; Pharmacy
and NHSBSA filter navigation and guard opposite-side routes without redirecting
or changing history. Both retains the tour and Follow/Switch side links.
Presenter mode,
Discussion mode and `/notes` are removed; use the [demo script](docs/demo-script.md).

The six canonical cases remain A sufficient, B missing a date (July replay
sufficient), C unresolved quantity conflict, D abstention, E code-only clearance
without a model call, and F an existing human record.

## Run locally

From repository root in PowerShell:

```powershell
Set-Location BSA
npm ci
npm run dev
```

The development URL is `http://localhost:5173/`. For a production rehearsal:

```powershell
npm run check
npm run preview -- --host localhost --port 4193 --strictPort
```

Open `http://localhost:4193/`. Vite preview serves built files but does not apply
the emitted security headers. For header-enforced rehearsal, stop preview and run:

```powershell
$env:PLAYWRIGHT_PORT = "4193"
node scripts\serve-production.mjs
```

In-session navigation works after initial loading without a runtime
service; offline reload is not guaranteed.

## Deployment and gates

Follow [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the existing App Service,
`infra/appservice.bicep`, OIDC variables and portable `BSA/dist` package.
`deploy-appservice.yml` deploys main/manual releases; F1 has no PR slots.
Root `hosting.config.json` is packaged with a static server and build provenance.
Verified live site: https://bsa-bsa-demo-r2j2l3dxhtohy.azurewebsites.net/.
Clean release `b813c6241cc084957a30c6bf48fdd65f623f33f6` passed 13/13
live checks, 26 exact identities, six axe audits (three Off/three On, zero
violations) and a separate same-history mixed-mode round trip. See the
[source-pinned live record](docs/live-verification/README.md). Every later
deployment must still verify its own commit, deep links and strict headers.
Main/manual OIDC are verified; no owner token setup or live PR slots are needed.

`npm run check` (typecheck, lint, build), `npm test` (Vitest), production browser
crash/dead-control checks and zero-violation axe are blocking. There are no size
or performance budgets. CI reports gzip size as information only; word counts,
Lighthouse scores and screenshot differences are also informational.
Informational reporting does not excuse a functional or accessibility defect.

## Documentation and limits

[First-time viewer review](docs/FIRST-TIME-VIEWER.md) records nine observed
chapter 2/6/7 clarity points, 18 fresh live captures with zero-violation axe
reports, and a human-controlled same-item/catch-counter walkthrough on clean
`c0203fc`. It preserves the earlier baseline separately. This is AI evaluator
review, not timed human testing or full accessibility certification.

[SPEC](docs/SPEC.md) describes current behaviour. [KNOWN-ISSUES](docs/KNOWN-ISSUES.md)
separates genuine limitations from historical evidence.
[Original source-pinned screenshots](docs/screens/integrated/README.md) include the exact
production capture procedure; [PROGRESS](docs/PROGRESS.md) owns acceptance status.
[Task 18's reviewed live matrix](docs/screens/task18/README.md) is separately
pinned to `c0203fc`; it is not a relabelling of those older images.
[Requested scope](docs/SCOPE.md) tracks the eight-chapter implementation and
the 18 accepted scope rows and bounded infrastructure evidence.
[AGENTS](AGENTS.md) governs contributions.

The owner cancelled the proposed account transfer and authorised public
repository resumption on 12 September 2026. Reference material remains public
by that decision; publication is not independent validation of its claims.
The initial screenshots/checkpoint are preserved in Git history. Integrated
source `898cda5` historically passed check, 607 units, 1,019 blocking browser tests and three
separately run informational quarantine cases in
[Actions run 34689966621](https://github.com/WilliamNg18/BSA/actions/runs/34689966621).
Successful-run audit artifacts were not uploaded; no new deduplicated CI axe
count is claimed. The [capture index](docs/screens/integrated/README.md) records
the separate final visual evidence.

Pre-redesign [CI 34705318318](https://github.com/WilliamNg18/BSA/actions/runs/34705318318)
at `8bee3f205d29178177a6fb1ef5e98394c7655d2c` passed check, 695 unique
units in 26 files and 1,055 blocking browsers across four shards in 6m25s,
with zero quarantine. Unit repeats across shards are not additional unique
tests. [Infrastructure evidence](docs/INFRA-DONE.md) includes actual bounded
configuration recovery, not a destructive disaster-recovery guarantee.

No real prescriptions, patients, pharmacies, authentic tariff text, live model,
capture integration, durable audit store, real operational queue or payment
calculation is present. Synthetic claimed amounts are not calculated payments.
Hosting adds no authentication, telemetry or runtime backend.
