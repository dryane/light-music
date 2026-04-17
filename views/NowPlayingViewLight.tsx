import React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { PlayPauseButton, SkipPrevButton, SkipNextButton } from "@/components/PlayerButtons";
import { NowPlayingViewProps, fmt } from "@/views/NowPlayingTypes";
import { BackArrow } from "@/components/BackArrow";

const { width: SCREEN_W } = Dimensions.get("window");
const ART_SIZE = SCREEN_W - 275;

export function NowPlayingViewLight({
  theme,
  insets,
  activeTrack,
  isPlaying,
  labelSecs,
  duration,
  dragging,
  fillWidth,
  thumbLeft,
  seekPanHandlers,
  artPanHandlers,
  artX,
  artOpacity,
  barLayoutHandler,
  onTogglePlayPause,
  onSkipNext,
  onSkipPrev,
}: NowPlayingViewProps) {
  const { fg, fgDim, bg, trackBg } = theme;

  if (!activeTrack) {
    return (
      <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <StyledText style={{ color: fgDim }}>Nothing is playing.</StyledText>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: bg,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <BackArrow />
      </View>

      <View style={styles.container}>

        <Animated.View
          style={[styles.artWrap, { transform: [{ translateX: artX }], opacity: artOpacity }]}
          {...artPanHandlers}
        >
          <AlbumArt uri={activeTrack.artwork ?? null} size={ART_SIZE} radius={8} />
        </Animated.View>

        <View style={styles.trackInfo}>
          <StyledText style={[styles.trackTitle, { color: fg }]} numberOfLines={2}>
            {activeTrack.title}
          </StyledText>
          <StyledText style={[styles.trackSub, { color: fgDim }]} numberOfLines={1}>
            {activeTrack.artist}
            {activeTrack.album && activeTrack.album !== "Unknown Album"
              ? ` · ${activeTrack.album}`
              : ""}
          </StyledText>
        </View>

        <View style={styles.progressSection}>
          <View
            style={styles.seekHitArea}
            onLayout={barLayoutHandler}
            {...seekPanHandlers}
          >
            <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
              <Animated.View
                style={[styles.progressFill, { backgroundColor: fg, width: fillWidth }]}
              />
            </View>
          </View>

          <View style={styles.timeRow}>
            <StyledText style={[styles.time, { color: fgDim }]}>{fmt(labelSecs)}</StyledText>
            <StyledText style={[styles.time, { color: fgDim }]}>{fmt(duration)}</StyledText>
          </View>
        </View>

        <View style={styles.controls}>
          <SkipPrevButton onPress={onSkipPrev} color={fg} size={18} />
          <PlayPauseButton isPlaying={isPlaying} onPress={onTogglePlayPause} color={fg} size={100} />
          <SkipNextButton onPress={onSkipNext} color={fg} size={18} />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop:0.5,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    gap: 16,
  },
  artWrap: { alignSelf: "center" },
  trackInfo: { gap: 4, marginBottom: -15 },
  trackTitle: { fontSize: 14, fontWeight: "700", lineHeight: 24, marginBottom: -6 },
  trackSub: { fontSize: 10 },
  progressSection: { gap: 8, marginBottom: -30 },
  seekHitArea: { height: 36, justifyContent: "center", position: "relative" },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: -10 },
  time: { fontSize: 10 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    marginTop: -10,
  },
});
