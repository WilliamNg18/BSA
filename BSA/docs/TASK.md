# Task brief: rebuild the proof of concept to a higher standard

Paste this as a GitHub issue and assign it to a coding agent, or hand it to a developer. It is written so that it can be executed without any further conversation. `docs/SPEC.md` is the source of truth for behaviour; `docs/KNOWN-ISSUES.md` lists what is weak in the current build; `AGENTS.md` at the repository root carries the working rules.

---

## What this is

A proof of concept of a governed AI agent supporting prescription exception handling at NHS Business Services Authority. Around 85,000 prescription items a month cannot be priced automatically because a pharmacy's endorsement fails a rule in a monthly-changing rulebook, and a person has to gather the evidence and judge by hand. The application shows an agent building that case, citing the rule and recommending, while a person still decides. It is a capability demonstration for a conversation, built on synthetic data, with no back end.

Governing principle, visible on every screen and not negotiable:

> The agent gathers evidence and recommends. Deterministic code validates and calculates. A human decides. The prototype does not calculate or approve payments.

## What I want

Rebuild the application as a **polished, production-quality proof of concept** that:

1. **Keeps the functionality exactly** as described in `docs/SPEC.md`. Every route, every control, the six cases and their outcomes, the nine-step agent pipeline, the deterministic rules, the compliance gate, the confidence composite, the abstention path, the feature flag, presenter mode, discussion mode, the decision record and replay under another Tariff version. Where the spec says **Keep**, do not reinterpret.
2. **Uses similar synthetic data.** You may regenerate names, codes, dates and amounts, and you may add more filler rows to make the queue feel like a real working day, but the six behaviours (A valid, B initialled-not-dated, C quantity conflict, D deliberate abstention, E cleared by rules with no model call, F already decided) must survive with the same outcomes, and the August rule change that makes Case B flip under July replay must survive. Everything must remain obviously synthetic (`SYN-` codes, "(synthetic)" labels, the amber banner).
3. **Raises the visual and interaction quality substantially.** The current interface is functional but generic. I want it to look like a product an NHS operator would be pleased to use: a clear visual hierarchy, a deliberate typographic scale, consistent spacing, strong empty and loading states, well-designed tables that survive long text, a prescription form that reads as a scanned form rather than a diagram, and a case pack an operator can scan in five seconds. Dark mode must be as good as light mode. Mobile and tablet layouts must work, not merely not break.
4. **Fixes everything that is broken or rough.** Start with `docs/KNOWN-ISSUES.md`, then run the application yourself and fix what you find. Assume the previous author never saw it in a browser.
5. **Deploys to Azure Static Web Apps** through root `.github/workflows/azure-static-web-apps.yml` at `/`, with deep links configured in root `staticwebapp.config.json`. See `docs/DEPLOYMENT.md`.

## Constraints

- Static site only. No back end, no network calls at run time, no analytics, no external fonts fetched at run time, no local storage of anything other than presentation preferences. The site must work offline once loaded.
- Keep the stack: React 19, TypeScript (strict), Vite 7, Tailwind CSS v4, the vendored shadcn/ui components in `src/components/ui`, react-router-dom 7, zustand, lucide-react, motion. Add a dependency only if it removes more code than it adds, and never one that phones home.
- Keep the domain layer (`src/lib/domain/*`) as the single source of truth for rules and data. You may refactor it, but the rules in `rules.ts` must keep their semantics; add unit tests (Vitest is acceptable) that pin the six cases' outcomes, the gate decisions and the composite thresholds before you refactor.
- No real personal data, no real contractor codes, no real Drug Tariff text. UK English throughout. No em dashes in interface copy.
- No vendor or product branding in the interface (no "Copilot", no cloud-provider names in headings, badges or buttons). The Architecture page may name production services because that is its purpose.
- Accessibility is a requirement, not a polish item: WCAG 2.2 AA colour contrast, keyboard operability for everything, visible focus, correct roles and names, `aria-live` for the trace replay, reduced-motion support, and no information carried by colour alone.
- Keep the repository buildable with `npm install && npm run check` (typecheck, lint, build) and keep `npm run dev` working locally at `/`.

## Definition of done

- [ ] `npm run check` passes with zero errors and zero warnings.
- [ ] Unit tests exist for the domain layer and pass; they cover the six cases, the gate, the composite and `versionForDate`.
- [ ] Every route in `docs/SPEC.md` section 3 renders, at 360, 768, 1024 and 1440 px, in light and dark mode, with no console errors; screenshots of each are attached to the pull request.
- [ ] Deep links (for example `/case/EX-24112/trace`) open directly on Azure Static Web Apps.
- [ ] The Replay control on the trace page reveals steps one at a time and is announced to screen readers.
- [ ] The operator decision refuses to record an override without a reason of at least eight characters, and says why.
- [ ] Case D abstains and the gate reads NOT RUN; Case E never invokes the agent; Case B replayed under July becomes SUFFICIENT.
- [ ] Turning the agent flag off shows evidence only on every case, with the state unchanged.
- [ ] Presenter mode's seven beats navigate to the right routes; Discussion mode shows prompts for the current route.
- [ ] An axe or Lighthouse accessibility audit reports no violations on the Overview, Pharmacy, Case pack and Trace pages.
- [ ] `docs/KNOWN-ISSUES.md` is updated: fixed items removed, anything you deliberately left is listed with a reason.
- [ ] The pull request description explains the design decisions in plain English, with before and after screenshots.

## How to work

Work in small pull requests against `main`, one theme per pull request in this order: (1) tests and fixes to the domain layer, (2) layout and design system (tokens, typography, spacing, dark mode), (3) the case pack and trace, (4) the pharmacy check and queue, (5) the remaining pages, (6) accessibility audit and responsive pass. Each pull request must leave the site deployable. Do not rewrite the domain layer and the interface in the same pull request.

If something in `docs/SPEC.md` is ambiguous, choose the interpretation that keeps the agent's part smaller and the human's part clearer, and say what you chose in the pull request.
