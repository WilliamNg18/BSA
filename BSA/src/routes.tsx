import type { ReactElement } from "react";
import { BookOpenCheck, ClipboardList, HomeIcon, Inbox, Layers, ListChecks, Store, type LucideIcon } from "lucide-react";
import { HomePage } from "@/pages/home";
import { ArchitecturePage } from "@/pages/architecture";
import { AssumptionsPage } from "@/pages/assumptions";
import { BoundaryPage } from "@/pages/boundary";
import { CasePackPage } from "@/pages/case-pack";
import { CaseTracePage } from "@/pages/case-trace";
import { DecisionRecordPage } from "@/pages/decision-record";
import { EvaluationPage } from "@/pages/evaluation";
import { PharmacyPage } from "@/pages/pharmacy";
import { PharmacyClaimsPage } from "@/pages/pharmacy-claims";
import { QueuePage } from "@/pages/queue";

export interface AppRoute {
  /** "/" is the index route; others are paths under the shell. */
  path: string;
  element: ReactElement;
  /** Optional nav metadata — set these only for routes that should appear in a
   *  navbar/sidebar (the shell ships none by default; map over `routes` when you
   *  add one). Omit for detail/utility routes that aren't top-level nav targets. */
  label?: string;
  icon?: LucideIcon;
  group?: "Overview" | "Operations" | "How it works";
}

// Single source of truth for routes. Add a page = add ONE entry here.
// `App.tsx` builds <Routes> from this array; when you add a navbar or sidebar,
// map over `routes` (e.g. filter to entries with a `label`) so the router and
// the nav can never drift out of sync. `not-found` is wired in App.tsx.
export const routes: AppRoute[] = [
  { path: "/", element: <HomePage />, label: "Overview", icon: HomeIcon, group: "Overview" },
  { path: "/pharmacy", element: <PharmacyPage />, label: "Pharmacy check", icon: Store, group: "Operations" },
  { path: "/pharmacy/claims", element: <PharmacyClaimsPage />, label: "Pharmacy claims", icon: ClipboardList, group: "Operations" },
  { path: "/queue", element: <QueuePage />, label: "NHSBSA queue", icon: Inbox, group: "Operations" },
  { path: "/case/:id", element: <CasePackPage /> },
  { path: "/case/:id/trace", element: <CaseTracePage /> },
  { path: "/case/:id/record", element: <DecisionRecordPage /> },
  { path: "/evaluation", element: <EvaluationPage />, label: "Evaluation", icon: BookOpenCheck, group: "How it works" },
  { path: "/boundary", element: <BoundaryPage />, label: "Boundary", icon: Layers, group: "How it works" },
  { path: "/assumptions", element: <AssumptionsPage />, label: "Assumptions", icon: ListChecks, group: "How it works" },
  { path: "/architecture", element: <ArchitecturePage />, label: "Architecture", icon: ClipboardList, group: "How it works" },
];
