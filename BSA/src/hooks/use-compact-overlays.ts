import { createContext, useContext, useId, useLayoutEffect, useEffect, useRef, useState, type CSSProperties } from "react";
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";

function useOverlayPosition(open: boolean, placement: Placement) {
  const reference = useRef<HTMLElement | null>(null);
  const floating = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ style: CSSProperties; side: string }>({ style: { position: "fixed", top: 0, left: 0 }, side: placement.split("-")[0] });
  useLayoutEffect(() => {
    const anchor = reference.current;
    const surface = floating.current;
    if (!open || !anchor || !surface) return;
    let disposed = false;
    const cleanup = autoUpdate(anchor, surface, () => {
      void computePosition(anchor, surface, { strategy: "fixed", placement, middleware: [offset(4), flip(), shift({ padding: 8 })] }).then(({ x, y, placement: actual }) => {
        if (!disposed) setPosition({ style: { position: "fixed", left: x, top: y }, side: actual.split("-")[0] });
      });
    });
    return () => { disposed = true; cleanup(); };
  }, [open, placement]);
  return { reference, floating, position };
}

export function useCompactTooltipState() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const hovered = useRef(false);
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const otherOpened = (event: Event) => { if ((event as CustomEvent<string>).detail !== id) setOpen(false); };
    document.addEventListener("bsa-tooltip-open", otherOpened);
    return () => { clearTimeout(timer.current); document.removeEventListener("bsa-tooltip-open", otherOpened); };
  }, [id]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); } };
    const dismiss = () => setOpen(false);
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", dismiss);
    return () => { document.removeEventListener("keydown", escape); document.removeEventListener("pointerdown", dismiss); };
  }, [open]);
  function update(kind: "hover" | "focus", active: boolean) {
    (kind === "hover" ? hovered : focused).current = active;
    clearTimeout(timer.current);
    if (active) {
      document.dispatchEvent(new CustomEvent("bsa-tooltip-open", { detail: id }));
      setOpen(true);
    } else if (!hovered.current && !focused.current) timer.current = setTimeout(() => setOpen(false), 100);
  }
  return { ...useOverlayPosition(open, "top"), open, id, update };
}

export const CompactTooltipContext = createContext<ReturnType<typeof useCompactTooltipState> | null>(null);

export function useCompactTooltip() {
  const tooltip = useContext(CompactTooltipContext);
  if (!tooltip) throw new Error("Tooltip components require a tooltip root");
  return tooltip;
}