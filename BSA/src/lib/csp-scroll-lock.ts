import { useLayoutEffect } from "react";

type LockOptions = { noRelative?: boolean; noImportant?: boolean; gapMode?: "margin" | "padding" };
let locks = 0;
let restore: (() => void) | undefined;

/** Radix retains focus and wheel/touch containment. Only replace its injected
 * scrollbar stylesheet with individual CSSOM properties and external CSS. */
export function RemoveScrollBar({ noRelative, noImportant, gapMode = "margin" }: LockOptions) {
  useLayoutEffect(() => {
    const body = document.body;
    if (locks++ === 0) {
      const computed = getComputedStyle(body);
      const offset = (side: "Left" | "Top" | "Right") => Number.parseFloat(computed[`${gapMode}${side}`]) || 0;
      const left = offset("Left"), top = offset("Top"), right = offset("Right");
      const gap = Math.max(0, window.innerWidth - document.documentElement.clientWidth + right - left);
      const properties: Record<string, string> = {
        overflow: "hidden",
        "overscroll-behavior": "contain",
        "--removed-body-scroll-bar-size": `${gap}px`,
        ...(noRelative ? {} : { position: "relative" }),
        ...(gapMode === "padding" ? { "padding-right": `${gap}px` } : {
          "padding-left": `${left}px`, "padding-top": `${top}px`, "padding-right": `${right}px`,
          "margin-left": "0px", "margin-top": "0px", "margin-right": `${gap}px`,
        }),
      };
      const previous = Object.keys(properties).map((name) => ({
        name, value: body.style.getPropertyValue(name), priority: body.style.getPropertyPriority(name),
      }));
      const attribute = body.getAttribute("data-scroll-locked");
      for (const [name, value] of Object.entries(properties)) {
        body.style.setProperty(name, value, noImportant ? "" : "important");
      }
      restore = () => {
        for (const { name, value, priority } of previous) {
          if (value) body.style.setProperty(name, value, priority);
          else body.style.removeProperty(name);
        }
        if (attribute === null) body.removeAttribute("data-scroll-locked");
        else body.setAttribute("data-scroll-locked", attribute);
      };
    }
    body.setAttribute("data-scroll-locked", String(locks));
    return () => {
      if (--locks === 0) { restore?.(); restore = undefined; }
      else body.setAttribute("data-scroll-locked", String(locks));
    };
  }, [noRelative, noImportant, gapMode]);
  return null;
}
