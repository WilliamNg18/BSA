import { CheckCircle2, AlertTriangle } from "lucide-react";
import { CompactTooltip as Tooltip, CompactTooltipContent as TooltipContent, CompactTooltipTrigger as TooltipTrigger } from "@/components/ui/compact-tooltip";
import { cn } from "@/lib/utils";

export function PainMarker({ resolved, pain, resolution }: { resolved: boolean; pain: string; resolution: string }) {
  const text = resolved ? resolution : pain;
  const Icon = resolved ? CheckCircle2 : AlertTriangle;
  return <Tooltip><TooltipTrigger asChild><button type="button" data-pain-marker={resolved ? "resolved" : "open"} className={cn("inline-flex items-center gap-2 rounded-md border px-2 py-1 text-left text-xs transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2", resolved ? "border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100" : "border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-100")}><Icon className="size-4 shrink-0" aria-hidden="true" />{resolved ? "Assisted" : "Manual"}: {text}</button></TooltipTrigger><TooltipContent>{text}</TooltipContent></Tooltip>;
}