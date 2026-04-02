import React from "react";
import { View, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { router, useSegments } from "expo-router";
import { useActiveTrack, usePlaybackState, State } from "react-native-track-player";
import TrackPlayer from "react-native-track-player";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { useMusic } from "@/contexts/MusicContext";

export function MiniPlayer() {
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const { artists } = useMusic();
  const { invertColors } = useInvertColors();
  const segments = useSegments();

  const isPlaying = playbackState.state === State.Playing;

  // Hide on now playing screen
  if (!activeTrack || segments.includes("nowplaying" as never)) return null;

  const fg = invertColors ? "#000000" : "#ffffff";
  const fgMuted = invertColors ? "#888888" : "#484848";
  const bg = invertColors ? "#f5f5f5" : "#0e0e0e";
  const border = invertColors ? "#e0e0e0" : "#1a1a1a";

  const goToAlbum = () => {
    // Find albumId from our music context by matching track id
    const artist = artists.find((a) =>
      a.albums.some((alb) => alb.tracks.some((t) => t.id === activeTrack.id))
    );
    const album = artist?.albums.find((alb) =>
      alb.tracks.some((t) => t.id === activeTrack.id)
    );
    if (album) {
      router.push({ pathname: "/album/[albumId]", params: { albumId: album.id } });
    }
  };

  const goToArtist = () => {
    const artist = artists.find((a) =>
      a.albums.some((alb) => alb.tracks.some((t) => t.id === activeTrack.id))
    );
    if (!artist) return;
    if (artist.albums.length === 1) {
      router.push({ pathname: "/album/[albumId]", params: { albumId: artist.albums[0].id } });
    } else {
      router.push({ pathname: "/artist/[artistId]", params: { artistId: artist.id } });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg, borderTopColor: border }]}>
      <TouchableOpacity onPress={goToAlbum} activeOpacity={0.7}>
        <AlbumArt uri={activeTrack.artwork ?? null} size={34} radius={4} />
      </TouchableOpacity>

      <Pressable
        style={styles.info}
        onPress={() => router.push("/nowplaying")}
        onLongPress={goToArtist}
        delayLongPress={400}
      >
        <StyledText style={[styles.title, { color: fg }]} numberOfLines={1}>
          {activeTrack.title}
        </StyledText>
        <StyledText style={[styles.artist, { color: fgMuted }]} numberOfLines={1}>
          {activeTrack.artist}
        </StyledText>
      </Pressable>

      <TouchableOpacity
        onPress={() => isPlaying ? TrackPlayer.pause() : TrackPlayer.play()}
        hitSlop={12}
        style={styles.btn}
      >
        <FontAwesome5
          name={isPlaying ? "pause" : "play"}
          size={18}
          color={fg}
          solid
          style={isPlaying ? undefined : { marginLeft: 2 }}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => TrackPlayer.skipToNext()}
        hitSlop={12}
        style={styles.btn}
      >
        <FontAwesome5 name="step-forward" size={18} color={fg} solid />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 11,
  },
  info: { flex: 1, gap: 1 },
  title: { fontSize: 10, marginBottom: -3, fontWeight: "500" },
  artist: { fontSize: 8 },
  btn: { padding: 4 },
});
