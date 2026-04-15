import { Theme } from "@/hooks/useTheme";
import { Album, Artist, Track } from "@/types/music";

export interface ArtistScreenViewProps {
  theme: Theme;
  insets: { top: number; bottom: number };
  artist: Artist | undefined;
  albums: Album[];
  singleTracks: Track[];
  allTracks: Track[];
  onPlayAll: () => void;
  onShuffle: () => void;
  onNavigateToAlbum: (albumId: string) => void;
  onPlaySingle: (track: Track) => void;
}
