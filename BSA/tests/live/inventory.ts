import { DEMO_STEPS } from "../../src/lib/domain/demo-steps";
import { DEMO_MODES, DESKTOP_WIDTHS, PLAYABLE_CYCLES } from "../support/desktop-matrix";

export const LIVE_CHECKS = {
  root: "01 Root starts Agent Off with ordinary production observer absent",
  routes: "02 Every current route toggles On and Off without browser errors",
  model: "03 Edited shared monthly assumptions agree across both sides",
  claims: "04 Exactly four playable claims retain their current identity",
  queue: "05 Staff work excludes automatic items and background actions",
  deepLinks: "06 Current deep links return the application with strict headers",
  reset: "07 Reset restores the four seeds and Agent Off while retaining perspective",
  background: "08 Historical cases are labelled background and not playable deep links",
} as const;

export const LIVE_CYCLE_MODES = ["both", "switched"] as const;
export const LIVE_PERSPECTIVES = ["pharmacy", "nhsbsa", "both"] as const;
export const headerCheckTitle = (perspective: typeof LIVE_PERSPECTIVES[number]) =>
  `15 Single header Agent toggle on every route in ${perspective}`;
export const systemDesignTitle = (width: typeof DESKTOP_WIDTHS[number]) =>
  `09 System design sections, contents, exclusive reference mapping and axe, ${width} px`;
export const desktopStepTitle = (number: number, enabled: boolean) => {
  const step = DEMO_STEPS.find((entry) => entry.number === number);
  if (!step) throw new Error(`Unknown desktop checklist step ${number}.`);
  return `31 Desktop step ${String(number).padStart(2, "0")}: ${step.title}, Agent ${enabled ? "On" : "Off"}, 1440 px, axe`;
};
export const desktopNavigationTitle = (width: typeof DESKTOP_WIDTHS[number], enabled: boolean) =>
  `32 All eleven desktop steps Back and Next, Agent ${enabled ? "On" : "Off"}, ${width} px`;
export const fourCaseCycleTitle = (id: typeof PLAYABLE_CYCLES[number]["id"], enabled: boolean, mode: typeof LIVE_CYCLE_MODES[number]) =>
  `33 Full ${id} shared cycle and both side buttons at every state, Agent ${enabled ? "On" : "Off"}, ${mode}`;
export const EXTENDED_REQUIREMENTS = {
  recommendation: "34 Always-visible recommendation contract on every actual item view",
  preview: "35 Concrete suggested values and exact applied previews without implicit submission",
  paper: "36 Complete, missing, scanner and unreconciled paper paths with safe human actions",
  transition: "37 Actual cross-side transitions within one second for four cases and three perspectives",
  guided: "38 Extended paper recommendation story through demo steps seven to ten",
} as const;
export const extendedRequirementTitle = (requirement: keyof typeof EXTENDED_REQUIREMENTS, width: typeof DESKTOP_WIDTHS[number], enabled: boolean) =>
  `${EXTENDED_REQUIREMENTS[requirement]}, ${width} px, Agent ${enabled ? "On" : "Off"}`;

export const LIVE_CHECKLIST = [
  ...Object.values(LIVE_CHECKS),
  ...DESKTOP_WIDTHS.map(systemDesignTitle),
  ...LIVE_PERSPECTIVES.map(headerCheckTitle),
  ...DEMO_STEPS.flatMap((step) => DEMO_MODES.map((enabled) => desktopStepTitle(step.number, enabled))),
  ...DESKTOP_WIDTHS.flatMap((width) => DEMO_MODES.map((enabled) => desktopNavigationTitle(width, enabled))),
  ...PLAYABLE_CYCLES.flatMap((scenario) => DEMO_MODES.flatMap((enabled) => LIVE_CYCLE_MODES.map((mode) => fourCaseCycleTitle(scenario.id, enabled, mode)))),
  ...(Object.keys(EXTENDED_REQUIREMENTS) as (keyof typeof EXTENDED_REQUIREMENTS)[])
    .flatMap((requirement) => DESKTOP_WIDTHS.flatMap((width) => DEMO_MODES.map((enabled) => extendedRequirementTitle(requirement, width, enabled)))),
];
