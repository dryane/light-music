import React from "react";
import { View, StyleSheet, TouchableOpacity, Pressable, Animated } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { MiniPlayerViewProps } from "@/components/mini-player/types";
import { useFull } from "@/styles/Full";
import { useGeneral } from "@/styles/General";
import { n } from "@/utils/scaling"


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
  const full = useFull();
  const general = useGeneral();

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      {/* Thin progress bar along top edge */}
      <View style={general.miniPlayer.progressBar}>
        <View
          style={[
            general.miniPlayer.progressFill,
            { width: `${progressRatio * 100}%` },
          ]}
        />
      </View>

      <View style={ general.miniPlayer.container }>
        <TouchableOpacity
          onPress={onNavigate}
          activeOpacity={1}
          style={!hasArtwork ? { marginRight: -11 } : undefined}
        >
          <AlbumArt uri={activeTrack.artwork ?? null} size={34} radius={4} />
        </TouchableOpacity>

        <Pressable style={general.miniPlayer.info} onPress={onNavigate}>
          <StyledText style={general.miniPlayer.title} numberOfLines={1}>
            {activeTrack.title}
          </StyledText>
          <StyledText style={general.miniPlayer.artist} numberOfLines={1}>
            {activeTrack.artist}
          </StyledText>
        </Pressable>

        <TouchableOpacity
          onPress={onStop}
          hitSlop={n(12)}
          style={general.miniPlayer.btn}
        >
          <FontAwesome5 name="stop" size={n(18)} color={fgMuted} solid />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onTogglePlay}
          hitSlop={n(12)}
          style={general.miniPlayer.btn}
        >
          <FontAwesome5
            name={isPlaying ? "pause" : "play"}
            size={n(18)}
            color={fg}
            solid
            style={{marginRight: n(-2)}}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSkipNext}
          hitSlop={n(12)}
          style={general.miniPlayer.btn}
        >
          <FontAwesome5 name="step-forward" size={n(18)} color={fg} solid />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}