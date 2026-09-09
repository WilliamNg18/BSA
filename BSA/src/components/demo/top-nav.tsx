import { NavLink } from "react-router-dom";
import { MessageSquareText, Presentation, RotateCcw, ShieldCheck } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { routes } from "@/routes";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TopNav() {
  const { agentEnabled, presenterMode, discussionMode, setAgentEnabled, setPresenterMode, setDiscussionMode, resetDemo } = useAppStore(
    useShallow((s) => ({
      agentEnabled: s.agentEnabled,
      presenterMode: s.presenterMode,
      discussionMode: s.discussionMode,
      setAgentEnabled: s.setAgentEnabled,
      setPresenterMode: s.setPresenterMode,
      setDiscussionMode: s.setDiscussionMode,
      resetDemo: s.resetDemo,
    })),
  );
  const navRoutes = routes.filter((r) => r.label);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-teal-700 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-teal-700 text-white" aria-hidden="true">
            <ShieldCheck className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Prescription Exception Case Builder</p>
            <p className="text-xs text-muted-foreground">NHSBSA capability demonstration · synthetic data</p>
          </div>
        </div>
        <nav aria-label="Primary" className="order-3 -mx-1 flex w-full flex-wrap gap-1 md:order-none md:mx-0 md:w-auto md:flex-1">
          {navRoutes.map((r) => (
            <NavLink
              key={r.path}
              to={r.path}
              end={r.path === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700",
                  isActive ? "bg-teal-700 text-white" : "text-foreground hover:bg-muted",
                )
              }
            >
              {r.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="agent-flag" checked={agentEnabled} onCheckedChange={setAgentEnabled} className="data-[state=checked]:bg-teal-700" />
            <Label htmlFor="agent-flag" className="text-xs">Agent recommendations {agentEnabled ? "on" : "off"}</Label>
          </div>
          <Button
            type="button"
            size="sm"
            variant={presenterMode ? "default" : "outline"}
            aria-pressed={presenterMode}
            onClick={() => setPresenterMode(!presenterMode)}
            className={cn(presenterMode && "bg-teal-700 text-white hover:bg-teal-800")}
          >
            <Presentation aria-hidden="true" /> Presenter mode
          </Button>
          <Button
            type="button"
            size="sm"
            variant={discussionMode ? "default" : "outline"}
            aria-pressed={discussionMode}
            onClick={() => setDiscussionMode(!discussionMode)}
            className={cn(discussionMode && "bg-teal-700 text-white hover:bg-teal-800")}
          >
            <MessageSquareText aria-hidden="true" /> Discussion mode
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={resetDemo}>
            <RotateCcw aria-hidden="true" /> Reset demo
          </Button>
        </div>
      </div>
      <p className="border-t border-amber-300 bg-amber-50 px-4 py-1 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 md:px-6">
        Synthetic demonstration data throughout. This prototype does not calculate or approve payments, and nothing here is a claim about NHSBSA's real performance.
      </p>
    </header>
  );
}
