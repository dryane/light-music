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
import { useLight } from "@/styles/Light";
import { useGeneral } from "@/styles/General";

export function ArtistListViewLight({
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
  const light = useLight();
  const general = useGeneral();

  if (!initialized) {
    return <View style={[light.root, light.bg]} />;
  }

  if (!permissionGranted) {
    return (
      <View style={general.root}>
        <View style={general.centered}>
          <StyledText style={[light.h2, general.color]}>Permission Required</StyledText>
          <StyledText style={[light.body, general.colorMuted]}>
            Allow access to your audio files to browse your library.
          </StyledText>
          <TouchableOpacity
            style={light.btn}
            onPress={onRequestPermission}
          >
            <StyledText style={light.btnText}>Grant Access</StyledText>
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
          <StyledText style={[light.h2, general.color]}>Something went wrong</StyledText>
          <StyledText style={[light.body, general.colorMuted ]}>{error}</StyledText>
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
        renderItem={({ item: artist }) => (
          <TouchableOpacity
            style={light.home.artistRow}
            onPress={() => onNavigateToArtist(artist)}
            activeOpacity={0.5}
          >
            <View style={light.home.artistInfo}>
              <StyledText style={light.home.artistName} numberOfLines={1}>
                {artist.name}
              </StyledText>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={[
          { paddingBottom: insets.bottom + 16 },
        ]}
        ListEmptyComponent={
          <View style={general.centered}>
            <StyledText style={[light.h2, general.color]}>No Music Found</StyledText>
            <StyledText style={[light.body, general.colorMuted]}>
              No audio files found on your device.
            </StyledText>
          </View>
        }
      />
    </View>
  );
}
