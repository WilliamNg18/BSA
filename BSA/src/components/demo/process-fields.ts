import type { ProcessMonthInputs } from "@/lib/domain/baseline";

export const PROCESS_FIELDS: readonly { key: keyof ProcessMonthInputs; label: string; hint: string; integer?: boolean }[] = [
  { key: "monthlyItems", label: "Items a month", hint: "Public-derived default: 100 million is a conservative calculation baseline for the supplied over-100-million total.", integer: true },
  { key: "epsPercent", label: "EPS share (%)", hint: "Public default: approximately 91% EPS claim messages; the remainder is scanned paper." },
  { key: "type1Percent", label: "Share reaching Type 1 (%)", hint: "Public-derived default: 2.2 million product-capture items against the conservative monthly baseline. May overlap Type 2." },
  { key: "type2Percent", label: "Share reaching Type 2 (%)", hint: "Public-derived default: 2 million endorsement-interpretation items against the conservative monthly baseline. May overlap Type 1." },
  { key: "staffTouchPercent", label: "Staff-touch share (%)", hint: "Approximately 4% is supplied public context. The model uses this editable unique-touch assumption, not the sum of overlapping lanes." },
  { key: "type2SecondsToday", label: "Type 2 seconds per item today", hint: "Public default: 13 seconds, the midpoint of the supplied 12 to 14 second average." },
  { key: "investigationMinutesToday", label: "NHSBSA minutes per referral", hint: "Assumption: four minutes investigating each referred-back item, not every Type 2 item." },
  { key: "pharmacyCompletionMinutes", label: "Pharmacy minutes per referral", hint: "Assumption: six minutes completing an endorsement in MYS. Pharmacy labour is separate from NHSBSA labour." },
  { key: "monthlyReferrals", label: "Items referred back a month", hint: "Public default: approximately 85,000 referred-back items. Editing the default creates a scenario, not a new public fact.", integer: true },
  { key: "pharmacyCatchPercent", label: "Would-be referrals caught at pharmacy (%)", hint: "Assumption: 20% corrected before submission. No additional reduction is attributed to the agent." },
  { key: "abstainPercent", label: "Remaining Type 2 items abstained (%)", hint: "Synthetic-set assumption: one of six canonical cases without a reconciled declaration. Not measured effectiveness." },
  { key: "builtJudgingSeconds", label: "Seconds judging a built case", hint: "Assumption: 45 seconds, longer than the 13-second Type 2 average. This is not a universal speed-up." },
  { key: "type1KeySeconds", label: "Difficult-paper keying seconds", hint: "Assumption: 30 seconds for the difficult synthetic paper case, not the public Type 1 throughput average." },
  { key: "type1ConfirmSeconds", label: "Declaration confirmation seconds", hint: "Assumption: 10 seconds for human confirmation of the proposed typed-declaration path. The scan remains unreadable." },
];
