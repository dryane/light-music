import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { TrackRow } from "@/components/TrackRow";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { useMusic } from "@/contexts/MusicContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useSwipeBack } from "@/hooks/useSwipeBack";

export default function AlbumScreen() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  const { albums } = useMusic();
  const { playTrack } = usePlayer();
  const { invertColors } = useInvertColors();
  const insets = useSafeAreaInsets();
  const { panHandlers, translateX } = useSwipeBack();

  const fg = invertColors ? "#000000" : "#ffffff";
  const fgMuted = invertColors ? "#888888" : "#777";
  const bg = invertColors ? "#ffffff" : "#000000";
  const border = invertColors ? "#e8e8e8" : "#111111";
  const sectionBg = invertColors ? "#f0f0f0" : "#080808";

  const album = albums.find((a) => a.id === albumId);

  if (!album) {
    return (
      <Animated.View
        style={[styles.root, { backgroundColor: bg, paddingTop: insets.top, transform: [{ translateX }] }]}
        {...panHandlers}
      >
        <View style={styles.centered}>
          <StyledText style={{ color: fgMuted }}>Album not found.</StyledText>
        </View>
      </Animated.View>
    );
  }

  const tracks = album.tracks;
  const playAlbum = () => tracks.length > 0 && playTrack(tracks[0], tracks);
  const shuffleAlbum = () => {
    const s = [...tracks].sort(() => Math.random() - 0.5);
    if (s.length > 0) playTrack(s[0], s);
  };

  const Header = () => (
    <>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <AlbumArt uri={album.albumArt} size={52} radius={4} />
        <View style={styles.headerInfo}>
          <StyledText style={[styles.albumTitle, { color: fg }]} numberOfLines={1}>
            {album.title}
          </StyledText>
          <StyledText style={[styles.albumMeta, { color: fgMuted }]}>
            {[album.year, `${tracks.length} songs`].filter(Boolean).join(" · ")}
          </StyledText>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={playAlbum} hitSlop={12}>
            <FontAwesome5 name="play" size={16} color={fg} solid />
          </TouchableOpacity>
          <TouchableOpacity onPress={shuffleAlbum} hitSlop={12}>
            <FontAwesome5 name="random" size={16} color={fgMuted} solid />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.sectionLabel, { backgroundColor: sectionBg, borderBottomColor: border }]}>
        <StyledText style={[styles.sectionLabelText, { color: fgMuted }]}>TRACKS</StyledText>
      </View>
    </>
  );

  return (
    <Animated.View
      style={[styles.root, { backgroundColor: bg, paddingTop: insets.top, transform: [{ translateX }] }]}
      {...panHandlers}
    >
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        renderItem={({ item, index }) => (
          <TrackRow track={item} queue={tracks} trackNumber={index + 1} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerInfo: { flex: 1, gap: 2 },
  albumTitle: { fontSize: 12, fontWeight: "700", letterSpacing: -0.3, marginBottom: -3 },
  albumMeta: { fontSize: 8 },
  headerIcons: { flexDirection: "row", gap: 16 },
  sectionLabel: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionLabelText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  listContent: {},
});
