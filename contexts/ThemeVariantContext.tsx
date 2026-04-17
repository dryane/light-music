import React, { createContext, useContext, ReactNode } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";

/**
 * ThemeVariant controls the overall visual language of the app.
 *
 * "full"  — Current design: high-contrast, dense, opinionated spacing.
 * "light" — Stripped-down variant: same logic, softer palette choices.
 *            Exact values are intentionally left as placeholders until
 *            the design pass — swap them freely without touching any screen.
 *
 * invertColors applies on top of whichever variant is active.
 */
export type ThemeVariant = "full" | "light";

interface ThemeVariantContextType {
  variant: ThemeVariant;
  setVariant: (v: ThemeVariant) => Promise<void>;
}

const ThemeVariantContext = createContext<ThemeVariantContextType>({
  variant: "full",
  setVariant: async () => {},
});

export const useThemeVariant = () => useContext(ThemeVariantContext);

export const ThemeVariantProvider = ({ children }: { children: ReactNode }) => {
  // ── DEV TOGGLE ────────────────────────────────────────────────────────────
  // Change this to "light" to preview the light theme while designing.
  // A proper selector UI will replace this once both themes are finalised.
  const DEV_DEFAULT: ThemeVariant = "light";
  // ─────────────────────────────────────────────────────────────────────────

  const [variant, setVariant] = usePersistedState<ThemeVariant>(
    "themeVariant",
    DEV_DEFAULT,
    (v) => v,
    (s) => s as ThemeVariant
  );

  return (
    <ThemeVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </ThemeVariantContext.Provider>
  );
};
