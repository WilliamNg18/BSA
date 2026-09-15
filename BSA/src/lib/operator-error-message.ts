export function operatorErrorMessage(cause: unknown): string {
  if (!(cause instanceof Error)) return "Action unavailable. Reopen the item.";
  if (cause.message.startsWith("The operator note contains a proposed corrected value.")) {
    return "Proposed corrected value rejected. Name fields and rules; request accuracy.";
  }
  return cause.message;
}
