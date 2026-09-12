import { PERSPECTIVES } from "@/lib/perspective";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PerspectiveSwitch() {
  const perspective = useAppStore((s) => s.perspective);
  const setPerspective = useAppStore((s) => s.setPerspective);
  return <fieldset aria-label="Perspective" className="flex shrink-0 rounded-md border bg-muted/50 p-0.5">
    {PERSPECTIVES.map(({ value, label }) => <label key={value} className="relative cursor-pointer">
      <input type="radio" name="perspective" value={value} checked={perspective === value}
        onChange={() => setPerspective(value)} className="peer absolute inset-0 m-0 size-full cursor-pointer opacity-0" />
      <span className={cn(
        "pointer-events-none block rounded-sm px-1 py-2 text-[10px] font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring sm:px-2 sm:text-xs",
        perspective === value ? "bg-teal-700 text-white" : "text-foreground hover:bg-muted",
      )}>{label}</span>
    </label>)}
  </fieldset>;
}
