import React from "react";
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
} from "react-native";
import { StyledText } from "@/components/StyledText";
import { ScanProgress } from "@/components/ScanProgress";
import { ArtistListViewProps } from "@/views/ArtistListTypes";
import { useFull } from "@/styles/Full";
import { useGeneral } from "@/styles/General";
import { FontAwesome5 } from "@expo/vector-icons";
import { n } from "@/utils/scaling"

export function ArtistListViewFull({
  theme,
  insets,
  sections,
  initialized,
  permissionGranted,
  loading,
  scanProgress,
  scanStatus,
  error,
  onRequestPermission,
  onNavigateToArtist,
}: ArtistListViewProps) {
  const full = useFull();
  const general = useGeneral();
  const { fg, fgMuted, bg, sectionBg, border } = theme;

  if (!initialized) {
    return <View style={general.root} />;
  }

  if (!permissionGranted) {
    return (
      <View style={general.root}>
        <View style={general.centered}>
          <StyledText style={full.h2}>Permission Required</StyledText>
          <StyledText style={full.body}>
            Allow access to your audio files to browse your library.
          </StyledText>
          <TouchableOpacity
            style={full.btn}
            onPress={onRequestPermission}
          >
            <StyledText style={full.btnText}>Grant Access</StyledText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading && scanProgress < 1) {

    return (
      <View style={general.root}>
        <View style={StyleSheet.absoluteFill}>
          <ScanProgress progress={scanProgress} status={scanStatus} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={general.root}>
        <View style={general.centered}>
          <StyledText style={full.h2}>Something went wrong</StyledText>
          <StyledText style={full.body}>{error}</StyledText>
        </View>
      </View>
    );
  }

  return (
    <View style={general.root}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View style={full.stickyHeader}>
            <StyledText style={full.stickyHeaderText}>
              {section.title}
            </StyledText>
          </View>
        )}
        renderItem={({ item: artist }) => (
          <TouchableOpacity
            style={full.home.artistRow}
            onPress={() => onNavigateToArtist(artist)}
            activeOpacity={0.5}
          >
            <View style={full.home.artistInfo}>
              <StyledText style={full.home.artistName} numberOfLines={1}>
                {artist.name}
              </StyledText>
              <StyledText style={full.home.artistMeta}>
                {artist.albums.length === 1
                  ? `${artist.trackCount} songs`
                  : `${artist.albums.length} albums · ${artist.trackCount} songs`}
              </StyledText>
            </View>
            <FontAwesome5 name="chevron-right" size={n(12)} color={fgMuted} solid />
          </TouchableOpacity>
        )}
        contentContainerStyle={[
          { paddingBottom: insets.bottom + 16 },
        ]}
        ListEmptyComponent={
          <View style={general.centered}>
            <StyledText style={full.h2}>No Music Found</StyledText>
            <StyledText style={full.body}>
              No audio files found on your device.
            </StyledText>
          </View>
        }
      />
    </View>
  );
}