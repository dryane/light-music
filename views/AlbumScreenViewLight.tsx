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
import { BackArrow } from "@/components/BackArrow";
import { useLight } from "@/styles/Light";
import { useGeneral } from "@/styles/General";

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
  const light = useLight();
  const general = useGeneral();

  if (!album) {
    return (
      <View style={general.root}>
        <View style={general.centered}>
          <StyledText style={general.copy}>Album not found.</StyledText>
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
//       return (
//         <View style={light.header}>
//           <BackArrow />
//           <View style={general.flexLeft}>
//             <StyledText style={general.copy} numberOfLines={1}>
//               {album.title}
//             </StyledText>
//           </View>
//         </View>
//       );
    }

    if (item.type === "tracksHeader") {
      return (
        <View style={light.stickyHeader}>
          <StyledText style={light.stickyHeaderText}>
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
      <View style={light.header}>
        <BackArrow />
        <View style={general.flexLeft}>
          <StyledText style={general.copy} numberOfLines={1}>
            {album.title}
          </StyledText>
        </View>
      </View>
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