import React, { useMemo } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusic } from "@/contexts/MusicContext";
import { useTheme } from "@/hooks/useTheme";
import { useHaptic } from "@/contexts/HapticContext";
import { Artist } from "@/types/music";
import { ArtistListSection } from "@/views/ArtistListTypes";
import { ArtistListViewFull } from "@/views/ArtistListViewFull";
import { ArtistListViewLight } from "@/views/ArtistListViewLight";

function buildSections(artists: Artist[]): ArtistListSection[] {
  const map = new Map<string, Artist[]>();
  for (const artist of artists) {
    const sortName = artist.name.replace(/^(the|a)\s+/i, "").trim();
    const first = sortName[0]?.toUpperCase() ?? "#";
    const key = /[A-Z]/.test(first) ? first : "#";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(artist);
  }

  const keys = Array.from(map.keys()).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  return keys.map((k) => ({ title: k, data: map.get(k)! }));
}

export default function ArtistListScreen() {
  const theme = useTheme();
  const {
    artists,
    loading,
    initialized,
    scanProgress,
    scanStatus,
    error,
    permissionGranted,
    requestPermission,
  } = useMusic();
  const { triggerHaptic } = useHaptic();
  const insets = useSafeAreaInsets();

  const sections = useMemo(() => buildSections(artists), [artists]);

  const navigateToArtist = (artist: Artist) => {
    triggerHaptic();
    if (artist.albums.length === 1) {
      router.push({
        pathname: "/album/[albumId]",
        params: { albumId: artist.albums[0].id },
      });
    } else {
      router.push({
        pathname: "/artist/[artistId]",
        params: { artistId: artist.id },
      });
    }
  };

  const props = {
    theme,
    insets,
    sections,
    initialized,
    permissionGranted,
    loading,
    scanProgress,
    scanStatus,
    error,
    onRequestPermission: requestPermission,
    onNavigateToArtist: navigateToArtist,
  };

  return theme.variant === "light"
    ? <ArtistListViewLight {...props} />
    : <ArtistListViewFull {...props} />;
}
