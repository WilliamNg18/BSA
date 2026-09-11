import { createContext, useContext } from "react";

export const NativeRadioContext = createContext<{
  name: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  onValueChange: (value: string) => void;
} | null>(null);

export function useNativeRadio() {
  const context = useContext(NativeRadioContext);
  if (!context) throw new Error("Native radio items require a group");
  return context;
}