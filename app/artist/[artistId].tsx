import React from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusic } from "@/contexts/MusicContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useTheme } from "@/hooks/useTheme";
import { Album, Track } from "@/types/music";
import { ArtistScreenViewFull } from "@/views/ArtistScreenViewFull";
import { ArtistScreenViewLight } from "@/views/ArtistScreenViewLight";

function isSingle(album: Album): boolean {
  if (album.tracks.length !== 1) return false;
  const t = album.title.trim();
  return /[-–]\s*single$/i.test(t) || /\(single\)$/i.test(t);
}

export default function ArtistScreen() {
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  const { artists } = useMusic();
  const { playTrack } = usePlayer();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { panHandlers, translateX } = useSwipeBack();

  const artist = artists.find((a) => a.id === artistId);

  const albums = artist?.albums.filter((a) => !isSingle(a)) ?? [];
  const singles = artist?.albums.filter((a) => isSingle(a)) ?? [];
  const singleTracks: Track[] = singles.map((a) => a.tracks[0]);
  const allTracks = artist?.albums.flatMap((a) => a.tracks) ?? [];

  const playAll = () => allTracks.length > 0 && playTrack(allTracks[0], allTracks);
  const shuffle = () => {
    const s = [...allTracks].sort(() => Math.random() - 0.5);
    if (s.length > 0) playTrack(s[0], s);
  };

  const props = {
    theme,
    insets,
    artist,
    albums,
    singleTracks,
    allTracks,
    panHandlers,
    translateX,
    onPlayAll: playAll,
    onShuffle: shuffle,
    onNavigateToAlbum: (albumId: string) =>
      router.push({ pathname: "/album/[albumId]", params: { albumId } }),
    onPlaySingle: (track: Track) => playTrack(track, singleTracks),
  };

  return theme.variant === "light"
    ? <ArtistScreenViewLight {...props} />
    : <ArtistScreenViewFull {...props} />;
}
