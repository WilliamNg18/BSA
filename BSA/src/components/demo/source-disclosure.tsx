import { getDisplaySourceClaim, SOURCE_CLASSES, SOURCE_DOCUMENTS, SOURCE_NAMES, type SourceLocator } from "@/lib/domain/source-claims";

function sourceLocatorLabel(locator: SourceLocator): string {
  if (locator.documentId === "pdf") return `PDF page ${locator.page} · ${locator.section}`;
  const paragraph = (value: number) => `P${String(value).padStart(4, "0")}`;
  return `${locator.part} · ${paragraph(locator.paragraphStart)}${locator.paragraphEnd === locator.paragraphStart ? "" : `–${paragraph(locator.paragraphEnd)}`}`;
}

// Never render raw excerpts or source assertions. Only reviewed, eligible claims
// can supply provenance. Unknown/withheld IDs fail closed rather than leak copy.
export function SourceDisclosure({ claimIds, label = "Sources and qualifications" }: { claimIds: readonly string[]; label?: string }) {
  const claims = [...new Set(claimIds)].map(getDisplaySourceClaim).filter((claim) => claim !== undefined);
  return (
    <details className="rounded-lg border bg-background p-3 text-sm" data-source-disclosure>
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-offset-4">{label}</summary>
      <p className="my-3 text-muted-foreground">Two supplied documents only. Public-source attributions are not independently verified. Case outputs are synthetic, not operational measurements.</p>
      <ul aria-label={label} className="space-y-4 break-words">
        {claims.map((claim) => claim && (
          <li key={claim.id} data-claim-id={claim.id} className="space-y-1 border-l-2 pl-3">
            <p className="font-medium">{claim.id} · {SOURCE_CLASSES[claim.classification]}</p>
            <ul aria-label={`Named sources for ${claim.id}`}>
              {claim.namedSourceIds.map((id) => <li key={id}>{SOURCE_NAMES[id].label} · {SOURCE_NAMES[id].classification}</li>)}
            </ul>
            <ul aria-label={`Document locators for ${claim.id}`}>
              {claim.locators.map((locator, index) => <li key={index}>{SOURCE_DOCUMENTS.find((doc) => doc.id === locator.documentId)?.filename} · {sourceLocatorLabel(locator)}</li>)}
            </ul>
            <ul aria-label={`Qualifications for ${claim.id}`} className="text-muted-foreground">
              {claim.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    </details>
  );
}