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
import { useLight } from "@/styles/Light";
import { useGeneral } from "@/styles/General";
import { n } from "@/utils/scaling"

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
  const light = useLight();
  const general = useGeneral();

  if (!activeTrack) {
    return (
      <View style={general.root}>
        <View style={light.header}>
          <BackArrow />
          <View style={general.flexLeft}>
            <StyledText style={general.copy} numberOfLines={1}/>
          </View>
        </View>
        <View style={general.centered}>
          <StyledText style={general.colorDim}>Nothing is playing.</StyledText>
        </View>
      </View>
    );
  }

  return (
    <View style={general.root}>
      <View style={light.header}>
        <BackArrow />
        <View style={general.flexLeft}>
          <StyledText style={general.copy} numberOfLines={1}/>
        </View>
      </View>

      <View style={[general.verticalCentered, light.nowPlaying.container]}>

        <View style={general.nowPlaying.trackInfo}>
          <StyledText style={general.nowPlaying.trackTitle} numberOfLines={2}>
            {activeTrack.title}
          </StyledText>
          <StyledText style={general.nowPlaying.trackSub} numberOfLines={1}>
            {activeTrack.artist}
            {activeTrack.album && activeTrack.album !== "Unknown Album"
              ? ` · ${activeTrack.album}`
              : ""}
          </StyledText>
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
            <StyledText style={general.nowPlaying.time}>{fmt(labelSecs)}</StyledText>
            <StyledText style={general.nowPlaying.time}>{fmt(duration)}</StyledText>
          </View>
        </View>

        <View style={[general.nowPlaying.controls, {marginTop: n(25), marginBottom:n(-25)}]}>
          <SkipPrevButton onPress={onSkipPrev} color={fg} size={18} />
          <PlayPauseButton isPlaying={isPlaying} onPress={onTogglePlayPause} color={fg} size={100} />
          <SkipNextButton onPress={onSkipNext} color={fg} size={18} />
        </View>

      </View>
    </View>
  );
}