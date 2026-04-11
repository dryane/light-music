import React, { createContext, useContext, ReactNode } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";

interface InvertColorsContextType {
  invertColors: boolean;
  setInvertColors: (value: boolean) => Promise<void>;
}

const InvertColorsContext = createContext<InvertColorsContextType>({
  invertColors: false,
  setInvertColors: async () => {},
});

export const useInvertColors = () => useContext(InvertColorsContext);

export const InvertColorsProvider = ({ children }: { children: ReactNode }) => {
  const [invertColors, setInvertColors] = usePersistedState(
    "invertColors",
    false,
    (v) => v.toString(),
    (s) => s === "true"
  );

  return (
    <InvertColorsContext.Provider value={{ invertColors, setInvertColors }}>
      {children}
    </InvertColorsContext.Provider>
  );
};
