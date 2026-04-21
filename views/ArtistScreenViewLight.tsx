import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { ArtistScreenViewProps } from "@/views/ArtistScreenTypes";
import { Album, Track } from "@/types/music";
import { BackArrow } from "@/components/BackArrow";
import { useLight } from "@/styles/Light";
import { useGeneral } from "@/styles/General";

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
  const light = useLight();
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
//       return (
//         <View style={light.header}>
//           <BackArrow />
//           <View style={general.flexLeft}>
//             <StyledText style={general.copy} numberOfLines={1}>
//               {artist.name}
//             </StyledText>
//           </View>
//         </View>
//       );
    }

    if (item.type === "albumsHeader" || item.type === "singlesHeader") {
      return (
        <View style={light.stickyHeader}>
          <StyledText style={light.stickyHeaderText}>
            {item.type === "albumsHeader" ? "ALBUMS" : "SINGLES"}
          </StyledText>
        </View>
      );
    }

    if (item.type === "album") {
      const a = item.album;
      return (
        <TouchableOpacity
          style={light.artist.albumRow}
          onPress={() => onNavigateToAlbum(a.id)}
          activeOpacity={0.5}
        >
          <View>
            <StyledText style={general.copy} numberOfLines={1}>
              {a.title}
            </StyledText>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === "single") {
      const t = item.track;
      return (
        <TouchableOpacity
          style={light.artist.albumRow}
          onPress={() => onPlaySingle(t)}
          activeOpacity={0.5}
        >
          <View>
            <StyledText style={general.copy} numberOfLines={1}>
              {t.title}
            </StyledText>
          </View>
        </TouchableOpacity>
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
            {artist.name}
          </StyledText>
        </View>
      </View>
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