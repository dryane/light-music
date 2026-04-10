import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { useMusic } from "@/contexts/MusicContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { Album, Track } from "@/types/music";

function isSingle(album: Album): boolean {
  if (album.tracks.length !== 1) return false;
  const t = album.title.trim();
  return (
    /[-–]\s*single$/i.test(t) ||
    /\(single\)$/i.test(t)
  );
}

export default function ArtistScreen() {
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  const { artists } = useMusic();
  const { playTrack } = usePlayer();
  const { invertColors } = useInvertColors();
  const insets = useSafeAreaInsets();
  const { panHandlers, translateX } = useSwipeBack();

  const fg = invertColors ? "#000000" : "#ffffff";
  const fgMuted = invertColors ? "#888888" : "#777";
  const bg = invertColors ? "#ffffff" : "#000000";
  const border = invertColors ? "#e8e8e8" : "#111111";
  const sectionBg = invertColors ? "#f0f0f0" : "#080808";

  const artist = artists.find((a) => a.id === artistId);
  console.log("[ARTIST] render", artistId, Date.now());

  if (!artist) {
    return (
      <Animated.View
        style={[styles.root, { backgroundColor: bg, paddingTop: insets.top, transform: [{ translateX }] }]}
        {...panHandlers}
      >
        <View style={styles.centered}>
          <StyledText style={{ color: fgMuted }}>Artist not found.</StyledText>
        </View>
      </Animated.View>
    );
  }

  const albums = artist.albums.filter((a) => !isSingle(a));
  const singles = artist.albums.filter((a) => isSingle(a));
  const singleTracks: Track[] = singles.map((a) => a.tracks[0]);
  const allTracks = artist.albums.flatMap((a) => a.tracks);

  const playAll = () => allTracks.length > 0 && playTrack(allTracks[0], allTracks);
  const shuffle = () => {
    const s = [...allTracks].sort(() => Math.random() - 0.5);
    if (s.length > 0) playTrack(s[0], s);
  };

type ListItem =
  | { type: "header" }
  | { type: "albumsHeader" }
  | { type: "album"; album: Album }
  | { type: "singlesHeader" }
  | { type: "single"; track: Track };

const listData: ListItem[] = [{ type: "header" }];
if (albums.length > 0) {
  listData.push({ type: "albumsHeader" });
  albums.forEach((a) => listData.push({ type: "album", album: a }));
}
if (singleTracks.length > 0) {
  listData.push({ type: "singlesHeader" });
  singleTracks.forEach((t) => listData.push({ type: "single", track: t }));
}
    const stickyIndices = listData
      .map((item, index) =>
        item.type === "albumsHeader" || item.type === "singlesHeader" ? index : null
      )
      .filter((i): i is number => i !== null);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "albumsHeader" || item.type === "singlesHeader") {
      return (
        <View style={[styles.sectionLabel, { backgroundColor: sectionBg, borderBottomColor: border }]}>
          <StyledText style={[styles.sectionLabelText, { color: fgMuted }]}>
            {item.type === "albumsHeader" ? "ALBUMS" : "SINGLES"}
          </StyledText>
        </View>
      );
    }
if (item.type === "header") {
  return (
    <View style={[styles.header, { borderBottomColor: border }]}>
      <View style={styles.headerLeft}>
        <StyledText style={[styles.artistName, { color: fg }]} numberOfLines={1}>
          {artist.name}
        </StyledText>
        <StyledText style={[styles.artistMeta, { color: fgMuted }]}>
          {albums.length > 0 ? `${albums.length} ${albums.length === 1 ? "album" : "albums"} · ` : ""}
          {allTracks.length} songs
        </StyledText>
      </View>
      <View style={styles.headerIcons}>
        <TouchableOpacity onPress={playAll} hitSlop={12}>
          <FontAwesome5 name="play" size={16} color={fg} solid />
        </TouchableOpacity>
        <TouchableOpacity onPress={shuffle} hitSlop={12}>
          <FontAwesome5 name="random" size={16} color={fgMuted} solid />
        </TouchableOpacity>
      </View>
    </View>
  );
}

    if (item.type === "album") {
      const a = item.album;
      return (
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: border }]}
          onPress={() => router.push({ pathname: "/album/[albumId]", params: { albumId: a.id } })}
          activeOpacity={0.5}
        >
          <AlbumArt uri={a.albumArt} size={52} radius={4} />
          <View style={styles.info}>
            <StyledText style={[styles.rowTitle, { color: fg }]} numberOfLines={1}>{a.title}</StyledText>
            <StyledText style={[styles.rowMeta, { color: fgMuted }]}>
              {[a.year, `${a.tracks.length} songs`].filter(Boolean).join(" · ")}
            </StyledText>
          </View>
          <FontAwesome5 name="chevron-right" size={12} color={fgMuted} solid />
        </TouchableOpacity>
      );
    }

    if (item.type === "single") {
      const t = item.track;
      return (
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: border }]}
          onPress={() => playTrack(t, singleTracks)}
          activeOpacity={0.5}
        >
          <AlbumArt uri={t.albumArt} size={52} radius={4} />
          <View style={styles.info}>
            <StyledText style={[styles.rowTitle, { color: fg }]} numberOfLines={1}>{t.title}</StyledText>
            {t.year && <StyledText style={[styles.rowMeta, { color: fgMuted }]}>{t.year}</StyledText>}
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <Animated.View
      style={[styles.root, { backgroundColor: bg, paddingTop: insets.top, transform: [{ translateX }] }]}
      {...panHandlers}
    >
      <FlatList
        data={listData}
        stickyHeaderIndices={stickyIndices}
  ListHeaderComponentStyle={{ zIndex: 0 }}
        keyExtractor={(item, index) => {
          if (item.type === "album") return item.album.id;
          if (item.type === "single") return item.track.id;
          return item.type + index;
        }}
        renderItem={renderItem}
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
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flex: 1, gap: 2 },
  artistName: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  artistMeta: { fontSize: 8 },
  headerIcons: { flexDirection: "row", gap: 16, paddingBottom: 2 },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  info: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 12, fontWeight: "700", marginBottom: -3, letterSpacing: -0.3 },
  rowMeta: { fontSize: 8 },
  listContent: {},
});
