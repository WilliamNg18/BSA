import { useLocation } from "react-router-dom";
import { DESIGN_DATE, DESIGN_LABELS, DESIGN_PRINCIPLE, DESIGN_SECTIONS, DESIGN_TITLE, PICK_LIST_SOURCE, REFERENCE_EXPLANATION, type DesignTable } from "@/components/how-it-works/content";
import { CaseWSequenceDiagram, ComponentDiagram } from "@/components/how-it-works/diagrams";
import { REFERENCE_MAPPING } from "@/components/how-it-works/reference-mapping";

function ReferenceTable({ table, reference = false }: { table: DesignTable; reference?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border" role="region" tabIndex={0} aria-label={`${table.caption} table`}>
      <table className="w-full table-fixed text-left text-sm tabular-nums" data-reference-mapping={reference || undefined}>
        <caption className="p-4 text-left font-semibold text-foreground">{table.caption}</caption>
        <thead className="border-y bg-muted/40"><tr>{table.headers.map((header) => <th key={header} scope="col" className="p-3 align-top">{header}</th>)}</tr></thead>
        <tbody>{table.rows.map((row) => <tr key={row[0]} className="border-b last:border-0">
          {row.map((cell, index) => index === 0
            ? <th key={index} scope="row" className="break-words p-3 align-top font-medium">{cell}</th>
            : <td key={index} className="break-words p-3 align-top">{cell}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  );
}

export function ArchitecturePage() {
  const { hash } = useLocation();
  const contents = [...DESIGN_SECTIONS.map(({ id, title }) => ({ id, title })), { id: "reference-mapping", title: REFERENCE_MAPPING.caption }];
  return (
    <div className="mx-auto max-w-7xl space-y-6" data-system-design>
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">Technical reference · {DESIGN_DATE} · Synthetic demonstration</p>
        <h1 className="text-2xl font-semibold tracking-tight">{DESIGN_TITLE}</h1>
        <p className="max-w-4xl text-sm">{DESIGN_PRINCIPLE}</p>
      </header>
      <div className="grid grid-cols-[13rem_minmax(0,1fr)] items-start gap-8">
        <nav aria-label="How it works contents" className="sticky top-[calc(var(--app-chrome-height,auto)+1rem)] max-h-[calc(100vh-var(--app-chrome-height,0px)-2rem)] space-y-3 overflow-y-auto rounded-lg border p-3">
          <h2 className="font-semibold">On this page</h2>
          <ol className="space-y-1">{contents.map(({ id, title }) => <li key={id}>
            <a href={`#${id}`} aria-current={hash === `#${id}` ? "location" : undefined}
              onClick={() => document.getElementById(id)?.focus({ preventScroll: true })}
              className="block rounded p-2 text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current aria-[current=location]:bg-muted">
              {title}
            </a>
          </li>)}</ol>
        </nav>
        <div className="min-w-0 space-y-10">
          {DESIGN_SECTIONS.map((section) => <section key={section.id} aria-labelledby={section.id} className="space-y-4" data-design-section={section.id}>
            <div className="space-y-2">
              <h2 id={section.id} tabIndex={-1} className="scroll-mt-6 text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">{section.title}</h2>
              <p className="text-sm font-medium">{DESIGN_LABELS[section.status]}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {section.panels.map((panel) => <article key={panel.title} className="space-y-2 rounded-lg border bg-card p-4" data-design-panel>
                <h3 className="font-semibold">{panel.title}</h3>
                <p className="text-xs font-medium text-muted-foreground">{DESIGN_LABELS[panel.status]}</p>
                <p className="text-sm leading-relaxed" data-design-prose>{panel.text}</p>
              </article>)}
            </div>
            {section.table && <ReferenceTable table={section.table} />}
            {section.id === "architecture" && <><ComponentDiagram /><CaseWSequenceDiagram /></>}
            {section.id === "questions" && <article className="space-y-2 rounded-lg border p-4 text-sm" data-public-evidence>
              <h3 className="font-semibold">Public evidence for the pick-list example</h3>
              <p className="font-medium">{PICK_LIST_SOURCE.label}</p>
              <a href={PICK_LIST_SOURCE.url} className="inline-block rounded underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2">
                {PICK_LIST_SOURCE.title}
              </a>
              <p className="text-muted-foreground">Checked <time dateTime={PICK_LIST_SOURCE.checkedOn}>{PICK_LIST_SOURCE.checkedLabel}</time>; publication date not stated.</p>
              <blockquote className="border-l-2 pl-3">{PICK_LIST_SOURCE.quotation}</blockquote>
              <p>{PICK_LIST_SOURCE.scope}</p>
              <p className="font-medium">{PICK_LIST_SOURCE.boundary}</p>
            </article>}
          </section>)}
          <section aria-labelledby="reference-mapping" className="space-y-4" data-design-section="reference-mapping">
            <h2 id="reference-mapping" tabIndex={-1} className="scroll-mt-6 text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">{REFERENCE_MAPPING.caption}</h2>
            <p className="text-sm font-medium">{DESIGN_LABELS.proposed}</p>
            <p className="text-sm">{REFERENCE_EXPLANATION}</p>
            <ReferenceTable table={REFERENCE_MAPPING} reference />
          </section>
        </div>
      </div>
    </div>
  );
}
