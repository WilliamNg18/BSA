import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<"input">, "type" | "size"> & {
  size?: "sm" | "default";
  onCheckedChange?: (checked: boolean) => void;
};

/** Native form/focus/Space behaviour, with Enter retained from the button switch. */
export function NativeSwitch({ checked, defaultChecked = false, onCheckedChange, onChange, onKeyDown, className, size = "default", ...props }: Props) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const active = checked ?? internalChecked;
  return <input {...props} type="checkbox" role="switch" checked={active}
    data-slot="switch" data-size={size} data-state={active ? "checked" : "unchecked"}
    className={cn(
      "peer inline-flex shrink-0 appearance-none items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
      "after:pointer-events-none after:block after:rounded-full after:bg-background after:transition-transform after:content-[''] data-[size=default]:after:size-4 data-[size=sm]:after:size-3 data-[state=checked]:after:translate-x-[calc(100%-2px)] data-[state=unchecked]:after:translate-x-0 dark:data-[state=checked]:after:bg-primary-foreground dark:data-[state=unchecked]:after:bg-foreground motion-reduce:transition-none motion-reduce:after:transition-none",
      className,
    )}
    onChange={(event) => {
      onChange?.(event);
      if (event.defaultPrevented) return;
      if (checked === undefined) setInternalChecked(event.target.checked);
      onCheckedChange?.(event.target.checked);
    }}
    onKeyDown={(event) => {
      onKeyDown?.(event);
      if (!event.defaultPrevented && event.key === "Enter") { event.preventDefault(); event.currentTarget.click(); }
    }} />;
}