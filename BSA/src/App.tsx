import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import { queryClient } from "@/lib/query-client";
import { AppShell } from "@/components/app-shell";
import { NotFoundPage } from "@/pages/not-found";
import { routes } from "@/routes";

// The site is served under Vite's `base` (for GitHub Pages this is `/<repo>/`,
// set by VITE_BASE in the deploy workflow; locally it is `/`). The router
// basename must match it so deep links such as /BSA/case/EX-24112 resolve.
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <ConfirmDialogProvider>
            <BrowserRouter basename={ROUTER_BASENAME}>
              <Routes>
                <Route path="/" element={<AppShell />}>
                  {routes.map((r) =>
                    r.path === "/" ? (
                      <Route key={r.path} index element={r.element} />
                    ) : (
                      <Route key={r.path} path={r.path} element={r.element} />
                    ),
                  )}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ConfirmDialogProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
