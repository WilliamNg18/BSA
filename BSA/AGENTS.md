# Instructions for coding agents and contributors

This repository holds the **Prescription Exception Case Builder**, a proof of concept of a governed AI agent supporting prescription exception handling at NHS Business Services Authority (NHSBSA). It is a static React application on synthetic data, hosted only on Azure Static Web Apps. Read this file first, then `docs/SPEC.md` (what the application does), `docs/TASK.md` (what to build next) and `docs/KNOWN-ISSUES.md` (what is wrong now).

## The one rule that governs everything

> The agent gathers evidence and recommends. Deterministic code validates and calculates. A human decides. The prototype does not calculate or approve payments.

Any change that lets the "agent" price an item, change a case state, bypass the compliance gate, cite a rule it did not retrieve, or hide its uncertainty is wrong, however good it looks.

## Hard constraints

- **Synthetic data only.** No real prescriptions, patients, pharmacies, contractor codes or Drug Tariff text. Keep `SYN-` product codes, "(synthetic)" labels and the amber banner on every screen.
- **Static, offline, private.** No back end, no run-time network calls, no analytics, no external fonts at run time, nothing persisted except presentation preferences. `Reset demo` must return the application to its seeded state.
- **Every action is classified** as existing NHSBSA capability, deterministic code, agentic action or human decision, and the tag is shown where the action appears.
- **The six cases keep their outcomes**: A sufficient; B refer back (initialled, not dated) and sufficient under July replay; C request information (quantity conflict, surfaced not resolved); D abstain (no provision, quality below 0.60, readings disagree); E cleared by rules with no agent call; F already decided.
- **The gate is code.** `complianceGate` in `src/lib/domain/rules.ts` must stay a pure function the interpretation step cannot influence. Confidence is the five structural signals, never a self-reported percentage.
- **Accessibility is a requirement**: WCAG 2.2 AA contrast, full keyboard operability, visible focus, correct names and roles, `aria-live` on the trace replay, reduced-motion support, no meaning carried by colour alone.
- **UK English.** No em dashes in interface copy. No vendor or product branding in the interface (the Architecture page's production mapping is the one place service names belong).
- **Azure Static Web Apps only.** Vite base and router basename are `/`. Root `staticwebapp.config.json` supplies deep-link fallback and security headers. No other hosting or authentication service.
- **Gates.** Only check (typecheck, lint, build), Vitest, browser crash/dead-control/six-outcome regressions and zero-violation axe block. No byte or performance budgets. CI reports gzip size once as information; word counts, Lighthouse and screenshot differences are informational. Proven flakes need an issue and `@quarantine` tag.

## Stack and layout

React 19, TypeScript (strict), Vite 7, Tailwind CSS v4 (CSS-first tokens in `src/index.css`), vendored shadcn/ui in `src/components/ui`, react-router-dom 7, zustand, lucide-react, motion, sonner.

```
src/
  lib/domain/      the model: types, tariff (3 versions), reference data, cases (6), rules, tools, agent (runAgent), content (copy for the reflective pages)
  lib/store.ts     session state: case states, decision records, flags, presenter beat
  routes.tsx       single source of truth for routes and primary navigation
  components/demo/ header, presenter bar, discussion sheet, labels/tags, signals, prescription form, case header
  components/ui/   shadcn primitives (edit only to fix a defect; do not restyle here, restyle through tokens and className)
  pages/           one file per route
docs/              SPEC.md, TASK.md, KNOWN-ISSUES.md
../.github/workflows  azure-static-web-apps.yml (hosting), ci.yml (verification)
```

## Commands

```
npm install
npm run dev        # local at http://localhost:5173/
npm run typecheck  # tsc, strict
npm run lint       # eslint
npm run build      # vite build at the root path, including hosting configuration
npm run check      # typecheck + lint + build: must pass before any pull request
```

## How to verify a change

1. `npm run check` passes with no errors and no warnings.
2. Open every route listed in `docs/SPEC.md` section 3 at 360, 768, 1024 and 1440 px, light and dark. No console errors.
3. Walk the six cases: outcomes, gate results and states match the table in `docs/SPEC.md` section 5.3.
4. Toggle the agent flag off: every case shows evidence only; nothing else changes.
5. Run an accessibility audit (axe or Lighthouse) on Overview, Pharmacy, a case pack and a trace.
6. Attach screenshots to the pull request; describe design decisions in plain English.

## Working style

At every session start, read docs/MEMORY.md, docs/DECISIONS.md,
docs/LEARNINGS.md, docs/PROGRESS.md, docs/SCOPE.md and docs/HANDOVER.md.
Reference documents remain public by the owner's decision. Use them directly
for the aim, outcomes and problem, with accurate attribution. Document names
are allowed in documentation and code comments, never in the website interface.

Small pull requests, one theme each, every one deployable. Domain-layer changes come with tests and never share a pull request with interface redesign. When the spec is ambiguous, prefer the reading that keeps the agent's part smaller and the human's part clearer, and record the choice in the pull request.
