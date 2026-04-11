import { useInvertColors } from "@/contexts/InvertColorsContext";
import { useThemeVariant } from "@/contexts/ThemeVariantContext";

export interface Theme {
  variant: "full" | "light";
  invertColors: boolean;
  /** Primary foreground — titles, icons, active elements */
  fg: string;
  /** Muted foreground — subtitles, secondary labels */
  fgMuted: string;
  /** Dim foreground — seek bar times, progress indicators */
  fgDim: string;
  bg: string;
  sectionBg: string;
  border: string;
  /** Seek / progress track fill background */
  trackBg: string;
  /** Mini-player progress bar background */
  progressBg: string;
  /** Album art placeholder background */
  placeholderBg: string;
  font: string;
  animate: boolean;
}

// ─── Full theme ───────────────────────────────────────────────────────────────
// Current design: maximum contrast, dense chrome.

function fullTheme(inv: boolean): Omit<Theme, "variant" | "invertColors"> {
  return {
    fg:            inv ? "#000000" : "#ffffff",
    fgMuted:       inv ? "#888888" : "#777777",
    fgDim:         inv ? "#888888" : "#484848",
    bg:            inv ? "#ffffff" : "#000000",
    sectionBg:     inv ? "#f0f0f0" : "#080808",
    border:        inv ? "#e8e8e8" : "#111111",
    trackBg:       inv ? "#e0e0e0" : "#1e1e1e",
    progressBg:    inv ? "#e0e0e0" : "#2a2a2a",
    placeholderBg: inv ? "#e8e8e8" : "#141414",
    font: "PublicSans",
    animate:  true,
  };
}

// ─── Light theme ──────────────────────────────────────────────────────────────
// Stripped-down variant: softer greys, more breathing room.
// Placeholder values — adjust freely during the design pass.

function lightTheme(inv: boolean): Omit<Theme, "variant" | "invertColors"> {
  return {
    fg:            inv ? "#1a1a1a" : "#f0f0f0",
    fgMuted:       inv ? "#aaaaaa" : "#666666",
    fgDim:         inv ? "#bbbbbb" : "#555555",
    bg:            inv ? "#f8f8f8" : "#0d0d0d",
    sectionBg:     inv ? "#eeeeee" : "#141414",
    border:        inv ? "#dddddd" : "#222222",
    trackBg:       inv ? "#cccccc" : "#2a2a2a",
    progressBg:    inv ? "#dddddd" : "#333333",
    placeholderBg: inv ? "#e0e0e0" : "#1a1a1a",
    font: "PublicSans",
    animate:  false,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): Theme {
  const { invertColors } = useInvertColors();
  const { variant } = useThemeVariant();

  const palette =
    variant === "light" ? lightTheme(invertColors) : fullTheme(invertColors);

  return { variant, invertColors, ...palette };
}
