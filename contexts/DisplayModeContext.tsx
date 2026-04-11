import React, { createContext, useContext, ReactNode } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";

export type DisplayMode = "standard" | "compact" | "comfortable";

interface DisplayModeContextType {
  displayMode: DisplayMode;
  setDisplayMode: (value: DisplayMode) => Promise<void>;
}

const DisplayModeContext = createContext<DisplayModeContextType>({
  displayMode: "standard",
  setDisplayMode: async () => {},
});

export const useDisplayMode = () => useContext(DisplayModeContext);

export const DisplayModeProvider = ({ children }: { children: ReactNode }) => {
  const [displayMode, setDisplayMode] = usePersistedState<DisplayMode>(
    "displayMode",
    "standard",
    (v) => v,
    (s) => s as DisplayMode
  );

  return (
    <DisplayModeContext.Provider value={{ displayMode, setDisplayMode }}>
      {children}
    </DisplayModeContext.Provider>
  );
};
