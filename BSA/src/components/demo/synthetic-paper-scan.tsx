import { useId } from "react";
import type { ExceptionCase } from "@/lib/domain/types";
import { scanTextBlocks, wrapScanText } from "./paper-scanner-model";

export function SyntheticPaperScan({ scan, readable }: { scan: ExceptionCase; readable: boolean }) {
  const id = useId();
  const blocks = scanTextBlocks(scan);
  let nextY = 110;
  const positioned = blocks.map((block) => {
    const y = nextY;
    const labelLines = wrapScanText(block.label);
    const bodyY = y + labelLines.length * 24 + 6;
    const height = 34 + (labelLines.length + block.lines.length) * 24;
    nextY += height + 12;
    return { ...block, y, bodyY, height, labelLines };
  });
  return <figure className="rounded-lg border bg-white p-2" data-paper-scan>
    <svg viewBox={`0 0 340 ${nextY + 12}`} role="img" aria-labelledby={`${id}-title ${id}-description`} className="block w-full">
      <title id={`${id}-title`}>{`Synthetic submitted paper scan: ${scan.id}`}</title>
      <desc id={`${id}-description`}>{readable ? "Readable" : "Unreadable"} synthetic source. Original source text, not a declaration or character-recognition result.</desc>
      <rect width="340" height={nextY + 12} rx="8" fill="#f0fdf4" />
      <text x="12" y="30" fontSize="18" fontWeight="700" fill="#14532d">SYNTHETIC PAPER SCAN</text>
      <text x="12" y="57" fontSize="16" fill="#334155">{scan.id}</text>
      <text x="12" y="82" fontSize="16" fill="#334155">{readable ? "Readable source" : "Unreadable source"}</text>
      {positioned.map((block, index) => <g key={`${index}:${block.label}`}>
        <rect x="6" y={block.y - 22} width="328" height={block.height} rx="4" fill="#fff" stroke="#15803d" />
        <text x="14" y={block.y} fontSize="16" fontWeight="600" fill="#14532d">
          {block.labelLines.map((line, lineIndex) => <tspan key={lineIndex} x="14" dy={lineIndex === 0 ? 0 : 24}>{line}</tspan>)}
        </text>
        <text x="14" y={block.bodyY} fontSize="16" fill="#334155" fontFamily="ui-monospace, monospace"
          style={readable ? undefined : { filter: "blur(0.3px)" }}>
          {block.lines.map((line, lineIndex) => <tspan key={lineIndex} x="14" dy={lineIndex === 0 ? 0 : 24}>{line || "\u00a0"}</tspan>)}
        </text>
      </g>)}
    </svg>
  </figure>;
}
