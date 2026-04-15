import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { ArtistScreenViewProps } from "@/views/ArtistScreenTypes";
import { Album, Track } from "@/types/music";

type ListItem =
  | { type: "header" }
  | { type: "albumsHeader" }
  | { type: "album"; album: Album }
  | { type: "singlesHeader" }
  | { type: "single"; track: Track };

export function ArtistScreenViewLight({
  theme,
  insets,
  artist,
  albums,
  singleTracks,
  allTracks,
  onPlayAll,
  onShuffle,
  onNavigateToAlbum,
  onPlaySingle,
}: ArtistScreenViewProps) {
  const { fg, fgMuted, bg, border, sectionBg } = theme;

  if (!artist) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: bg, paddingTop: insets.top },
        ]}
      >
        <View style={styles.centered}>
          <StyledText style={{ color: fgMuted }}>Artist not found.</StyledText>
        </View>
      </View>
    );
  }

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
    if (item.type === "header") {
      return (
        <View style={[styles.header, { borderBottomColor: border }]}>
          <View style={styles.headerLeft}>
            <StyledText style={[styles.artistName, { color: fg }]} numberOfLines={1}>
              {artist.name}
            </StyledText>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={onPlayAll} hitSlop={12}>
              <FontAwesome5 name="play" size={16} color={fg} solid />
            </TouchableOpacity>
            <TouchableOpacity onPress={onShuffle} hitSlop={12}>
              <FontAwesome5 name="random" size={16} color={fgMuted} solid />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (item.type === "albumsHeader" || item.type === "singlesHeader") {
      return (
        <View
          style={[
            styles.sectionLabel,
            { backgroundColor: sectionBg, borderBottomColor: border },
          ]}
        >
          <StyledText style={[styles.sectionLabelText, { color: fgMuted }]}>
            {item.type === "albumsHeader" ? "ALBUMS" : "SINGLES"}
          </StyledText>
        </View>
      );
    }

    if (item.type === "album") {
      const a = item.album;
      return (
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: border }]}
          onPress={() => onNavigateToAlbum(a.id)}
          activeOpacity={0.5}
        >
          <View style={styles.info}>
            <StyledText style={[styles.rowTitle, { color: fg }]} numberOfLines={1}>
              {a.title}
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
          onPress={() => onPlaySingle(t)}
          activeOpacity={0.5}
        >
          <View style={styles.info}>
            <StyledText style={[styles.rowTitle, { color: fg }]} numberOfLines={1}>
              {t.title}
            </StyledText>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: bg, paddingTop: insets.top },
      ]}
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
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
      />
    </View>
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
    paddingVertical: 12,
    gap: 12,
  },
  info: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 12, marginBottom: -3, letterSpacing: -0.3 },
  rowMeta: { fontSize: 8 },
  listContent: {},
});
