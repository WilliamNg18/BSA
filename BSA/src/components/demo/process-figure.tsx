import type { ReactNode } from "react";
import { CompactTooltip, CompactTooltipContent, CompactTooltipTrigger } from "@/components/ui/compact-tooltip";

export function ProcessFigure({ children, source, explanation, label }: {
  children: ReactNode;
  source: "Public" | "Assumption";
  explanation: string;
  label: string;
}) {
  return <CompactTooltip>
    <CompactTooltipTrigger className="max-w-full rounded-sm text-left underline decoration-dotted underline-offset-4 focus-visible:outline-2" aria-label={`${label}: figure context`}>
      {children}
    </CompactTooltipTrigger>
    <CompactTooltipContent className="max-w-80">{source}: {explanation}</CompactTooltipContent>
  </CompactTooltip>;
}
