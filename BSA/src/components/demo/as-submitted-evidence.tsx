import type { PaperReconciliation } from "@/lib/domain/paper-reconciliation";
import type { SubmissionReplica } from "@/lib/domain/submission-fidelity";
import { useSubmittedCase } from "@/hooks/use-submitted-case";
import { PaperScannerComparison } from "@/components/demo/paper-scanner-comparison";

const fieldLabels: Record<string, string> = {
  prescribedCode: "Prescribed product and pack code",
  product: "Prescribed product",
  strength: "Prescribed strength",
  dispensedCode: "Endorsed product and pack code",
  dispensedName: "Endorsed product",
  supplyRecord: "Pharmacy's actual supply record",
};

function FieldValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span>Not supplied</span>;
  if (value === "") return <span>Blank</span>;
  if (Array.isArray(value)) return value.length
    ? <ol className="space-y-3">{value.map((item, index) => <li key={index}><FieldValue value={item} /></li>)}</ol>
    : <span>None supplied</span>;
  if (typeof value === "object") return <dl className="grid gap-3">
    {Object.entries(value).map(([key, field]) => <div key={key} className="min-w-0">
      <dt className="font-medium">{fieldLabels[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2")}</dt>
      <dd className="whitespace-pre-wrap break-words"><FieldValue value={field} /></dd>
    </div>)}
  </dl>;
  return <span>{String(value)}</span>;
}

export function AsSubmittedEvidence({ submission, reconciliation }: {
  submission: SubmissionReplica;
  reconciliation: PaperReconciliation | null;
}) {
  const revision = submission.asSubmitted;
  if (revision.channel === "paper" && !reconciliation) {
    return <p role="alert">The submitted paper reconciliation is unavailable.</p>;
  }
  return <div className="w-full min-w-0 space-y-4" data-as-submitted-revision={revision.number}>
    {revision.channel === "paper" && reconciliation
      ? <PaperScannerComparison submission={submission} reconciliation={reconciliation} />
      : <section aria-label={submission.heading} className="space-y-4 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">{submission.heading}</h2>
        <p className="text-sm">Read-only EPS message. Corrections require a pharmacy resubmission.</p>
        {revision.epsPrescription
          ? <FieldValue value={revision.epsPrescription} />
          : <p role="alert">The original EPS claim message is unavailable.</p>}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="font-medium">Submitted endorsement text</dt><dd className="whitespace-pre-wrap break-words"><FieldValue value={revision.endorsementText} /></dd></div>
          <div><dt className="font-medium">Received at</dt><dd>{revision.at}</dd></div>
        </dl>
      </section>}
    <details className="rounded-lg border p-3" data-submitted-record>
      <summary className="cursor-pointer font-medium focus-visible:outline-2">Exact submitted record · Read-only</summary>
      <pre className="mt-3 whitespace-pre-wrap break-words text-xs">{JSON.stringify(revision, null, 2)}</pre>
    </details>
  </div>;
}

export function SubmittedCaseEvidence({ caseId }: { caseId: string }) {
  const view = useSubmittedCase(caseId);
  if (view.error || !view.submission) return <p role="alert">{view.error ?? "Submitted evidence is unavailable."}</p>;
  return <AsSubmittedEvidence submission={view.submission} reconciliation={view.reconciliation} />;
}
