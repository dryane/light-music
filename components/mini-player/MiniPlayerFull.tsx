import React from "react";
import { View, StyleSheet, TouchableOpacity, Pressable, Animated } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { MiniPlayerViewProps } from "@/components/mini-player/types";

export function MiniPlayerFull({
  activeTrack,
  isPlaying,
  progressRatio,
  slideAnim,
  theme,
  onNavigate,
  onStop,
  onTogglePlay,
  onSkipNext,
  hasArtwork,
}: MiniPlayerViewProps) {
  const { fg, fgMuted, bg, border, progressBg } = theme;

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      {/* Thin progress bar along top edge */}
      <View style={[styles.progressBar, { backgroundColor: progressBg }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: fg, width: `${progressRatio * 100}%` },
          ]}
        />
      </View>

      <View style={[styles.container, { backgroundColor: bg, borderTopColor: border }]}>
        <TouchableOpacity
          onPress={onNavigate}
          activeOpacity={1}
          style={!hasArtwork ? { marginRight: -11 } : undefined}
        >
          <AlbumArt uri={activeTrack.artwork ?? null} size={34} radius={4} />
        </TouchableOpacity>

        <Pressable style={styles.info} onPress={onNavigate}>
          <StyledText style={[styles.title, { color: fg }]} numberOfLines={1}>
            {activeTrack.title}
          </StyledText>
          <StyledText style={[styles.artist, { color: fgMuted }]} numberOfLines={1}>
            {activeTrack.artist}
          </StyledText>
        </Pressable>

        <TouchableOpacity
          onPress={onStop}
          hitSlop={12}
          style={styles.btn}
        >
          <FontAwesome5 name="stop" size={16} color={fgMuted} solid />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onTogglePlay}
          hitSlop={12}
          style={styles.btn}
        >
          <FontAwesome5
            name={isPlaying ? "pause" : "play"}
            size={18}
            color={fg}
            solid
            style={isPlaying ? undefined : { marginLeft: 2 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSkipNext}
          hitSlop={12}
          style={styles.btn}
        >
          <FontAwesome5 name="step-forward" size={18} color={fg} solid />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  progressBar: { height: 1.5, width: "100%" },
  progressFill: { height: "100%" },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 14,
    paddingLeft: 18,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 11,
  },
  info: { flex: 1, gap: 1 },
  title: { fontSize: 10, marginBottom: -3, fontWeight: "500" },
  artist: { fontSize: 8 },
  btn: { padding: 4 },
});
