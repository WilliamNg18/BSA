import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/error-boundary";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import { NotificationProvider } from "@/components/notification-provider";
import { AppShell } from "@/components/app-shell";
import { NotFoundPage } from "@/pages/not-found";
import { routes } from "@/routes";

// Local and Azure hosting share the site root and Vite's base.
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export function App() {
  return (
    <ErrorBoundary>
          <NotificationProvider>
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
          </NotificationProvider>
    </ErrorBoundary>
  );
}
