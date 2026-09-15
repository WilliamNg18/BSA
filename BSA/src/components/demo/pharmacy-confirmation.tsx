import { useAppStore } from "@/lib/store";

export function PharmacyConfirmation({ caseId }: { caseId: string }) {
  const revision = useAppStore((state) => state.caseRevisions[caseId]?.at(-1));
  if (!revision?.confirmation) return null;
  return <section aria-label="Pharmacy confirmation" data-pharmacy-confirmation={caseId}
    data-confirmation-revision={revision.number} className="space-y-2 rounded-lg border p-3">
    <h3 className="font-semibold">Pharmacy confirmation</h3>
    <p role="status" className="whitespace-pre-wrap break-words text-sm">{revision.confirmation}</p>
    <span className="text-xs text-muted-foreground">Revision {revision.number} · <time dateTime={revision.at}>{revision.at}</time></span>
  </section>;
}
