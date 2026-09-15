import { CASE_W_SEQUENCE, COMPONENT_FLOW } from "./content";

const nodes = [
  { x: 15, y: 20, label: "Exception ingress" },
  { x: 290, y: 20, label: "Tier-0 checks" },
  { x: 565, y: 20, label: "Existing pricing" },
  { x: 290, y: 140, label: "Agent runtime" },
  { x: 15, y: 140, label: "Read-only evidence" },
  { x: 565, y: 140, label: "Structured model" },
  { x: 290, y: 260, label: "Code gates" },
  { x: 15, y: 260, label: "Append-only record" },
  { x: 565, y: 260, label: "Operator surface" },
];

export function ComponentDiagram() {
  return (
    <figure className="space-y-4 rounded-lg border p-4">
      <figcaption className="font-semibold">Component diagram: proposed production boundary</figcaption>
      <svg viewBox="0 0 800 405" role="img" aria-labelledby="components-title components-description" className="w-full text-foreground">
        <title id="components-title">Exception case builder components</title>
        <desc id="components-description">Ingress flows to deterministic checks. Straightforward items retain existing pricing. The runtime requests read-only evidence and structured model facts and receives their responses. Code gates run before the record is persisted and feeds the operator surface. The numbered text below gives the complete flow.</desc>
        <defs><marker id="component-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="currentColor" /></marker></defs>
        <g stroke="currentColor" strokeWidth="2" fill="none" markerEnd="url(#component-arrow)">
          <path d="M235 50 H285" /><path d="M510 50 H560" />
          <path d="M400 80 V135" />
          <path d="M290 155 H240" /><path d="M235 185 H285" />
          <path d="M510 155 H560" /><path d="M565 185 H515" />
          <path d="M400 200 V255" /><path d="M290 290 H240" />
          <path d="M125 320 V355 H675 V325" />
        </g>
        {nodes.map(({ x, y, label }) => <g key={label}>
          <rect x={x} y={y} width="220" height="60" rx="8" className="fill-background" stroke="currentColor" />
          <text x={x + 110} y={y + 35} textAnchor="middle" fontSize="16" fill="currentColor">{label}</text>
        </g>)}
        <text x="530" y="100" fontSize="13" fill="currentColor">No pricing write tool</text>
        <text x="400" y="345" textAnchor="middle" fontSize="14" fill="currentColor">Persisted record feeds surface</text>
        <text x="400" y="390" textAnchor="middle" fontSize="14" fill="currentColor">Human exception decision remains outside the model</text>
      </svg>
      <ol className="list-decimal space-y-2 pl-5 text-sm">{COMPONENT_FLOW.map((step) => <li key={step}>{step}</li>)}</ol>
    </figure>
  );
}

const participants = ["Pharmacy", "Pre-check / ingress", "Case builder / gate", "Operator", "Existing pricing"];
const arrows = [
  [0, 1, "1. Claim 5 mg"], [1, 0, "2. Gate 1 + 10 mg preview"], [0, 1, "3. Unchanged Send"],
  [1, 2, "4. Received revision"], [2, 2, "5. Gate 2"], [2, 3, "6. Mismatch: no release"],
  [3, 0, "7. Human referral"], [0, 1, "8. Human Resubmit"],
  [1, 2, "9. Revalidate revision"], [2, 2, "10. Both gates"], [2, 4, "11. Code release if pass"],
] as const;

export function CaseWSequenceDiagram() {
  return (
    <figure className="space-y-4 rounded-lg border p-4">
      <figcaption className="font-semibold">Case W sequence: wrong-strength EPS, proposed integration</figcaption>
      <svg viewBox="0 0 900 740" role="img" aria-labelledby="sequence-title sequence-description" className="w-full text-foreground">
        <title id="sequence-title">SYN-FQ123-MISMATCH wrong-strength sequence</title>
        <desc id="sequence-description">Five lifelines distinguish applying the 10 mg draft from the alternative unchanged 5 mg Send. The unchanged claim fails independent Gate 2 and needs an operator case. A pharmacy correction and acknowledged resubmission are checked again; corrected EPS releases without operator action only if both gates pass. Paper always needs a final human Release.</desc>
        <defs><marker id="sequence-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="currentColor" /></marker></defs>
        {participants.map((label, index) => <g key={label}>
          <rect x={index * 180 + 5} y="5" width="170" height="50" rx="6" className="fill-background" stroke="currentColor" />
          <text x={index * 180 + 90} y="35" textAnchor="middle" fontSize="14" fill="currentColor">{label}</text>
          <path d={`M${index * 180 + 90} 55 V730`} stroke="currentColor" strokeDasharray="5 5" />
        </g>)}
        {arrows.map(([from, to, label], index) => {
          const y = 95 + index * 58;
          const start = from * 180 + 90;
          const end = to * 180 + 90;
          return <g key={label}>
            <path d={from === to ? `M${start} ${y} h65 v20 h-65` : `M${start} ${y} H${end}`} stroke="currentColor" strokeWidth="2" fill="none" markerEnd="url(#sequence-arrow)" />
            <text x={from === to ? start + 5 : (start + end) / 2} y={y - 8} textAnchor={from === to ? "start" : "middle"} fontSize="14" fill="currentColor">{label}</text>
          </g>;
        })}
      </svg>
      <ol className="list-decimal space-y-2 pl-5 text-sm">{CASE_W_SEQUENCE.map((step) => <li key={step}>{step}</li>)}</ol>
    </figure>
  );
}
