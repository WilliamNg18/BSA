import { useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, RotateCcw, ShieldCheck } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSwitch as Switch } from "@/components/ui/native-switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";
import { PerspectiveSwitch } from "@/components/demo/perspective-switch";
import { canViewPath } from "@/lib/perspective";
import { routes } from "@/routes";
import { useAppStore } from "@/lib/store";
import { tourStopIndex } from "@/lib/tour-navigation";
import { cn } from "@/lib/utils";

export function TopNav({ onReset }: { onReset: () => void }) {
  const confirm = useConfirm();
  const { pathname, search, hash } = useLocation();
  const navigating = useRef(false);
  function chooseRoute(path: string) {
    navigating.current = tourStopIndex(path, "") >= 0 && (path !== pathname || Boolean(search || hash));
  }
  function closeNavigation(event: Event) {
    if (navigating.current) event.preventDefault();
    navigating.current = false;
  }
  const { agentEnabled, setAgentEnabled, resetDemo, perspective } = useAppStore(
    useShallow((s) => ({
      agentEnabled: s.agentEnabled,
      setAgentEnabled: s.setAgentEnabled,
      resetDemo: s.resetDemo,
      perspective: s.perspective,
    })),
  );
  const navRoutes = routes.filter((r) => r.label && canViewPath(perspective, r.path));
  const groups = [...new Set(navRoutes.map((route) => route.group))];
  async function reset() {
    if (await confirm({ title: "Reset demonstration?", description: "Remove session decisions, restore seeded cases and local fields, and turn Agent Off. The seeded historical record remains. No payment is affected.", confirmLabel: "Reset demonstration", cancelLabel: "Keep working", destructive: true })) {
      resetDemo();
      onReset();
    }
  }

  return (
    <header className="min-h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <a
        href="#main-content"
        onClick={(event) => { event.preventDefault(); document.getElementById("main-content")?.focus(); }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-teal-700 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <div className="flex min-h-[calc(3.5rem-1px)] flex-wrap items-center gap-4 px-6 py-1">
        <Link to="/#scene" aria-label="Prescription Exception Case Builder" className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-teal-700 text-white" aria-hidden="true">
            <ShieldCheck className="size-5" />
          </span>
          <span className="hidden whitespace-nowrap text-sm font-semibold 2xl:inline">Prescription Exception Case Builder</span>
          <span className="hidden whitespace-nowrap text-sm font-semibold xl:inline 2xl:hidden" aria-hidden="true">NHSBSA Case Builder</span>
        </Link>
        <nav aria-label="Primary" className="ml-0 flex-1">
          <div className="flex items-center gap-1">
            {groups.map((group) => {
              const items = navRoutes.filter((route) => route.group === group);
              if (group === "Overview") return <NavLink key={group} to={items[0].path} end className={({ isActive }) => cn("rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2", isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted")}>{group}</NavLink>;
              const active = items.some((route) => route.path === pathname) || (group === "Operations" && pathname.startsWith("/case/"));
              return <DropdownMenu key={group} modal={false}>
                <DropdownMenuTrigger asChild><Button variant="ghost" className={cn(active && "bg-accent text-accent-foreground")}>{group}<ChevronDown aria-hidden="true" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="start" onCloseAutoFocus={closeNavigation}>{items.map((route) => <DropdownMenuItem key={route.path} asChild><Link to={route.path} onClick={() => chooseRoute(route.path)} aria-current={route.path === pathname ? "page" : undefined}>{route.label}</Link></DropdownMenuItem>)}</DropdownMenuContent>
              </DropdownMenu>;
            })}
          </div>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <PerspectiveSwitch />
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1.5">
            <Switch id="agent-flag" aria-label={`Agent: ${agentEnabled ? "On" : "Off"}`} aria-describedby="agent-help"
              title="On shows synthetic assistance. Off withholds recommendations; evidence and human decisions remain."
              checked={agentEnabled} onCheckedChange={setAgentEnabled} className="data-[state=checked]:bg-teal-700" />
            <span id="agent-help" className="sr-only">On shows synthetic assistance. Off withholds recommendations; evidence and human decisions remain. Scene facts do not change.</span>
            <Label htmlFor="agent-flag" className="whitespace-nowrap text-xs font-semibold">Agent: {agentEnabled ? "On" : "Off"}</Label>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={reset} aria-label="Reset demo">
            <RotateCcw aria-hidden="true" /><span>Reset demo</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
