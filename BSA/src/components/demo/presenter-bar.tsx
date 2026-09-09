import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { WALKTHROUGH } from "@/lib/domain/content";
import { useAppStore } from "@/lib/store";

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PresenterBar() {
  const { presenterMode, beat, setBeat, setPresenterMode } = useAppStore(
    useShallow((s) => ({ presenterMode: s.presenterMode, beat: s.presenterBeat, setBeat: s.setPresenterBeat, setPresenterMode: s.setPresenterMode })),
  );
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  if (!presenterMode) return null;
  const b = WALKTHROUGH[beat];
  const over = elapsed > 600;

  return (
    <aside
      aria-label="Presenter walkthrough"
      className="sticky bottom-0 z-30 border-t-4 border-teal-700 bg-slate-900 text-slate-100 shadow-lg"
    >
      <div className="flex flex-wrap items-start gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-1 font-mono text-lg tabular-nums ${over ? "bg-rose-700" : "bg-slate-800"}`} aria-live="off">
            {fmt(elapsed)}
          </span>
          <Button type="button" size="sm" onClick={() => setRunning((r) => !r)} className="bg-teal-600 text-white hover:bg-teal-500" aria-pressed={running}>
            {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />} {running ? "Pause" : elapsed ? "Resume" : "Start"}
          </Button>
          <Button type="button" size="sm" variant="ghost" className="text-slate-200 hover:bg-slate-800 hover:text-white" onClick={() => { setRunning(false); setElapsed(0); }}>
            Reset timer
          </Button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-teal-300">
            Beat {beat + 1} of {WALKTHROUGH.length} · {b.time}
          </p>
          <p className="font-semibold">{b.title}</p>
          <p className="mt-1 max-w-4xl text-sm text-slate-300">{b.say}</p>
          <p className="mt-1 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Show: </span>
            {b.show}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white" onClick={() => navigate(b.route)}>
            <ExternalLink aria-hidden="true" /> Go to screen
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" className="text-slate-200 hover:bg-slate-800 hover:text-white" aria-label="Previous beat" disabled={beat === 0} onClick={() => setBeat(beat - 1)}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" className="text-slate-200 hover:bg-slate-800 hover:text-white" aria-label="Next beat" disabled={beat === WALKTHROUGH.length - 1} onClick={() => setBeat(beat + 1)}>
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" className="text-slate-200 hover:bg-slate-800 hover:text-white" aria-label="Close presenter mode" onClick={() => setPresenterMode(false)}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
