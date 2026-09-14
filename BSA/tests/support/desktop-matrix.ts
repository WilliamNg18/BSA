export const DESKTOP_WIDTHS = [1280, 1440] as const;
export const DEMO_MODES = [false, true] as const;
export const PLAYABLE_CYCLES = [
  { id: "EX-24107", step: 3, channel: "eps", kind: "complete" },
  { id: "EX-24112", step: 4, channel: "eps", kind: "missing-date" },
  { id: "SYN-FQ123-MISMATCH", step: 5, channel: "eps", kind: "wrong-pack" },
  { id: "EX-24123", step: 6, channel: "paper", kind: "unreadable" },
] as const;
export type PlayableCycle = typeof PLAYABLE_CYCLES[number];
