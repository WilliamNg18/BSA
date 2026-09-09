import { lazy, type ReactElement } from "react";
import { BookOpenCheck, ClipboardList, HomeIcon, Inbox, Layers, ListChecks, Presentation, Store, type LucideIcon } from "lucide-react";
import { HomePage } from "@/pages/home";

const ArchitecturePage = lazy(() => import("@/pages/architecture").then((m) => ({ default: m.ArchitecturePage })));
const AssumptionsPage = lazy(() => import("@/pages/assumptions").then((m) => ({ default: m.AssumptionsPage })));
const BoundaryPage = lazy(() => import("@/pages/boundary").then((m) => ({ default: m.BoundaryPage })));
const CasePackPage = lazy(() => import("@/pages/case-pack").then((m) => ({ default: m.CasePackPage })));
const CaseTracePage = lazy(() => import("@/pages/case-trace").then((m) => ({ default: m.CaseTracePage })));
const DecisionRecordPage = lazy(() => import("@/pages/decision-record").then((m) => ({ default: m.DecisionRecordPage })));
const EvaluationPage = lazy(() => import("@/pages/evaluation").then((m) => ({ default: m.EvaluationPage })));
const NotesPage = lazy(() => import("@/pages/notes").then((m) => ({ default: m.NotesPage })));
const PharmacyPage = lazy(() => import("@/pages/pharmacy").then((m) => ({ default: m.PharmacyPage })));
const QueuePage = lazy(() => import("@/pages/queue").then((m) => ({ default: m.QueuePage })));

export interface AppRoute {
  /** "/" is the index route; others are paths under the shell. */
  path: string;
  element: ReactElement;
  /** Optional nav metadata — set these only for routes that should appear in a
   *  navbar/sidebar (the shell ships none by default; map over `routes` when you
   *  add one). Omit for detail/utility routes that aren't top-level nav targets. */
  label?: string;
  icon?: LucideIcon;
}

// Single source of truth for routes. Add a page = add ONE entry here.
// `App.tsx` builds <Routes> from this array; when you add a navbar or sidebar,
// map over `routes` (e.g. filter to entries with a `label`) so the router and
// the nav can never drift out of sync. `not-found` is wired in App.tsx.
export const routes: AppRoute[] = [
  { path: "/", element: <HomePage />, label: "Overview", icon: HomeIcon },
  { path: "/pharmacy", element: <PharmacyPage />, label: "Pharmacy check", icon: Store },
  { path: "/queue", element: <QueuePage />, label: "Exception queue", icon: Inbox },
  { path: "/case/:id", element: <CasePackPage /> },
  { path: "/case/:id/trace", element: <CaseTracePage /> },
  { path: "/case/:id/record", element: <DecisionRecordPage /> },
  { path: "/evaluation", element: <EvaluationPage />, label: "Evaluation", icon: BookOpenCheck },
  { path: "/boundary", element: <BoundaryPage />, label: "Boundary", icon: Layers },
  { path: "/assumptions", element: <AssumptionsPage />, label: "Assumptions", icon: ListChecks },
  { path: "/architecture", element: <ArchitecturePage />, label: "Architecture", icon: ClipboardList },
  { path: "/notes", element: <NotesPage />, label: "Presenter notes", icon: Presentation },
];
