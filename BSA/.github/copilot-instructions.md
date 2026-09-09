Read `AGENTS.md` at the repository root before making any change; it carries the hard constraints. `docs/SPEC.md` is the source of truth for behaviour, `docs/TASK.md` is the brief for the rebuild, and `docs/KNOWN-ISSUES.md` lists what is wrong in the current build.

Non-negotiable: the agent gathers evidence and recommends, deterministic code validates and calculates, a human decides; the application never prices or approves a payment; all data stays synthetic; every action is tagged with its boundary class; accessibility (WCAG 2.2 AA) is a requirement.

Before opening a pull request run `npm run check` and attach screenshots of every affected route in light and dark mode. Use UK English and no em dashes in interface copy.
