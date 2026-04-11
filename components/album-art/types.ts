import { Theme } from "@/hooks/useTheme";

export interface AlbumArtViewProps {
  uri: string | null;
  size: number;
  radius: number;
  loading: boolean;
  theme: Theme;
}
