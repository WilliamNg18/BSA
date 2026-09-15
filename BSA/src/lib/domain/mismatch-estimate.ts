import { EPS_MISMATCH_ESTIMATE } from "./eps-error-evidence";

export interface MismatchEstimateSlice {
  mismatchSharePercent: string;
  setMismatchSharePercent: (value: string) => void;
}

export interface MismatchEstimate {
  share: number;
  submittedClaimVolume: number;
  today: 0;
  withAgent: number;
}

export interface MismatchEstimateSelection {
  result: MismatchEstimate | null;
  errors: { sharePercent?: string; submittedClaimVolume?: string };
}

export const createMismatchSharePercent = () => String(EPS_MISMATCH_ESTIMATE.defaultShare * 100);

const countFormat = new Intl.NumberFormat("en-GB", { maximumSignificantDigits: 15 });
const tinyCountFormat = new Intl.NumberFormat("en-GB", { maximumSignificantDigits: 15, notation: "scientific" });

export function formatMismatchEstimate(value: number): string {
  return (value > 0 && value < 0.0001 ? tinyCountFormat : countFormat).format(value);
}

/** Independent coverage scenario, never a subtraction from the referral-loop cohorts. */
export function calculateMismatchEstimate(submittedClaimVolume: number, share: number): MismatchEstimate {
  if (!Number.isSafeInteger(submittedClaimVolume) || submittedClaimVolume < 0 || submittedClaimVolume > 1_000_000_000) {
    throw new RangeError("Submitted-claim volume must be a whole number from 0 to 1,000,000,000.");
  }
  if (!Number.isFinite(share) || share < 0 || share > 1) {
    throw new RangeError("Mismatch share must be a fraction from 0 to 1.");
  }
  return { share, submittedClaimVolume, today: 0, withAgent: submittedClaimVolume * share };
}

export function selectMismatchEstimate(sharePercentDraft: string, submittedClaimVolume: number | null): MismatchEstimateSelection {
  const text = typeof sharePercentDraft === "string" ? sharePercentDraft.trim() : "";
  const [wholeText, fraction = ""] = text.split(".");
  const whole = wholeText.replace(/^0+/, "") || "0";
  const validDecimal = /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text);
  const aboveMaximum = whole.length > 3 || whole.length === 3 && (whole > "100" || whole === "100" && /[1-9]/.test(fraction));
  const percent = Number(text);
  const share = percent / 100;
  const errors: MismatchEstimateSelection["errors"] = {};
  if (!validDecimal || aboveMaximum || !Number.isFinite(percent) || share === 0 && /[1-9]/.test(text)) {
    errors.sharePercent = "Enter a percentage from 0 to 100, using ordinary decimal notation.";
  }
  if (submittedClaimVolume === null || !Number.isSafeInteger(submittedClaimVolume) || submittedClaimVolume < 0 || submittedClaimVolume > 1_000_000_000) {
    errors.submittedClaimVolume = "Correct the shared monthly inputs to establish total submitted-claim volume.";
  }
  if (Object.keys(errors).length || submittedClaimVolume === null) return { result: null, errors };
  return { result: calculateMismatchEstimate(submittedClaimVolume, share), errors };
}
