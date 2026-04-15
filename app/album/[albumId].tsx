import React, { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusic } from "@/contexts/MusicContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@/hooks/useTheme";
import { shuffle } from "@/utils/async";
import { MINI_PLAYER_HEIGHT } from "@/components/MiniPlayer";
import { AlbumScreenViewFull } from "@/views/AlbumScreenViewFull";
import { AlbumScreenViewLight } from "@/views/AlbumScreenViewLight";

export default function AlbumScreen() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  const { albums, fetchingArtAlbumIds = new Set(), fetchMissingArt } = useMusic();
  const { playTrack, currentTrack } = usePlayer();
  const theme = useTheme();
  const rawInsets = useSafeAreaInsets();
  const insets = { ...rawInsets, bottom: rawInsets.bottom + (currentTrack ? MINI_PLAYER_HEIGHT : 0) };

  // Trigger art fetch (TTL-gated) when an album view is opened
  useEffect(() => {
    fetchMissingArt();
  }, []);

  const album = albums.find((a) => a.id === albumId);
  const isArtLoading = album ? fetchingArtAlbumIds.has(album.id) : false;
  const tracks = album?.tracks ?? [];

  const playAlbum = () => tracks.length > 0 && playTrack(tracks[0], tracks);
  const shuffleAlbum = () => {
    const s = shuffle(tracks);
    if (s.length > 0) playTrack(s[0], s);
  };

  const props = {
    theme,
    insets,
    album,
    isArtLoading,
    tracks,
    onPlayAlbum: playAlbum,
    onShuffleAlbum: shuffleAlbum,
  };

  return theme.variant === "light"
    ? <AlbumScreenViewLight {...props} />
    : <AlbumScreenViewFull {...props} />;
}
