import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isTourShortcut, TOUR_CHAPTER_COUNT, TOUR_STOPS, tourStopIndex } from "@/lib/tour-navigation";

export function TourRail({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const chapterSelected = useRef(false);
  const index = tourStopIndex(pathname, hash);
  const stop = TOUR_STOPS[index];
  const last = index === TOUR_STOPS.length - 1;

  useLayoutEffect(() => {
    if (!visible) return;
    function onKey(event: KeyboardEvent) {
      if (!isTourShortcut(event)) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="menu"], [role="dialog"], [role="alertdialog"]')) return;
      // Do not steal a browser shortcut while any modal/menu has focus trapped.
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return;
      // BrowserRouter writes history synchronously, before React commits its
      // location. Read that current URL so a burst never reuses a rendered index.
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const current = tourStopIndex(window.location.pathname.slice(base.length) || "/", window.location.hash);
      const destination = event.key === "ArrowRight" ? (current < 0 ? 0 : current + 1) : current - 1;
      event.preventDefault();
      if (destination < 0 || destination >= TOUR_STOPS.length) return;
      navigate(TOUR_STOPS[destination].to);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, visible]);

  if (!visible) return null;
  return (
    <nav aria-label="Guided tour" className="border-b bg-background/95 px-3 backdrop-blur md:px-6">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2">
        <Button variant="outline" size="sm" disabled={index <= 0} aria-keyshortcuts="Alt+ArrowLeft" onClick={() => navigate(TOUR_STOPS[index - 1].to)}>
          <ArrowLeft aria-hidden="true" /><span className="hidden sm:inline">Back</span><span className="sr-only sm:hidden">Back</span>
        </Button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="min-w-0 flex-1 justify-start px-2" aria-label="Choose tour chapter">
              <span className="truncate" aria-live="polite">{stop ? `${stop.chapter}/${TOUR_CHAPTER_COUNT} · ${stop.label}` : "Explore · Start the tour"}</span><ChevronDown className="shrink-0" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onCloseAutoFocus={(event) => {
            // The route shell owns heading focus. A delayed close must not
            // focus it again after the user has reopened this menu.
            if (chapterSelected.current) event.preventDefault();
            chapterSelected.current = false;
          }}>
            {TOUR_STOPS.filter((item) => item.to !== "/pharmacy").map((item) => (
              <DropdownMenuItem key={item.to} onSelect={() => { chapterSelected.current = true; navigate(item.to); }} aria-current={item.chapter === stop?.chapter ? "step" : undefined}>
                {item.chapter}. {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" disabled={last} aria-keyshortcuts="Alt+ArrowRight" onClick={() => navigate(TOUR_STOPS[index < 0 ? 0 : index + 1].to)}>
          {last ? "Done" : index < 0 ? "Start" : "Next"}<ArrowRight aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Dismiss tour" onClick={onDismiss}><X aria-hidden="true" /></Button>
      </div>
    </nav>
  );
}