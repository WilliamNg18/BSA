import { type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Slot } from "radix-ui";
import { CompactTooltipContext, useCompactTooltip, useCompactTooltipState } from "@/hooks/use-compact-overlays";
import { cn } from "@/lib/utils";

export function CompactTooltipProvider({ children }: { children: ReactNode }) { return children; }

export function CompactTooltip({ children }: { children: ReactNode }) {
  const tooltip = useCompactTooltipState();
  return <CompactTooltipContext.Provider value={tooltip}>{children}</CompactTooltipContext.Provider>;
}

export function CompactTooltipTrigger({ asChild, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: Omit<ComponentProps<"button">, "ref"> & { asChild?: boolean }) {
  const tooltip = useCompactTooltip();
  const Component = asChild ? Slot.Root : "button";
  return <Component {...props} type="button" ref={(node) => { tooltip.reference.current = node; }} aria-describedby={[props["aria-describedby"], tooltip.open ? tooltip.id : undefined].filter(Boolean).join(" ") || undefined}
    onPointerEnter={(event) => { onPointerEnter?.(event); if (!event.defaultPrevented && event.pointerType !== "touch") tooltip.update("hover", true); }}
    onPointerLeave={(event) => { onPointerLeave?.(event); if (!event.defaultPrevented) tooltip.update("hover", false); }}
    onFocus={(event) => { onFocus?.(event); if (!event.defaultPrevented) tooltip.update("focus", true); }}
    onBlur={(event) => { onBlur?.(event); if (!event.defaultPrevented) tooltip.update("focus", false); }} />;
}

export function CompactTooltipContent({ children, className, ...props }: ComponentProps<"div">) {
  const tooltip = useCompactTooltip();
  if (!tooltip.open) return null;
  return createPortal(
    <section aria-label="Contextual help">
    <div {...props} ref={tooltip.floating} style={tooltip.position.style} role="tooltip" id={tooltip.id} data-slot="tooltip-content" data-side={tooltip.position.side}
      onPointerEnter={() => tooltip.update("hover", true)} onPointerLeave={() => tooltip.update("hover", false)}
      className={cn("z-50 w-fit max-w-[calc(100vw-1rem)] rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 before:absolute before:inset-x-0 before:h-2 before:content-[''] data-[side=top]:before:top-full data-[side=bottom]:before:bottom-full", className)}>
      {children}
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 size-2 -translate-x-1/2 rotate-45 rounded-[2px] bg-foreground" style={tooltip.position.side === "top" ? { bottom: -4 } : { top: -4 }} />
    </div>
    </section>
  , document.body);
}