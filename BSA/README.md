---
title: Prescription Exception Case Builder
description: Synthetic prescription exception investigation, shared lifecycle and human decisions.
---

A static demonstration of evidence gathering for prescription exceptions at
NHS Business Services Authority. React and TypeScript run locally in the browser
with synthetic cases, scripted interpretation and deterministic guardrails.
**Azure Static Web Apps Free at `/` is the only hosting target. No live URL or
provisioned deployment is claimed.**

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

| Route | Screen |
| --- | --- |
| `/#scene`, `/#month`, `/#cases`, `/#two-places`, `/#close` | Overview chapters: context, calculator, pipeline, two places and first test |
| `/pharmacy` | Manual submission or optional scripted precheck; never blocks submission |
| `/pharmacy/claims` | Pharmacy/state filters, claimed totals, expandable claim detail and shared history |
| `/pharmacy/claims?caseId=EX-24112` | Same-item pharmacy link, correction and resubmission |
| `/queue` | Pinned examples, bounded virtual month, visible-row sweep and shared live-session queue |
| `/case/:id`, `/case/:id/trace`, `/case/:id/record` | Evidence pack, observable trace, human record and counterfactual rule replay |
| `/evaluation`, `/boundary`, `/assumptions`, `/architecture` | Reflective pages |

Seven tour chapters have eight stops: Pharmacy check is chapter 4's substop;
Pharmacy claims is chapter 6. Header navigation groups Overview, Operations and
How it works (the queue menu item is **NHSBSA queue**). Agent defaults **Off**; confirmed Reset restores Off and seeded
session data. Follow/Switch side links keep the same item. Presenter mode,
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

Open `http://localhost:4193/`. Preview serves built files, not Azure response
headers. In-session navigation works after initial loading without a runtime
service; offline reload is not guaranteed.

## Deployment and gates

Follow [DEPLOYMENT.md](docs/DEPLOYMENT.md) for explicit subscription selection,
the root `infra/staticwebapp.bicep` and the repository deployment secret. No
subscription was selected, no resource provisioned and no token supplied.
After owner setup, the workflow deploys `BSA/dist` on `main` and creates eligible
pull-request previews. Root `staticwebapp.config.json` is copied into the build.
Hosted deep links and the strict CSP still require verification on that host.

`npm run check` (typecheck, lint, build), `npm test` (Vitest), production browser
crash/dead-control checks and zero-violation axe are blocking. There are no size
or performance budgets. CI reports gzip size as information only; word counts,
Lighthouse scores and screenshot differences are also informational.
Informational reporting does not excuse a functional or accessibility defect.

## Documentation and limits

[SPEC](docs/SPEC.md) describes current behaviour. [KNOWN-ISSUES](docs/KNOWN-ISSUES.md)
separates genuine limitations from historical evidence.
[Current screenshots](docs/screens/integrated/README.md) include the exact
production capture procedure; [PROGRESS](docs/PROGRESS.md) owns acceptance status.
[Requested scope](docs/SCOPE.md) tracks the newer eight-chapter request and its
active implementation owners separately from the current seven-chapter build.
[AGENTS](AGENTS.md) governs contributions.

No real prescriptions, patients, pharmacies, authentic tariff text, live model,
capture integration, durable audit store, real operational queue or payment
calculation is present. Synthetic claimed amounts are not calculated payments.
Hosting adds no authentication, telemetry or runtime backend.
