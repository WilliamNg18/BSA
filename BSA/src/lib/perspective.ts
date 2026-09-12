import type { Perspective } from "@/lib/store";

export const PERSPECTIVES = [
  { value: "pharmacy", label: "Pharmacy" },
  { value: "nhsbsa", label: "NHSBSA" },
  { value: "both", label: "Both" },
] as const satisfies ReadonlyArray<{ value: Perspective; label: string }>;

export function perspectiveForPath(path: string): Exclude<Perspective, "both"> | undefined {
  const pathname = path.split(/[?#]/, 1)[0];
  if (pathname === "/pharmacy" || pathname.startsWith("/pharmacy/")) return "pharmacy";
  if (pathname === "/queue" || pathname.startsWith("/case/")) return "nhsbsa";
  return undefined;
}

export function canViewPath(perspective: Perspective, path: string): boolean {
  const side = perspectiveForPath(path);
  return perspective === "both" || side === undefined || perspective === side;
}
