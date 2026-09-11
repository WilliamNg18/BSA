import { useId, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { NativeRadioContext, useNativeRadio } from "./native-radio-context";
import { toggleVariants } from "./toggle";

type GroupProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  onValueChange?: (value: string) => void;
};

export function NativeRadioGroup({ name, value, defaultValue = "", disabled, required, onValueChange, className, children, ...props }: GroupProps) {
  const id = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  return <NativeRadioContext.Provider value={{ name: name ?? id, value: value ?? internalValue, disabled, required, onValueChange: (next) => {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  } }}>
    <div role="radiogroup" aria-required={required} aria-disabled={disabled} data-slot="radio-group" className={cn("grid gap-3", className)} {...props}>{children}</div>
  </NativeRadioContext.Provider>;
}

type ItemProps = Omit<ComponentProps<"input">, "type" | "value" | "defaultChecked" | "checked"> & { value: string };

export function NativeRadioItem({ value, disabled, onChange, className, ...props }: ItemProps) {
  const group = useNativeRadio();
  const checked = group.value === value;
  return <input {...props} type="radio" value={value} name={group.name} checked={checked}
    required={group.required} disabled={disabled || group.disabled} data-state={checked ? "checked" : "unchecked"}
    data-slot="radio-group-item"
    className={cn("aspect-square size-4 shrink-0 appearance-none rounded-full border border-input text-primary shadow-xs transition-[color,box-shadow] outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 checked:bg-[radial-gradient(circle,var(--primary)_0_4px,transparent_4px)]", className)}
    onChange={(event) => { onChange?.(event); if (!event.defaultPrevented && event.target.checked) group.onValueChange(value); }} />;
}

export function NativeChoiceGroup({ className, ...props }: GroupProps) {
  return <NativeRadioGroup className={cn("flex w-fit items-center gap-0 rounded-md", className)} {...props} />;
}

export function NativeChoiceItem({ children, className, ...props }: ItemProps) {
  const group = useNativeRadio();
  const disabled = props.disabled || group.disabled;
  return <label data-state={group.value === props.value ? "on" : "off"} data-disabled={disabled ? "" : undefined}
    className={cn(toggleVariants(), "relative w-auto min-w-0 shrink-0 rounded-none px-3 shadow-none first:rounded-l-md last:rounded-r-md has-[:focus-visible]:z-10 has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring data-disabled:pointer-events-none data-disabled:opacity-50", className)}>
    <NativeRadioItem {...props} className="absolute inset-0 m-0 size-full cursor-pointer opacity-0" />
    {children}
  </label>;
}