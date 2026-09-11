---
title: Prescription Exception Case Builder
description: Synthetic prescription exception investigation with deterministic guardrails and human review.
---

A proof of concept of a **governed AI agent supporting prescription exception handling at NHS Business Services Authority (NHSBSA)**. Built for a capability discussion; domain logic runs entirely in the browser on **synthetic data**. Hosted only on Azure Static Web Apps Free at the site root. Model interpretation is simulated, not a live model call.

> The agent gathers evidence and recommends. Deterministic code validates and calculates. A human decides. The prototype does not calculate or approve payments.

## The problem it addresses

NHSBSA prices almost all of around 1.1 billion prescription items a year automatically. Around 85,000 items a month cannot be priced because a pharmacy's endorsement fails a rule in the Drug Tariff, a rulebook that changes every month. Each of those items goes to a person who gathers the evidence and judges a handwritten note against the rule by hand. This application shows an agent building that case, citing the rule in force on the dispensing date and recommending, while a person still decides. It runs in two places: at the pharmacy before a claim is sent (advisory, never blocking) and at NHSBSA after an item enters the exception queue.

## What is in the box

| Route | Screen |
|---|---|
| `/` | Overview: the problem, the principle, one synthetic working day |
| `/pharmacy` | Pharmacy pre-submission check (advisory only) |
| `/queue` | Exception queue with six states |
| `/case/:id/trace` | How the case was built: the agent's observable workflow, step by step |
| `/case/:id` | Operator case pack and the human decision |
| `/case/:id/record` | Decision and audit record, with replay under another Tariff version |
| `/evaluation`, `/boundary`, `/assumptions`, `/architecture`, `/notes` | The reflective pages: guardrails, the agent/code/human boundary, assumptions, architecture, presenter notes |

Six synthetic cases each show one behaviour: valid and complete; missing information; evidence conflict; deliberate abstention; cleared by rules with no model call; decision already recorded. Header controls: the agent feature flag (off shows the fail-open path), Presenter mode (a ten-minute walkthrough), Discussion mode (prompts and challenge cards), Reset.

## Run it locally

```
npm install
npm run dev          # http://localhost:5173/
npm run check        # typecheck + lint + build
```

## Deploy to Azure Static Web Apps

Follow [the one-time setup](docs/DEPLOYMENT.md): create the Free Static Web App
with root `infra/staticwebapp.bicep`, then store its token as repository secret
`AZURE_STATIC_WEB_APPS_API_TOKEN`. Pushes to `main` deploy automatically.
Pull requests get previews that are removed on close. Deep links use the root
`staticwebapp.config.json`, copied into the build. No other Azure service is used.

Typecheck, lint, build, unit tests, browser crash/control checks and axe remain
blocking. The 350,000-byte gzip budget, word counts, Lighthouse scores and
screenshot differences are advisory.

## Documents

- [Azure deployment guide](docs/DEPLOYMENT.md): Free Static Web App, one-time token setup and automatic deployment.
- [Hosting decision](docs/adr/0001-host-existing-demo-first.md): scope and deferred live-agent services.
- `docs/SPEC.md`: functional specification of the application, screen by screen and rule by rule.
- `docs/TASK.md`: the brief for rebuilding this proof of concept to a higher standard.
- `docs/KNOWN-ISSUES.md`: what is weak or broken in the current build.
- `AGENTS.md`: working rules for coding agents and contributors.

## Status of what is built

Built for real: the deterministic rules (requirement checks, compliance gate, confidence composite, citation validation), the scripted orchestration and its inspectable trace, the versioned synthetic rulebook, session-only decision records, and every screen. Hosting adds no authentication, telemetry or runtime backend. See the deployment guide for provisioning status. Mocked: the interpretation of the free-text endorsement (three scripted readings per case) and every enterprise source. Not built: a live model, Search retrieval, durable audit storage, capture integration, a live queue, monitoring and dispensing-system integration. Pricing is excluded by design.

## Disclosure

All sources used to frame the problem are public. All data is synthetic. Nothing here is a claim about NHSBSA's real performance, and the rulebook text is a paraphrase written for the demonstration, not the Drug Tariff.
