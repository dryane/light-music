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
import { useFull } from "@/styles/Full";
import { useGeneral } from "@/styles/General";
import { n } from "@/utils/scaling"

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
  artX,
  artOpacity,
  barLayoutHandler,
  onTogglePlayPause,
  onSkipNext,
  onSkipPrev,
}: NowPlayingViewProps) {
  const { fg, fgDim, bg, trackBg } = theme;
  const full = useFull();
  const general = useGeneral();

  if (!activeTrack) {
    return (
      <View style={general.root}>
        <View style={general.centered}>
          <StyledText style={general.colorDim}>Nothing is playing.</StyledText>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[ general.root, full.nowPlaying.container]}
    >
      <View style={full.nowPlaying.handleWrap}>
        <View style={full.nowPlaying.handle} />
      </View>

      <Animated.View
        style={[full.nowPlaying.artWrap, { transform: [{ translateX: artX }], opacity: artOpacity }]}
        {...artPanHandlers}
      >
        <AlbumArt uri={activeTrack.artwork ?? null} size={ART_SIZE} radius={8} />
      </Animated.View>

      <View style={general.nowPlaying.trackInfo}>
        <StyledText style={general.nowPlaying.trackTitle} numberOfLines={2}>
          {activeTrack.title}
        </StyledText>
        <MarqueeText style={general.nowPlaying.trackSub}>
          {`${activeTrack.artist}${activeTrack.album && activeTrack.album !== "Unknown Album" ? ` · ${activeTrack.album}` : ""}`}
        </MarqueeText>
      </View>

      <View style={general.nowPlaying.progressSection}>
        <View
          style={general.nowPlaying.seekHitArea}
          onLayout={barLayoutHandler}
          {...seekPanHandlers}
        >
          <View style={general.nowPlaying.progressTrack}>
            <Animated.View
              style={[general.nowPlaying.progressFill, { width: fillWidth }]}
            />
          </View>
        </View>

        <View style={general.nowPlaying.timeRow}>
          <StyledText style={[general.nowPlaying.time, { color: fgDim }]}>{fmt(labelSecs)}</StyledText>
          <StyledText style={[general.nowPlaying.time, { color: fgDim }]}>{fmt(duration)}</StyledText>
        </View>
      </View>

      <View style={general.nowPlaying.controls}>
        <SkipPrevButton onPress={onSkipPrev} color={fg} size={18} />
        <PlayPauseButton isPlaying={isPlaying} onPress={onTogglePlayPause} color={fg} size={100} />
        <SkipNextButton onPress={onSkipNext} color={fg} size={18} />
      </View>
    </View>
  );
}