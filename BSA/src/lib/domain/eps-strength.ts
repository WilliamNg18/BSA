import { productByCode } from "./reference";
import { EPS_STRENGTH_COPY } from "./eps-error-evidence";
import type { EpsPrescription, GateCheck, Product } from "./types";

export const EPS_STRENGTH_CASE_ID = "SYN-FQ123-MISMATCH";
export const EPS_STRENGTH_CORRECT_CODE = "SYN-AMLO10-28";
export const EPS_STRENGTH_SELECTED_CODE = "SYN-AMLO5-28";

export type EpsStrengthPrescription = EpsPrescription & {
  readonly supplyRecord?: { readonly productCode: string; readonly quantity: number };
};

export interface EpsStrengthPack {
  readonly code: string;
  readonly name: string;
  readonly product: string;
  readonly strength: string;
  readonly form: string;
  readonly packSize: number;
}

export interface EpsStrengthSuggestion {
  readonly label: string;
  readonly patch: { readonly dispensedCode: string; readonly dispensedName: string };
  readonly claimLinePreview: string;
  readonly source: "your agent's suggestion from your records";
}

export interface EpsStrengthAssessment {
  readonly checks: readonly GateCheck[];
  readonly complete: boolean;
  readonly gap: string;
  readonly prescribed: EpsStrengthPack | null;
  readonly selected: EpsStrengthPack | null;
  readonly supplied: EpsStrengthPack | null;
  readonly suggestion: EpsStrengthSuggestion | null;
}

type EpsStrengthCardFacts = Omit<EpsStrengthAssessment, "suggestion"> & {
  readonly rule: string;
  readonly ruleLabel: string;
  readonly authorityLabel: string;
};

export type EpsStrengthCard = EpsStrengthCardFacts & (
  | { readonly audience: "pharmacy"; readonly suggestion: EpsStrengthSuggestion | null }
  | { readonly audience: "operator"; readonly suggestion: null }
);

type ProductLookup = (code: string | null) => Product | null;

function knownPack(code: string | undefined, lookup: ProductLookup): EpsStrengthPack | null {
  if (!code) return null;
  const product = lookup(code);
  if (!product || product.code !== code || !Number.isSafeInteger(product.packSize) || product.packSize <= 0) return null;
  const match = /^(.*?)\s+([\d/]+(?:mg|mcg)?)\s+(tablets|capsules)(?: \(generic synthetic\))?$/.exec(product.name);
  if (!match) return null;
  return { code, name: product.name, product: match[1], strength: match[2], form: match[3], packSize: product.packSize };
}

/** Compare the claim selection with independently retained prescription and supply records. */
export function evaluateEpsStrength(
  prescription: EpsStrengthPrescription, lookup: ProductLookup = productByCode,
): EpsStrengthAssessment | null {
  if (!prescription.supplyRecord && !prescription.items.some((item) =>
    [item.prescribedCode, item.dispensedCode].some((code) =>
      code === EPS_STRENGTH_CORRECT_CODE || code === EPS_STRENGTH_SELECTED_CODE))) return null;

  const item = prescription.items[0];
  const prescribed = knownPack(item?.prescribedCode, lookup);
  const selected = knownPack(item?.dispensedCode, lookup);
  const supplied = knownPack(prescription.supplyRecord?.productCode, lookup);
  const singleItem = prescription.items.length === 1;
  const prescriptionKnown = Boolean(singleItem && prescribed && item.product === prescribed.name &&
    item.strength === prescribed.strength && item.form === prescribed.form);
  const selectedKnown = Boolean(singleItem && selected && item.dispensedName === selected.name);
  const suppliedKnown = Boolean(supplied && Number.isSafeInteger(prescription.supplyRecord?.quantity) &&
    (prescription.supplyRecord?.quantity ?? 0) > 0);
  const sourceAgrees = Boolean(prescriptionKnown && suppliedKnown && prescribed?.code === supplied?.code &&
    Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
    item.quantity === prescription.supplyRecord?.quantity && item.quantity === prescribed?.packSize);
  const selectionAgrees = Boolean(sourceAgrees && selectedKnown && selected?.code === prescribed?.code);
  const mismatch = prescribed && selected && prescribed.product === selected.product && prescribed.strength !== selected.strength
    ? `Strength mismatch: prescribed ${prescribed.strength}, selected ${selected.strength}`
    : "Selected product or pack does not match the prescription and supplied product";
  const checks: GateCheck[] = [
    { name: "Prescription product and strength identified", pass: prescriptionKnown,
      detail: prescriptionKnown ? `${prescribed!.name}, ${item.quantity}` : "A single prescription must agree with its catalogue product, strength and form." },
    { name: "Selected claim pack identified", pass: selectedKnown,
      detail: selectedKnown ? selected!.name : "The selected code and name must identify one known catalogue pack." },
    { name: "Actual pharmacy supply record available", pass: suppliedKnown,
      detail: suppliedKnown ? `${supplied!.name}, ${prescription.supplyRecord!.quantity}` : "The selected claim is not evidence of what was supplied." },
    { name: "Prescription and actual supply agree", pass: sourceAgrees,
      detail: sourceAgrees ? "Retained product, quantity and pack agree." : "Reconcile the prescription and actual supply record; no correction value is inferred." },
    { name: "Selected product, strength and pack match the source", pass: selectionAgrees,
      detail: selectionAgrees ? "The selected claim matches the prescription and actual supply record." : mismatch },
  ];
  const complete = checks.every((entry) => entry.pass);
  const suggestion: EpsStrengthSuggestion | null = sourceAgrees && !selectionAgrees && prescribed ? {
    label: `Select ${prescribed.name}, ${item.quantity}`,
    patch: { dispensedCode: prescribed.code, dispensedName: prescribed.name },
    claimLinePreview: `${prescribed.name}, ${item.quantity} | product and pack code: ${prescribed.code} | quantity: ${item.quantity}`,
    source: "your agent's suggestion from your records",
  } : null;
  return {
    checks, complete, prescribed, selected, supplied, suggestion,
    gap: complete ? "None" : checks.filter((entry) => !entry.pass).map((entry) => entry.detail).join("; "),
  };
}

/** Audience changes the displayed advice, never the source assessment or routing. */
export function epsStrengthForAudience(
  assessment: EpsStrengthAssessment, audience: "pharmacy" | "operator",
): EpsStrengthCard {
  const { suggestion, ...facts } = structuredClone(assessment);
  const common = {
    ...facts, rule: EPS_STRENGTH_COPY.rule, ruleLabel: EPS_STRENGTH_COPY.ruleLabel,
    authorityLabel: EPS_STRENGTH_COPY.authorityLabel,
  };
  return audience === "pharmacy"
    ? { ...common, audience, suggestion }
    : { ...common, audience, suggestion: null };
}

/** Prepare a claim-only correction. This never sends, acknowledges, releases or rewrites source records. */
export function applyEpsStrengthCorrection(
  prescription: EpsStrengthPrescription, lookup: ProductLookup = productByCode,
): EpsStrengthPrescription {
  const suggestion = evaluateEpsStrength(prescription, lookup)?.suggestion;
  if (!suggestion) throw new Error("No source-backed EPS strength correction is available.");
  const corrected = structuredClone(prescription);
  return {
    ...corrected,
    items: corrected.items.map((item) => ({ ...item, ...suggestion.patch })),
  };
}
