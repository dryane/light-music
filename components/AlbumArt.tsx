import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { AlbumArtFull } from "@/components/album-art/AlbumArtFull";
import { AlbumArtLight } from "@/components/album-art/AlbumArtLight";

interface AlbumArtProps {
  uri: string | null;
  size: number;
  radius?: number;
  /** When true, renders a loading indicator over the placeholder. */
  loading?: boolean;
}

export function AlbumArt({ uri, size, radius = 0, loading = false }: AlbumArtProps) {
  const theme = useTheme();

  const props = { uri, size, radius, loading, theme };

  return theme.variant === "light"
    ? <AlbumArtLight {...props} />
    : <AlbumArtFull {...props} />;
}
