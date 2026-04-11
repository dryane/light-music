import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@/hooks/useTheme";
import { useHaptic } from "@/contexts/HapticContext";
import { Track } from "@/types/music";
import { TrackRowFull } from "@/components/track-row/TrackRowFull";
import { TrackRowLight } from "@/components/track-row/TrackRowLight";

interface TrackRowProps {
  track: Track;
  queue: Track[];
  trackNumber?: number | null;
}

export function TrackRow({ track, queue, trackNumber }: TrackRowProps) {
  const { fg, fgMuted, border } = useTheme();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { triggerHaptic } = useHaptic();
  const isActive = currentTrack?.id === track.id;
  const theme = useTheme();

  const props = {
    track,
    trackNumber,
    isActive,
    isPlaying,
    theme,
    onPress: () => { triggerHaptic(); playTrack(track, queue); },
  };

  return theme.variant === "light"
    ? <TrackRowLight {...props} />
    : <TrackRowFull {...props} />;
}
