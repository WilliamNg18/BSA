import type { ManualLoopMonthInputs } from "@/lib/domain/baseline";

export const PROCESS_FIELDS = [
  { key: "manualLoopItems", label: "Items in the monthly referral loop" },
  { key: "gatheringMinutesToday", label: "Today gathering minutes per item" },
  { key: "judgingMinutesToday", label: "Today judging minutes per item" },
  { key: "doubleCheckPercent", label: "Today judgements double-checked (%)" },
  { key: "builtJudgingMinutes", label: "With the agent judging minutes per item" },
  { key: "preventionPercent", label: "Central bet: referrals prevented at pharmacy (%)" },
  { key: "clearancePercent", label: "Remainder cleared by code (%)" },
  { key: "abstentionPercent", label: "Post-clearance queue abstained (%)" },
  { key: "mysCompletionMinutes", label: "Pharmacy MYS minutes per referral" },
  { key: "monthlyItems", label: "Whole-service items a month" },
  { key: "epsPercent", label: "EPS share (%)" },
  { key: "type1Percent", label: "Share reaching Type 1 (%)" },
  { key: "type2Percent", label: "Share reaching Type 2 (%)" },
  { key: "staffTouchPercent", label: "Staff-touch share (%)" },
  { key: "type1KeySeconds", label: "Difficult-paper keying seconds" },
  { key: "type1ConfirmSeconds", label: "Declaration confirmation seconds" },
] as const satisfies readonly { key: keyof ManualLoopMonthInputs; label: string }[];
