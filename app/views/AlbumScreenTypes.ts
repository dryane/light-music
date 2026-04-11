import { Animated } from "react-native";
import { Theme } from "@/hooks/useTheme";
import { Album, Track } from "@/types/music";

export interface AlbumScreenViewProps {
  theme: Theme;
  insets: { top: number; bottom: number };
  album: Album | undefined;
  isArtLoading: boolean;
  tracks: Track[];
  panHandlers: any;
  translateX: Animated.AnimatedInterpolation<number> | Animated.Value;
  onPlayAlbum: () => void;
  onShuffleAlbum: () => void;
}
