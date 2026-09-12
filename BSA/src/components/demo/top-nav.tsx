import { useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, RotateCcw, ShieldCheck } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSwitch as Switch } from "@/components/ui/native-switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CompactTooltip as Tooltip, CompactTooltipContent as TooltipContent, CompactTooltipProvider as TooltipProvider, CompactTooltipTrigger as TooltipTrigger } from "@/components/ui/compact-tooltip";
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
  const [mobileOpen, setMobileOpen] = useState(false);
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
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <a
        href="#main-content"
        onClick={(event) => { event.preventDefault(); document.getElementById("main-content")?.focus(); }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-teal-700 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <div className="flex h-full flex-nowrap items-center gap-1 px-2 sm:gap-2 md:gap-4 md:px-6">
        <Link to="/#scene" aria-label="Prescription Exception Case Builder" className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-teal-700 text-white sm:size-9" aria-hidden="true">
            <ShieldCheck className="size-5" />
          </span>
          <span className="hidden whitespace-nowrap text-sm font-semibold 2xl:inline">Prescription Exception Case Builder</span>
          <span className="hidden whitespace-nowrap text-sm font-semibold md:inline lg:hidden xl:inline 2xl:hidden" aria-hidden="true">NHSBSA Case Builder</span>
        </Link>
        <nav aria-label="Primary" className="order-last ml-auto lg:order-none lg:ml-0 lg:flex-1">
          <div className="hidden items-center gap-1 lg:flex">
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
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="size-7 sm:size-9 lg:hidden" aria-label="Open navigation"><Menu aria-hidden="true" /></Button></SheetTrigger>
            {/* Close without waiting for animationend; retain Radix focus/scroll cleanup. */}
            <SheetContent
              onCloseAutoFocus={closeNavigation}
              className="overflow-y-auto data-[state=closed]:animate-none data-[state=closed]:duration-0 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=open]:duration-0"
              overlayClassName="data-[state=closed]:animate-none data-[state=closed]:duration-0 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=open]:duration-0"
            >
              <SheetHeader><SheetTitle>Navigation</SheetTitle><SheetDescription>Explore the synthetic demonstration.</SheetDescription></SheetHeader>
              <div className="space-y-5 px-4 pb-6">
                {groups.map((group) => <section key={group} aria-label={group}>
                  <h2 className="mb-2 text-sm font-semibold">{group}</h2>
                  <ul className="space-y-1">{navRoutes.filter((route) => route.group === group).map((route) => <li key={route.path}><SheetClose asChild><NavLink to={route.path} onClick={() => chooseRoute(route.path)} end className={({ isActive }) => cn("block rounded-md px-3 py-2 text-sm focus-visible:outline-2", isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted")}>{route.label}</NavLink></SheetClose></li>)}</ul>
                </section>)}
              </div>
            </SheetContent>
          </Sheet>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
          <PerspectiveSwitch />
          <div className="flex items-center gap-1 rounded-md border bg-muted/50 px-1 py-1.5 sm:gap-2 sm:px-2">
            <TooltipProvider><Tooltip>
              <TooltipTrigger asChild><span className="inline-flex"><Switch id="agent-flag" aria-describedby="agent-help" checked={agentEnabled} onCheckedChange={setAgentEnabled} className="data-[state=checked]:bg-teal-700" /></span></TooltipTrigger>
              <TooltipContent className="max-w-64">On shows synthetic assistance. Off withholds recommendations; evidence and human decisions remain. Scene facts do not change.</TooltipContent>
            </Tooltip></TooltipProvider>
            <span id="agent-help" className="sr-only">On shows synthetic assistance. Off withholds recommendations; evidence and human decisions remain. Scene facts do not change.</span>
            <Label htmlFor="agent-flag" className="whitespace-nowrap text-xs font-semibold">Agent: {agentEnabled ? "On" : "Off"}</Label>
          </div>
          <Button type="button" size="sm" variant="ghost" className="size-7 p-0 sm:h-8 sm:w-auto sm:px-3" onClick={reset} aria-label="Reset demo">
            <RotateCcw aria-hidden="true" /><span className="hidden sm:inline">Reset demo</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
