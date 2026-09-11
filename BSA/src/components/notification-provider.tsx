import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { NotificationContext, type NotificationKind } from "@/hooks/use-notification";

/** Only the two decision notices are needed. No portal, gesture or animation engine. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ kind: NotificationKind; text: string; sequence: number } | null>(null);
  const invoker = useRef<Element | null>(null);
  const dismiss = useRef<HTMLButtonElement>(null);
  const show = useCallback((kind: NotificationKind, text: string) => {
    invoker.current = document.activeElement;
    setNotice((old) => ({ kind, text, sequence: (old?.sequence ?? 0) + 1 }));
  }, []);
  const clear = useCallback(() => {
    if (dismiss.current === document.activeElement && invoker.current instanceof HTMLElement && invoker.current.isConnected) invoker.current.focus();
    setNotice(null);
  }, []);
  const value = useMemo(() => ({ show, clear }), [show, clear]);
  return <NotificationContext value={value}>
    {children}
    <aside aria-label="Decision notifications" className="pointer-events-none fixed right-4 bottom-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <div role="status" aria-live="polite" aria-atomic="true">
        {notice && <div key={notice.sequence} className="pointer-events-auto rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-lg" data-decision-notice={notice.kind}>
          <p className="font-semibold">{notice.kind === "error" ? "Decision not recorded" : "Decision recorded"}</p>
          <p className="mt-1">{notice.text}</p>
          <button ref={dismiss} type="button" onClick={clear} className="mt-3 rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Dismiss notification</button>
        </div>}
      </div>
    </aside>
  </NotificationContext>;
}