import { cn } from "@/lib/utils";
import type { ExceptionCase } from "@/lib/domain/types";

// A SYNTHETIC prescription form drawn in SVG. It is a stand-in for a scanned
// FP10-style form, not a reproduction of one. Regions the agent read are drawn
// as highlighted boxes with labels so the operator can see WHERE on the form a
// value came from.

export function PrescriptionForm({
  c,
  highlight,
  className,
  compact = false,
}: {
  c: ExceptionCase;
  highlight?: string[];
  className?: string;
  compact?: boolean;
}) {
  const poor = c.imageStyle === "handwritten_poor";
  const hand = c.imageStyle !== "printed";
  const font = hand ? "'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive" : "ui-monospace, 'Courier New', monospace";
  const regions = c.regions.filter((r) => !highlight || highlight.includes(r.id));
  const item = c.regions.find((r) => r.id === "item");
  const endorsement = c.regions.find((r) => r.id === "endorsement");

  return (
    <figure className={cn("overflow-hidden rounded-lg border bg-white shadow-sm", className)}>
      <svg
        viewBox="0 0 100 62"
        role="img"
        aria-label={`Synthetic scanned prescription form for case ${c.id}. Item line reads: ${item?.text ?? "none"}. Endorsement margin reads: ${endorsement?.text || "empty"}.`}
        className={cn("block w-full", poor && "opacity-80")}
        style={poor ? { filter: "blur(0.35px) contrast(0.85)", transform: "rotate(-1.2deg) scale(1.02)" } : undefined}
      >
        <rect x="0" y="0" width="100" height="62" className="fill-emerald-50" />
        {/* noise for the poor scan */}
        {poor && (
          <g className="fill-slate-400/40">
            {Array.from({ length: 60 }).map((_, i) => (
              <circle key={i} cx={(i * 37) % 100} cy={(i * 53) % 62} r={0.25 + ((i * 7) % 3) / 10} />
            ))}
            <rect x="0" y="0" width="100" height="4" className="fill-slate-300/50" />
          </g>
        )}
        {/* header */}
        <rect x="4" y="3" width="92" height="9" className="fill-white stroke-emerald-700" strokeWidth="0.3" />
        <text x="6" y="6.5" fontSize="2.2" className="fill-emerald-900" fontWeight="700">SYNTHETIC PRESCRIPTION FORM</text>
        <text x="6" y="10" fontSize="1.8" className="fill-slate-700">Patient: {c.patientLabel}   Age: --   NHS No: 000 000 0000</text>
        <text x="72" y="6.5" fontSize="1.8" className="fill-slate-700">Form ref: {c.id}</text>
        <text x="72" y="10" fontSize="1.8" className="fill-slate-700">Demo only: not a real form</text>

        {/* body: items column and endorsement margin */}
        <rect x="4" y="15" width="61" height="34" className="fill-white stroke-emerald-700" strokeWidth="0.3" />
        <rect x="67" y="15" width="29" height="34" className="fill-white stroke-emerald-700" strokeWidth="0.3" />
        <text x="6" y="18.5" fontSize="1.8" className="fill-emerald-900" fontWeight="700">Prescribed items</text>
        <text x="69" y="18.5" fontSize="1.8" className="fill-emerald-900" fontWeight="700">Pharmacy endorsement</text>
        <text x="69" y="21" fontSize="1.4" className="fill-slate-500">(for dispenser use)</text>

        {/* item line */}
        <text x="7" y="40" fontSize={hand ? 2.6 : 2.3} className={cn(poor ? "fill-slate-500" : "fill-slate-900")} style={{ fontFamily: font }}>
          {item?.text ?? ""}
        </text>
        <line x1="7" y1="42" x2="62" y2="42" className="stroke-slate-300" strokeWidth="0.2" />
        <text x="7" y="46" fontSize="1.6" className="fill-slate-500">Dispensed: {c.extracted.dispensingDate}   Pharmacy: {c.pharmacy.name} ({c.pharmacy.contractorCode})</text>

        {/* endorsement text */}
        <text
          x="69"
          y="40"
          fontSize={hand ? 2.8 : 2.3}
          className={cn(poor ? "fill-slate-500" : "fill-blue-900")}
          style={{ fontFamily: font, transform: hand ? "rotate(-3deg)" : undefined, transformOrigin: "69px 40px" }}
        >
          {endorsement?.text ?? ""}
        </text>

        {/* footer */}
        <rect x="4" y="52" width="92" height="7" className="fill-white stroke-emerald-700" strokeWidth="0.3" />
        <text x="6" y="55.5" fontSize="1.8" className="fill-slate-700">Prescriber: {c.extracted.prescriber}</text>
        <text x="60" y="55.5" fontSize="1.8" className="fill-slate-700">Signature: ~~~~~~~~   Date: {c.extracted.dispensingDate}</text>

        {/* highlighted regions */}
        {regions.map((r) => (
          <g key={r.id}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="0.8" className={cn("fill-transparent", r.id === "endorsement" ? "stroke-teal-600" : "stroke-sky-600")} strokeWidth="0.6" strokeDasharray="1.2 0.6" />
            <rect x={r.x} y={r.y - 3.2} width={Math.min(r.w, 30)} height="3" rx="0.5" className={r.id === "endorsement" ? "fill-teal-600" : "fill-sky-600"} />
            <text x={r.x + 1} y={r.y - 1} fontSize="1.7" className="fill-white" fontWeight="700">
              {r.label} · read {r.confidence.toFixed(2)}
            </text>
          </g>
        ))}
      </svg>
      {!compact && (
        <figcaption className="border-t bg-background px-3 py-2 text-xs text-muted-foreground">
          Synthetic form. Dashed boxes are the regions the layout model located; the label shows the read confidence for each.
          {poor && " This scan is deliberately poor: skewed, faint and speckled."}
        </figcaption>
      )}
    </figure>
  );
}
