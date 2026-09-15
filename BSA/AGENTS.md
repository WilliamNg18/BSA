# Instructions for coding agents and contributors

This repository holds the **Prescription Exception Case Builder**, a proof of concept of a governed AI agent supporting prescription exception handling at NHS Business Services Authority (NHSBSA). It is a static React application on synthetic data, delivered by the existing Azure App Service. Read this file first, then `docs/SPEC.md` (what the application does), `docs/TASK.md` (what to build next) and `docs/KNOWN-ISSUES.md` (what is wrong now).

## The one rule that governs everything

MEMORY's **Live first, local backup** standing rule applies to every stream.
Live is the product. Working branches must be pushed at every STATUS and at
least every thirty minutes; they remain incomplete until main is deployed
green and the exact change is observed live. Update all five tracking documents
with the same commit. A local backup may contain only the verified current-main
production payload and same-commit supporting material, never a branch build.
Deployment failure takes priority for the merging stream. Preserve the exact
Decision authority exceptions and all existing clinical/source safeguards.

Current work is Tasks 25-40: a desktop-only eleven-step demonstration, two
verification gates, explicit operator/pharmacy actions and same-item follow
navigation. Read the latest DECISIONS contract freeze and PROGRESS ownership.
The latest Parts A-C addition explicitly replaces the date-headline EPS case
with wrong strength, adds the paper-incomplete case, immutable three-source
paper evidence, field/rule-only referrals and acknowledged channel-specific
re-check release. Part A moves the global synthetic notice to the footer and
uses the exact On-only Outcome line. MEMORY's latest requirements supersede
the historical six-case and notice rules.
Desktop verification widths are 1280 and 1440 px only. The owner explicitly
removed mobile/tablet layouts, navigation and their tests/screenshots.
Tasks 25-30 runtime is delivered at `34d7567`, but its final independent
visual acceptance remains unverified; never convert the interrupted review
or its tool-delivery limitation into a passing verdict.
Tasks 19-24 released successfully at `887d2a4`; their evidence stays historical.
MEMORY's **Process model** and **One state** continue to govern authority.
The owner's 13 September process brief explicitly supersedes the older D-only
abstention and referral-only monthly presentation below. D must still abstain
on unreconciled evidence, but the proposed human-confirmed declaration path can
build a case without claiming to read its poor paper image. A becomes automatic
rules pricing with no operator. Follow current PROGRESS ownership before editing.

> The agent gathers evidence and recommends. Deterministic code validates and calculates. A human decides. The prototype does not calculate or approve payments.

Any change that lets the "agent" price an item, change a case state, bypass the compliance gate, cite a rule it did not retrieve, or hide its uncertainty is wrong, however good it looks.

## Hard constraints

- **Synthetic data only.** No real prescriptions, patients, pharmacies, contractor codes or invented verbatim Drug Tariff text. Keep `SYN-` product codes, per-item "(synthetic)" and factual synthetic-source labels. The 15 September Part A instruction supersedes the amber-banner rule: show "All data is synthetic" once in the footer, small and muted, with no global notice bar or collapse state. Only Agent On shows the exact Outcome line from MEMORY directly below the header; Off leaves no reserved space.
- **Static, offline, private.** No back end, no run-time network calls, no analytics, no external fonts at run time, nothing persisted except presentation preferences. `Reset demo` must return the application to its seeded state.
- **Perspective is presentation only.** Pharmacy, NHSBSA and Both use the same operational store. Reset retains perspective while restoring seeded data and Agent Off. Human-applied suggestions/corrections may append explicitly attributed events but never submit or release an item by themselves. Demo navigation changes no operational state.
- **One Agent control.** Only the top-right header may change `agentEnabled`. Pages read the shared state and conditionally show assistance actions; do not add page-local Agent switches or availability overrides.
- **Every action is classified** as existing NHSBSA capability, deterministic code, agentic action or human decision, and the tag is shown where the action appears.
- **The four active cases follow Tasks 39-40**: complete EPS; wrong-strength EPS; unreadable paper with declaration; and paper missing required brand/manufacturer with correct dates. C/F remain unclickable background. Historical six-case fixtures and results are not current headline scenarios.
- **The gate is code.** `complianceGate` in `src/lib/domain/rules.ts` must stay a pure function the interpretation step cannot influence. Confidence is the five structural signals, never a self-reported percentage.
- **Accessibility is a requirement**: WCAG 2.2 AA contrast, full keyboard operability, visible focus, correct names and roles, `aria-live` on the trace replay, reduced-motion support, no meaning carried by colour alone.
- **Desktop only.** Verify at 1280 and 1440 px. Do not restore mobile navigation, tablet layouts, sub-1024 breakpoints or small-screen test matrices.
- **UK English.** No em dashes in interface copy. No implementation vendor or product branding anywhere in the interface, including Architecture. Use capability labels without rewriting source mappings, tool contracts or stored audit evidence. Preserve NHSBSA, MYS, NHSmail, EPS, dm+d and Drug Tariff process names.
- **Existing Azure App Service.** Vite base and router basename are `/`. Root `hosting.config.json` and the packaged static server supply deep-link fallback and strict headers. No business/model backend, added authentication service or unapproved tier change. See issue #48 for the explicit superseding hosting decision.
- **Gates.** Check, Vitest, current four-case browser regressions and zero-violation axe remain blocking, together with the owner's explicit one-second hand-offs, latest-main live verification, backup parity and recovery checks. No unrelated generic byte or performance budget is introduced. Gzip size remains informational; do not weaken the new explicit acceptance requirements or declare an uninvestigated failure flaky.

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
../.github/workflows  deploy-appservice.yml (hosting), ci.yml (verification)
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
2. Open every route listed in `docs/SPEC.md` section 3 at 1280 and 1440 px, light and dark. No console errors. New screenshots are 1440 px only.
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
