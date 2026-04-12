import React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { StyledText } from "@/components/StyledText";
import { MarqueeText } from "@/components/MarqueeText";
import { AlbumArt } from "@/components/AlbumArt";
import { PlayPauseButton, SkipPrevButton, SkipNextButton } from "@/components/PlayerButtons";
import { NowPlayingViewProps, fmt } from "@/views/NowPlayingTypes";

const { width: SCREEN_W } = Dimensions.get("window");
const ART_SIZE = SCREEN_W - 200;

export function NowPlayingViewFull({
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
  screenPanHandlers,
  screenY,
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
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor: bg,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 16,
          transform: [{ translateY: screenY }],
        },
      ]}
      {...screenPanHandlers}
    >
      <View style={styles.handleWrap}>
        <View style={[styles.handle, { backgroundColor: fgDim }]} />
      </View>

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
        <MarqueeText style={[styles.trackSub, { color: fgDim }]}>
          {`${activeTrack.artist}${activeTrack.album && activeTrack.album !== "Unknown Album" ? ` · ${activeTrack.album}` : ""}`}
        </MarqueeText>
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
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: fg,
                left: thumbLeft,
                transform: [{ scale: dragging ? 1.4 : 1 }],
              },
            ]}
          />
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    gap: 16,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  handleWrap: { alignItems: "center", marginBottom: -8 },
  handle: { width: 36, height: 4, borderRadius: 2, opacity: 0.3 },
  artWrap: { alignSelf: "center" },
  trackInfo: { gap: 4, marginBottom: -15 },
  trackTitle: { fontSize: 14, fontWeight: "700", lineHeight: 24, marginBottom: -6 },
  trackSub: { fontSize: 10 },
  progressSection: { gap: 8, marginBottom: -30 },
  seekHitArea: { height: 36, justifyContent: "center", position: "relative" },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  thumb: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 10,
    marginLeft: -8,
  },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: -5 },
  time: { fontSize: 10 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    marginTop: -10,
  },
});
