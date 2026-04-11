import { Theme } from "@/hooks/useTheme";

export interface ScreenHeaderViewProps {
  title: string;
  meta: string;
  theme: Theme;
  onPlay: () => void;
  onShuffle: () => void;
}
