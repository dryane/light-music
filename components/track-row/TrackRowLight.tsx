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
      delayPressIn={75}
      style={[styles.row, { fontFamily: font }]}
    >
      <View style={styles.numWrap}>
        {isActive ? (
          <FontAwesome5
            name={isPlaying ? "pause" : "play"}
            size={8}
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
  },
  numWrap: {
    width: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -5,
    marginRight: -5,
    marginTop:1,
  },
  num: { fontSize: 8 },
  playOffset: { marginLeft: 2 },
  info: { flex: 1 },
  title: { fontSize: 12, letterSpacing: -0.3 },
  duration: { fontSize: 8,  },
});