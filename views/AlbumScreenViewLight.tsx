import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { TrackRow } from "@/components/TrackRow";
import { AlbumScreenViewProps } from "@/views/AlbumScreenTypes";
import { Track } from "@/types/music";

type ListItem =
  | { type: "header" }
  | { type: "tracksHeader" }
  | { type: "track"; track: Track; index: number };

export function AlbumScreenViewLight({
  theme,
  insets,
  album,
  isArtLoading,
  tracks,
  onPlayAlbum,
  onShuffleAlbum,
}: AlbumScreenViewProps) {
  const { fg, fgMuted, bg, border, sectionBg } = theme;

  if (!album) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: bg, paddingTop: insets.top },
        ]}
      >
        <View style={styles.centered}>
          <StyledText style={{ color: fgMuted }}>Album not found.</StyledText>
        </View>
      </View>
    );
  }

  const listData: ListItem[] = [
    { type: "header" },
    { type: "tracksHeader" },
    ...tracks.map((track, index) => ({ type: "track" as const, track, index })),
  ];

  const stickyIndices = listData
    .map((item, i) => (item.type === "tracksHeader" ? i : null))
    .filter((i): i is number => i !== null);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "header") {
      return (
        <View style={[styles.header, { borderBottomColor: border }]}>
          <View style={styles.headerInfo}>
            <StyledText style={[styles.albumTitle, { color: fg }]} numberOfLines={1}>
              {album.title}
            </StyledText>
          </View>
        </View>
      );
    }

    if (item.type === "tracksHeader") {
      return (
        <View
          style={[
            styles.sectionLabel,
            { backgroundColor: sectionBg, borderBottomColor: border },
          ]}
        >
          <StyledText style={[styles.sectionLabelText, { color: fgMuted }]}>
            TRACKS
          </StyledText>
        </View>
      );
    }

    if (item.type === "track") {
      return (
        <TrackRow
          track={item.track}
          queue={tracks}
          trackNumber={item.track.trackNumber}
        />
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
        keyExtractor={(item, index) => {
          if (item.type === "track") return item.track.id;
          return item.type + index;
        }}
        stickyHeaderIndices={stickyIndices}
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
