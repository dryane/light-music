import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { router, useSegments } from "expo-router";
import {
  useActiveTrack,
  usePlaybackState,
  useProgress,
  State,
} from "react-native-track-player";
import TrackPlayer from "react-native-track-player";
import { useTheme } from "@/hooks/useTheme";
import { useHaptic } from "@/contexts/HapticContext";
import { MiniPlayerFull } from "@/components/mini-player/MiniPlayerFull";
import { MiniPlayerLight } from "@/components/mini-player/MiniPlayerLight";
import { MiniPlayerViewProps } from "@/components/mini-player/types";

export function MiniPlayer() {
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const progress = useProgress(1000);
  const theme = useTheme();
  const { triggerHaptic } = useHaptic();
  const segments = useSegments();

  const isPlaying = playbackState.state === State.Playing;
  const progressRatio =
    progress.duration > 0 ? progress.position / progress.duration : 0;

  // Slide-up animation on first appearance
  const slideAnim = useRef(new Animated.Value(60)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (activeTrack && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 14,
      }).start();
    }
    if (!activeTrack) {
      hasAnimated.current = false;
      slideAnim.setValue(60);
    }
  }, [!!activeTrack]);

  if (!activeTrack || segments.includes("nowplaying" as never)) return null;

  const props: MiniPlayerViewProps = {
    activeTrack,
    isPlaying,
    progressRatio,
    slideAnim,
    theme,
    onNavigate: () => router.push("/nowplaying"),
    onStop: () => TrackPlayer.reset(),
    onTogglePlay: () => {
      triggerHaptic();
      isPlaying ? TrackPlayer.pause() : TrackPlayer.play();
    },
    onSkipNext: () => {
      triggerHaptic();
      TrackPlayer.skipToNext();
    },
    hasArtwork: !!activeTrack.artwork,
  };

  return theme.variant === "light"
    ? <MiniPlayerLight {...props} />
    : <MiniPlayerFull {...props} />;
}
