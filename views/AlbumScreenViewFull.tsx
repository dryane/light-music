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
import { TrackRow } from "@/components/TrackRow";
import { AlbumScreenViewProps } from "@/views/AlbumScreenTypes";
import { Track } from "@/types/music";
import { BackArrow } from "@/components/BackArrow";
import { useFull } from "@/styles/Full";
import { useGeneral } from "@/styles/General";
import { n } from "@/utils/scaling"

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
  onPlayAlbum,
  onShuffleAlbum,
}: AlbumScreenViewProps) {
  const { fg, fgMuted, bg, border, sectionBg } = theme;
  const full = useFull();
  const general = useGeneral();

  if (!album) {
    return (
      <View style={general.root}>
        <View style={general.centered}>
          <StyledText style={general.colorMuted}>Album not found.</StyledText>
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
        <View style={full.album.header}>
          <AlbumArt uri={album.albumArt} size={46} radius={4} loading={isArtLoading} />
          <View style={general.flexLeft}>
            <StyledText style={full.album.albumTitle} numberOfLines={1}>
              {album.title}
            </StyledText>
            <StyledText style={full.album.albumMeta}>
              {[album.year, `${tracks.length} songs`].filter(Boolean).join(" · ")}
            </StyledText>
          </View>
          <View style={full.album.headerIcons}>
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
        <View style={full.stickyHeader}>
          <StyledText style={full.stickyHeaderText}>
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
    <View style={general.root}>
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
          { paddingBottom: insets.bottom + 16 },
        ]}
      />
    </View>
  );
}