import { Theme } from "@/hooks/useTheme";

export interface ToggleSwitchViewProps {
  label: string;
  value: boolean;
  theme: Theme;
  onToggle: () => void;
}
