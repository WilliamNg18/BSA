import { createContext, useContext } from "react";

export type NotificationKind = "success" | "error";
export const NotificationContext = createContext<{
  show: (kind: NotificationKind, text: string) => void;
  clear: () => void;
} | null>(null);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("Notification provider is required");
  return context;
}