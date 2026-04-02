import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StyledText } from "@/components/StyledText";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { Track } from "@/types/music";

interface TrackRowProps {
  track: Track;
  queue: Track[];
  trackNumber?: number;
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function TrackRow({ track, queue, trackNumber }: TrackRowProps) {
  const { invertColors } = useInvertColors();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const isActive = currentTrack?.id === track.id;

  const fg = invertColors ? "#000000" : "#ffffff";
  const fgMuted = invertColors ? "#888888" : "#3a3a3a";
  const activeFg = invertColors ? "#000000" : "#ffffff";
  const border = invertColors ? "#e8e8e8" : "#0e0e0e";

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        playTrack(track, queue);
      }}
      activeOpacity={0.5}
      style={[styles.row, { borderBottomColor: border }]}
    >
      <View style={styles.numWrap}>
        {isActive ? (
          <FontAwesome5
            name={isPlaying ? "pause" : "play"}
            size={9}
            color={activeFg}
            solid
            style={isPlaying ? undefined : styles.playOffset}
          />
        ) : trackNumber != null ? (
          <StyledText style={[styles.num, { color: fgMuted }]}>{trackNumber}</StyledText>
        ) : null}
      </View>

      <View style={styles.info}>
        <StyledText
          style={[styles.title, { color: isActive ? activeFg : fg }]}
          numberOfLines={1}
        >
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  numWrap: {
    width: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  num: { fontSize: 9 },
  playOffset: { marginLeft: 2 },
  info: { flex: 1 },
  title: { fontSize: 11 },
  duration: { fontSize: 9 },
});
