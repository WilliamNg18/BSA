import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageSection } from "@/components/page-section";
import { BoundaryTag } from "@/components/demo/labels";
import { ARCHITECTURE, NOT_BUILT } from "@/lib/domain/content";
import { TOOL_DEFINITIONS } from "@/lib/domain/tools";
import { cn } from "@/lib/utils";

const BUILT: Record<string, string> = {
  "Built for real": "bg-emerald-700 text-white",
  Mocked: "bg-amber-600 text-white",
  "Not built": "bg-slate-600 text-white",
};

export function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Technical architecture and the path to production</h1>
        <p className="max-w-3xl text-muted-foreground">
          Offline synthetic prototype. Production mappings are proposals, not verified estate capabilities; integration, security and operational reliability need validation.
        </p>
      </div>

      <PageSection title="The flow, once" description="Read-only against every existing system. Nothing the new component does can block an item.">
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed" aria-label="Architecture flow">
{`EXISTING (unchanged; read-only from the new component)
  scanners + capture  -->  extracted fields + image store  -->  pricing (straightforward items)  -->  exception routing to operators
                                                                                                          |  exception event
NEW: EXCEPTION CASE BUILDER (inside the existing accredited landing zone, UK region)                       v
  [ingress]   Service Bus topic ........................ { item_id, image_ref, fields, routing_reason }
  [tier 0]    Azure Functions (Durable) ................ deterministic pre-checks: required? mandatory fields? quality? coverage?
  [agent]     Foundry Agent Service .................... PLAN -> GATHER -> RETRIEVE -> RECONCILE -> ASSESS -> RECOMMEND | ABSTAIN
                 tools: read_image_region (Document Intelligence layout), lookup_product_pack, lookup_claim,
                        check_history, retrieve_tariff (AI Search, effective-date filter), run_endorsement_checks, validate_citation
                 model: Azure OpenAI, constrained call, structured output, three samples, cites retrieved passages only
  [gate]      Azure Function ........................... compliance gate: pure code the model cannot influence
  [record]    Cosmos DB (append-only) .................. versions pinned: Tariff, model, prompt; replayable
  [surface]   operator case pack ....................... inside the queue tool if extensible; else a thin web app
  [human]     operator decides ......................... accept | amend | request information | refer back | escalate, with reason

  [pharmacy]  Manage Your Service on claim submission ... same kernel, advisory, never blocks; later: supplier API into dispensing systems
  [evals]     golden set in CI ......................... gates every prompt, model, corpus-version or code change
  [observe]   Application Insights + Azure Monitor + agent tracing; Purview lineage; Entra ID; Key Vault; Private Link
  PRICING never enters this picture. PATIENT IDENTITY is redacted before any model call.`}
        </pre>
      </PageSection>

      <PageSection title="Prototype to production, component by component" description="What is built for real, what is mocked, what is deliberately not built, and what NHSBSA owns.">
        <div className="overflow-x-auto rounded-lg border" role="region" aria-label="Architecture mapping" tabIndex={0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>In this prototype</TableHead>
                <TableHead>In production</TableHead>
                <TableHead>NHSBSA owns</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ARCHITECTURE.map((r) => (
                <TableRow key={r.component}>
                  <TableCell className="whitespace-normal align-top font-medium">{r.component}</TableCell>
                  <TableCell className="whitespace-normal align-top text-sm">{r.prototype}</TableCell>
                  <TableCell className="whitespace-normal align-top text-sm">{r.production}</TableCell>
                  <TableCell className="whitespace-normal align-top text-sm text-muted-foreground">{r.owns}</TableCell>
                  <TableCell className="align-top"><Badge className={cn("whitespace-normal border-transparent", BUILT[r.built])}>{r.built}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageSection>

      <PageSection title="Tool contracts" description="The interface between the agent and NHSBSA's systems. Every tool is read-only; none can write to a payment.">
        <div className="overflow-x-auto rounded-lg border" role="region" aria-label="Tool definitions" tabIndex={0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Output</TableHead>
                <TableHead>Mocked with</TableHead>
                <TableHead>Production</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TOOL_DEFINITIONS.map((t) => (
                <TableRow key={t.name}>
                  <TableCell className="whitespace-normal align-top">
                    <div className="flex flex-col gap-1">
                      <code className="font-mono text-xs">{t.name}</code>
                      <BoundaryTag cls={t.cls} short className="w-fit" />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal align-top text-sm">{t.purpose}</TableCell>
                  <TableCell className="whitespace-normal align-top font-mono text-xs">{t.input}</TableCell>
                  <TableCell className="whitespace-normal align-top font-mono text-xs">{t.output}</TableCell>
                  <TableCell className="whitespace-normal align-top text-sm text-muted-foreground">{t.mock}</TableCell>
                  <TableCell className="whitespace-normal align-top text-sm">{t.production}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <PageSection title="Deliberately not built" description="Each is well-understood integration work. None was the risk.">
          <ul className="space-y-1.5">
            {NOT_BUILT.map((n) => <li key={n} className="rounded-md border p-2.5 text-sm">{n}</li>)}
          </ul>
        </PageSection>
        <PageSection title="Why the prototype is shaped this way" description="Speed from testing the highest-risk assumption early.">
          <ul className="space-y-1.5 text-sm">
            <li className="rounded-md border p-2.5"><h3 className="font-medium">Offline and deterministic</h3><p>Scripted interpretation; no runtime data leaves the browser. Production model integration requires separate validation.</p></li>
            <li className="rounded-md border p-2.5"><h3 className="font-medium">Executable controls</h3><p>Synthetic rules, gate and composite are code. Production requirements still need independent review.</p></li>
            <li className="rounded-md border p-2.5"><h3 className="font-medium">Feature flag</h3><p>Off withholds assistance, not evidence or human authority. Case state and records remain unchanged.</p></li>
            <li className="rounded-md border p-2.5"><h3 className="font-medium">Versioned corpus</h3><p>Three synthetic monthly versions support counterfactual replay without rewriting history.</p></li>
            <li className="rounded-md border p-2.5"><h3 className="font-medium">Visible contracts</h3><p>Review tool contracts and access constraints before planning integration.</p></li>
          </ul>
        </PageSection>
      </div>
    </div>
  );
}
