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
  const { fg, fgMuted, bg, sectionBg, border } = theme;

  if (!initialized) {
    return <View style={[styles.root, { backgroundColor: bg }]} />;
  }

  if (!permissionGranted) {
    return (
      <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <StyledText style={[styles.h2, { color: fg }]}>Permission Required</StyledText>
          <StyledText style={[styles.body, { color: fgMuted }]}>
            Allow access to your audio files to browse your library.
          </StyledText>
          <TouchableOpacity
            style={[styles.btn, { borderColor: fg }]}
            onPress={onRequestPermission}
          >
            <StyledText style={[styles.btnText, { color: fg }]}>Grant Access</StyledText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading && scanProgress < 1) {

    return (
      <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
        <View style={StyleSheet.absoluteFill}>
          <ScanProgress progress={scanProgress} status={scanStatus} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <StyledText style={[styles.h2, { color: fg }]}>Something went wrong</StyledText>
          <StyledText style={[styles.body, { color: fgMuted }]}>{error}</StyledText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: sectionBg, borderBottomColor: border },
            ]}
          >
            <StyledText style={[styles.sectionTitle, { color: fgMuted }]}>
              {section.title}
            </StyledText>
          </View>
        )}
        renderItem={({ item: artist }) => (
          <TouchableOpacity
            style={[styles.artistRow, { borderBottomColor: border }]}
            onPress={() => onNavigateToArtist(artist)}
            activeOpacity={0.5}
          >
            <View style={styles.artistInfo}>
              <StyledText style={[styles.artistName, { color: fg }]} numberOfLines={1}>
                {artist.name}
              </StyledText>
              <StyledText style={[styles.artistMeta, { color: fgMuted }]}>
                {artist.albums.length === 1
                  ? `${artist.trackCount} songs`
                  : `${artist.albums.length} albums · ${artist.trackCount} songs`}
              </StyledText>
            </View>
            <StyledText style={[styles.chevron, { color: fgMuted }]}>›</StyledText>
          </TouchableOpacity>
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
        ListEmptyComponent={
          <View style={styles.centered}>
            <StyledText style={[styles.h2, { color: fg }]}>No Music Found</StyledText>
            <StyledText style={[styles.body, { color: fgMuted }]}>
              No audio files found on your device.
            </StyledText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 36,
    minHeight: 300,
  },
  h2: { fontSize: 19, fontWeight: "600", textAlign: "center" },
  body: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  btn: { borderWidth: 1, paddingHorizontal: 28, paddingVertical: 10 },
  btnText: { fontSize: 15 },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingVertical: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  artistInfo: { flex: 1, gap: 0 },
  artistName: { fontSize: 16, marginBottom: -3 },
  artistMeta: { fontSize: 8 },
  chevron: { fontSize: 18 },
  listContent: {},
});
