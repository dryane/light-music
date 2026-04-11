import { Track } from "@/types/music";
import { Theme } from "@/hooks/useTheme";

export interface TrackRowViewProps {
  track: Track;
  trackNumber: number | null | undefined;
  isActive: boolean;
  isPlaying: boolean;
  theme: Theme;
  onPress: () => void;
}