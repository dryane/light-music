import { useInvertColors } from "@/contexts/InvertColorsContext";

export function useTheme() {
  const { invertColors } = useInvertColors();
  return {
    invertColors,
    fg:        invertColors ? "#000000" : "#ffffff",
    fgMuted:   invertColors ? "#888888" : "#777777",
    bg:        invertColors ? "#ffffff" : "#000000",
    sectionBg: invertColors ? "#f0f0f0" : "#080808",
    border:    invertColors ? "#e8e8e8" : "#111111",
    trackBg:   invertColors ? "#e0e0e0" : "#1e1e1e",
  };
}
