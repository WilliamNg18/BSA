import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Shared, presentation-only navigation links between the two views of one
// case. Neither link changes lifecycle state or reads/writes the store; they
// only preserve an existing destination. The claims page (Stream C) can use
// NhsbsaViewLink once it renders a specific case.

export function PharmacyViewLink({ caseId, className }: { caseId: string; className?: string }) {
  return (
    <Button asChild size="sm" variant="ghost" className={className}>
      <Link to={`/pharmacy/claims?case=${caseId}`}>Pharmacy view</Link>
    </Button>
  );
}

export function NhsbsaViewLink({ caseId, className }: { caseId: string; className?: string }) {
  return (
    <Button asChild size="sm" variant="ghost" className={className}>
      <Link to={`/case/${caseId}`}>NHSBSA view</Link>
    </Button>
  );
}
