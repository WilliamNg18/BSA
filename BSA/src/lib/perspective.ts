import type { Perspective } from "@/lib/store";
import { matchPath } from "react-router-dom";

export const PERSPECTIVES = [
  { value: "pharmacy", label: "Pharmacy" },
  { value: "nhsbsa", label: "NHSBSA" },
  { value: "both", label: "Both" },
] as const satisfies ReadonlyArray<{ value: Perspective; label: string }>;

export function perspectiveForPath(path: string): Exclude<Perspective, "both"> | undefined {
  const pathname = path.split(/[?#]/, 1)[0];
  if (matchPath("/pharmacy/*", pathname)) return "pharmacy";
  if (matchPath("/queue", pathname) || matchPath("/case/*", pathname)) return "nhsbsa";
  return undefined;
}

export function canViewPath(perspective: Perspective, path: string): boolean {
  const side = perspectiveForPath(path);
  return perspective === "both" || side === undefined || perspective === side;
}
