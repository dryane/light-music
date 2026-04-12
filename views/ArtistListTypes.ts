import { SectionListData } from "react-native";
import { Theme } from "@/hooks/useTheme";
import { Artist } from "@/types/music";

export interface ArtistListSection {
  title: string;
  data: Artist[];
}

export interface ArtistListViewProps {
  theme: Theme;
  insets: { top: number; bottom: number };
  sections: ArtistListSection[];
  // State flags
  initialized: boolean;
  permissionGranted: boolean;
  loading: boolean;
  scanProgress: number;
  scanStatus: string;
  error: string | null;
  // Callbacks
  onRequestPermission: () => void;
  onNavigateToArtist: (artist: Artist) => void;
}
