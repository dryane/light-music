import React from "react";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusic } from "@/contexts/MusicContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useTheme } from "@/hooks/useTheme";
import { AlbumScreenViewFull } from "@/views/AlbumScreenViewFull";
import { AlbumScreenViewLight } from "@/views/AlbumScreenViewLight";

export default function AlbumScreen() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  const { albums, fetchingArtAlbumIds = new Set() } = useMusic();
  const { playTrack } = usePlayer();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { panHandlers, translateX } = useSwipeBack();

  const album = albums.find((a) => a.id === albumId);
  const isArtLoading = album ? fetchingArtAlbumIds.has(album.id) : false;
  const tracks = album?.tracks ?? [];

  const playAlbum = () => tracks.length > 0 && playTrack(tracks[0], tracks);
  const shuffleAlbum = () => {
    const s = [...tracks].sort(() => Math.random() - 0.5);
    if (s.length > 0) playTrack(s[0], s);
  };

  const props = {
    theme,
    insets,
    album,
    isArtLoading,
    tracks,
    panHandlers,
    translateX,
    onPlayAlbum: playAlbum,
    onShuffleAlbum: shuffleAlbum,
  };

  return theme.variant === "light"
    ? <AlbumScreenViewLight {...props} />
    : <AlbumScreenViewFull {...props} />;
}
