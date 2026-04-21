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
import { BackArrow } from "@/components/BackArrow";
import { useFull } from "@/styles/Full";
import { useGeneral } from "@/styles/General";
import { n } from "@/utils/scaling"

type ListItem =
  | { type: "header" }
  | { type: "albumsHeader" }
  | { type: "album"; album: Album }
  | { type: "singlesHeader" }
  | { type: "single"; track: Track };

export function ArtistScreenViewFull({
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
  const full = useFull();
  const general = useGeneral();

  if (!artist) {
    return (
      <View style={general.root}>
        <View style={general.centered}>
          <StyledText style={general.colorMuted}>Artist not found.</StyledText>
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
        <View style={full.artist.header}>
          <View style={general.flexLeft}>
            <StyledText style={full.artist.artistName} numberOfLines={1}>
              {artist.name}
            </StyledText>
            <StyledText style={full.artist.artistMeta}>
              {albums.length > 0
                ? `${albums.length} ${albums.length === 1 ? "album" : "albums"} · `
                : ""}
              {singleTracks.length > 0
                ? `${singleTracks.length} ${singleTracks.length === 1 ? "single" : "singles"} · `
                : ""}
              {allTracks.length} songs
            </StyledText>
          </View>
          <View style={full.artist.headerIcons}>
            <TouchableOpacity onPress={onPlayAll} hitSlop={12}>
              <FontAwesome5 name="play" size={n(16)} color={fg} solid />
            </TouchableOpacity>
            <TouchableOpacity onPress={onShuffle} hitSlop={12}>
              <FontAwesome5 name="random" size={n(16)} color={fgMuted} solid />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (item.type === "albumsHeader" || item.type === "singlesHeader") {
      return (
        <View style={full.stickyHeader}>
          <StyledText style={full.stickyHeaderText}>
            {item.type === "albumsHeader" ? "ALBUMS" : "SINGLES"}
          </StyledText>
        </View>
      );
    }

    if (item.type === "album") {
      const a = item.album;
      return (
        <TouchableOpacity
          style={full.artist.albumRow}
          onPress={() => onNavigateToAlbum(a.id)}
          activeOpacity={0.5}
        >
          <AlbumArt uri={a.albumArt} size={52} radius={4} />
          <View style={general.flexLeft}>
            <StyledText style={full.artist.rowTitle} numberOfLines={1}>
              {a.title}
            </StyledText>
            <StyledText style={full.artist.rowMeta}>
              {[a.year, `${a.tracks.length} songs`].filter(Boolean).join(" · ")}
            </StyledText>
          </View>
          <FontAwesome5 name="chevron-right" size={n(12)} color={fgMuted} solid />
        </TouchableOpacity>
      );
    }

    if (item.type === "single") {
      const t = item.track;
      return (
        <TouchableOpacity
          style={full.artist.albumRow}
          onPress={() => onPlaySingle(t)}
          activeOpacity={0.5}
        >
          <AlbumArt uri={t.albumArt} size={52} radius={4} />
          <View style={general.flexLeft}>
            <StyledText style={full.artist.rowTitle} numberOfLines={1}>
              {t.title}
            </StyledText>
            {t.year && (
              <StyledText style={full.artist.rowMeta}>
                {t.year}
              </StyledText>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={general.root}>
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
          { paddingBottom: insets.bottom + 16 },
        ]}
      />
    </View>
  );
}