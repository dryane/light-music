import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { TrackRow } from "@/components/TrackRow";
import { AlbumScreenViewProps } from "@/views/AlbumScreenTypes";
import { Track } from "@/types/music";

type ListItem =
  | { type: "header" }
  | { type: "tracksHeader" }
  | { type: "track"; track: Track; index: number };

export function AlbumScreenViewFull({
  theme,
  insets,
  album,
  isArtLoading,
  tracks,
  panHandlers,
  translateX,
  onPlayAlbum,
  onShuffleAlbum,
}: AlbumScreenViewProps) {
  const { fg, fgMuted, bg, border, sectionBg } = theme;

  if (!album) {
    return (
      <Animated.View
        style={[
          styles.root,
          { backgroundColor: bg, paddingTop: insets.top, transform: [{ translateX }] },
        ]}
        {...panHandlers}
      >
        <View style={styles.centered}>
          <StyledText style={{ color: fgMuted }}>Album not found.</StyledText>
        </View>
      </Animated.View>
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
          <AlbumArt uri={album.albumArt} size={52} radius={4} loading={isArtLoading} />
          <View style={styles.headerInfo}>
            <StyledText style={[styles.albumTitle, { color: fg }]} numberOfLines={1}>
              {album.title}
            </StyledText>
            <StyledText style={[styles.albumMeta, { color: fgMuted }]}>
              {[album.year, `${tracks.length} songs`].filter(Boolean).join(" · ")}
            </StyledText>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={onPlayAlbum} hitSlop={12}>
              <FontAwesome5 name="play" size={16} color={fg} solid />
            </TouchableOpacity>
            <TouchableOpacity onPress={onShuffleAlbum} hitSlop={12}>
              <FontAwesome5 name="random" size={16} color={fgMuted} solid />
            </TouchableOpacity>
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
    <Animated.View
      style={[
        styles.root,
        { backgroundColor: bg, paddingTop: insets.top, transform: [{ translateX }] },
      ]}
      {...panHandlers}
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
