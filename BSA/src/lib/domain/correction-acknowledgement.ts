import type { PharmacyCorrectionDraft } from "./lifecycle";

export const CORRECTION_ACKNOWLEDGEMENT_LABEL = "I confirm the corrected information is accurate";

export type CorrectionPayload = Pick<PharmacyCorrectionDraft,
  "revision" | "channel" | "endorsementText" | "declaration" | "paperDeclaration" | "epsPrescription" | "confirmation">;

export interface PayloadAcknowledgement {
  readonly revision: number;
  readonly fingerprint: string;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.entries(value).filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  throw new Error("The correction contains an unsupported payload value.");
}

/** Exact canonical JSON, not a collision-prone hash or a security credential. */
export function correctionFingerprint(draft: CorrectionPayload): string {
  if (!Number.isSafeInteger(draft.revision) || draft.revision < 1) throw new Error("A current correction revision is required.");
  const { revision, channel, endorsementText, declaration, paperDeclaration, epsPrescription, confirmation } = draft;
  return canonicalJson({ revision, channel, endorsementText, declaration, paperDeclaration, epsPrescription, confirmation });
}

export function assertCorrectionAcknowledged(
  draft: CorrectionPayload, expectedRevision: number, acknowledgement?: PayloadAcknowledgement,
): void {
  if (draft.revision !== expectedRevision) throw new Error("The correction draft is stale; reopen the current item.");
  if (!acknowledgement) throw new Error(`${CORRECTION_ACKNOWLEDGEMENT_LABEL} must be checked before resubmitting.`);
  if (acknowledgement.revision !== expectedRevision || acknowledgement.fingerprint !== correctionFingerprint(draft)) {
    throw new Error("The corrected information has changed. Review it and confirm its accuracy again before resubmitting.");
  }
}
