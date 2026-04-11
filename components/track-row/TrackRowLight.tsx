import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { formatDuration } from "@/components/track-row/utils";
import { TrackRowViewProps } from "@/components/track-row/types";
import { useTheme } from "@/hooks/useTheme";

export function TrackRowLight({
  track,
  trackNumber,
  isActive,
  isPlaying,
  theme,
  onPress,
}: TrackRowViewProps) {
  const { fg, fgMuted, border, font } = theme;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.5}
      style={[styles.row, { borderBottomColor: border, fontFamily: font }]}
    >
      <View style={styles.numWrap}>
        {isActive ? (
          <FontAwesome5
            name={isPlaying ? "pause" : "play"}
            size={9}
            color={fg}
            solid
            style={isPlaying ? undefined : styles.playOffset}
          />
        ) : trackNumber != null ? (
          <StyledText style={[styles.num, { color: fgMuted }]}>{trackNumber}</StyledText>
        ) : null}
      </View>
      <View style={styles.info}>
        <StyledText style={[styles.title, { color: fg }]} numberOfLines={1}>
          {track.title}
        </StyledText>
      </View>
      <StyledText style={[styles.duration, { color: fgMuted }]}>
        {formatDuration(track.duration)}
      </StyledText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 12,
  },
  numWrap: { width: 18, alignItems: "center", justifyContent: "center" },
  num: { fontSize: 9 },
  playOffset: { marginLeft: 2 },
  info: { flex: 1 },
  title: { fontSize: 11 },
  duration: { fontSize: 9 },
});