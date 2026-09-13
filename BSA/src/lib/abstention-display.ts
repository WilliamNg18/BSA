/** Concise display aliases only; domain reasons and audit evidence stay unchanged. */
export function abstentionReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    "No governing provision could be retrieved for this endorsement type and date": "No governing provision.",
    "Human-confirmed fields remain unknown, conflicting or unreconciled, or no provision was retrieved.": "Confirmed fields remain unresolved; a provision may be absent.",
    "Source reconciliation is not established from known comparable fields": "Source reconciliation not established.",
    "Missing evidence: Product identified": "Missing product.",
    "Missing evidence: Quantity present": "Missing quantity.",
    "Missing evidence: Dispensing date present": "Missing dispensing date.",
    "Missing evidence: Prescriber present": "Missing prescriber.",
  };
  if (labels[reason]) return labels[reason];
  const quality = /^Image quality ([\d.]+) is below the ([\d.]+) threshold$/.exec(reason);
  if (quality) return `Image quality ${quality[1]}; minimum ${quality[2]}.`;
  const readings = /^Only (\d+) of (\d+) readings agree$/.exec(reason);
  if (readings) return `${readings[1]}/${readings[2]} readings agree.`;
  return reason;
}
