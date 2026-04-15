import { Animated } from "react-native";
import { Theme } from "@/hooks/useTheme";

export interface NowPlayingViewProps {
  theme: Theme;
  insets: { top: number; bottom: number };
  activeTrack: {
    title?: string;
    artist?: string;
    album?: string;
    artwork?: string;
    id?: string;
  } | undefined;
  isPlaying: boolean;
  labelSecs: number;
  duration: number;
  dragging: boolean;
  fillWidth: Animated.AnimatedInterpolation<string>;
  thumbLeft: Animated.AnimatedInterpolation<string>;
  seekPanHandlers: any;
  artPanHandlers: any;
  artX: Animated.Value;
  artOpacity: Animated.Value;
  barLayoutHandler: (e: any) => void;
  onTogglePlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
}

export function fmt(secs: number) {
  const s = Math.floor(Math.max(0, secs));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
