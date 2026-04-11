import { Theme } from "@/hooks/useTheme";
import { Animated } from "react-native";

export interface MiniPlayerViewProps {
  activeTrack: {
    title?: string;
    artist?: string;
    artwork?: string;
  };
  isPlaying: boolean;
  progressRatio: number;
  slideAnim: Animated.Value;
  theme: Theme;
  onNavigate: () => void;
  onStop: () => void;
  onTogglePlay: () => void;
  onSkipNext: () => void;
  hasArtwork: boolean;
}
