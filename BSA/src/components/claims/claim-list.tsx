import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClaimStateBadge } from "@/components/claims/claim-state-badge";
import type { ClaimFixture } from "@/components/claims/fixtures";

export function ClaimList({
  claims,
  selectedId,
  onSelect,
}: {
  claims: ClaimFixture[];
  selectedId: string | null;
  onSelect: (caseId: string) => void;
}) {
  return (
    <Table aria-label="Pharmacy claims">
      <TableHeader>
        <TableRow>
          <TableHead>Claim</TableHead>
          <TableHead>Endorsement</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {claims.map((c) => (
          <TableRow
            key={c.caseId}
            data-state={c.caseId === selectedId ? "selected" : undefined}
            aria-current={c.caseId === selectedId ? "true" : undefined}
            className="cursor-pointer"
            onClick={() => onSelect(c.caseId)}
          >
            <TableCell>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(c.caseId);
                }}
                className="rounded-sm text-left font-medium underline-offset-2 hover:underline focus-visible:outline-2"
                aria-current={c.caseId === selectedId ? "true" : undefined}
              >
                {c.caseId}
              </button>
              <p className="text-xs text-muted-foreground">{c.title}</p>
            </TableCell>
            <TableCell className="font-mono text-xs">{c.endorsementText || "None"}</TableCell>
            <TableCell><ClaimStateBadge state={c.state} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
