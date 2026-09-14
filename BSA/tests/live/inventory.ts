export const LIVE_CHECKS = {
  root: "01 Root Overview starts Agent Off and serves the approved build",
  routes: "02 Every current route toggles On and back Off without errors",
  model: "03 Shared monthly inputs update both process columns and Scene figures",
  cards: "04 Four case cards retain automatic, Type 2 and unconfirmed Type 1 routes",
  pharmacy: "05 Three pharmacy scenarios remain advisory in both modes",
  claims: "06 Claims seed list opens a matching seeded claim and history",
  queue: "07 Actual staff work and separate monthly projections survive Agent changes",
  roundtrip: "08 Full Off then On round trips retain Follow and explicit Pharmacy and NHSBSA views",
  paper: "09 D abstains until human capture and retains history through paper referral",
  deterministic: "10 Case E remains deterministic without an agent call",
  replay: "11 Case B July replay is Sufficient while August refers back",
  deepLinks: "12 Six root deep links return the application with strict headers",
  reset: "13 Reset restores seeded claims, calculator and Agent Off",
  perspective: "14 Perspectives preserve the same submitted item and human decision Off then On without Reset",
  conflict: "16 C confirmation returns to human review without resolving 56 versus 84",
  historical: "17 F retains its original human record through mode changes and replay",
  completedCapture: "18 Complete paper retains human capture and existing pricing without Type 2 judgement",
  hillcrest: "19 Hillcrest is the only operational pharmacy and background entries are unclickable",
  visibleEps: "20 Visible EPS complete, missing-date and generic-brand scenarios send only explicit claims",
  declaredPaper: "21 Worked August paper declaration reaches a Sufficient recommendation after human confirmation",
  paperConflict: "22 Contradictory capture of a complete declaration still abstains without invented agreement",
  sixChapters: "23 Six stakeholder chapters retain all nine stops and the editable central bet",
  genericCorrection: "25 Generic EPS referral is corrected, explicitly resubmitted and human-rechecked on the same item",
} as const;

export const LIVE_CYCLE_MODES = ["both", "switched"] as const;
export const wholeCycleTitle = (enabled: boolean, mode: typeof LIVE_CYCLE_MODES[number]) =>
  `24 Same D paper item completes submission, referral, correction, recheck and payment state: Agent ${enabled ? "On" : "Off"}, ${mode}`;
export const LIVE_PERSPECTIVES = ["pharmacy", "nhsbsa", "both"] as const;
export const headerCheckTitle = (perspective: typeof LIVE_PERSPECTIVES[number]) =>
  `15 Single header Agent toggle on every route in ${perspective}`;
export const LIVE_CHECKLIST = [...Object.values(LIVE_CHECKS), ...LIVE_PERSPECTIVES.map(headerCheckTitle),
  ...[false, true].flatMap((enabled) => LIVE_CYCLE_MODES.map((mode) => wholeCycleTitle(enabled, mode)))];
