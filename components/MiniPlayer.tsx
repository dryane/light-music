import React, { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { router, useSegments } from "expo-router";
import {
  useActiveTrack,
  usePlaybackState,
  useProgress,
  State,
} from "react-native-track-player";
import { useTheme } from "@/hooks/useTheme";
import { useHaptic } from "@/contexts/HapticContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { MiniPlayerFull } from "@/components/mini-player/MiniPlayerFull";
import { MiniPlayerLight } from "@/components/mini-player/MiniPlayerLight";
import { MiniPlayerViewProps } from "@/components/mini-player/types";

export function MiniPlayer() {
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const progress = useProgress(1000);
  const theme = useTheme();
  const { triggerHaptic } = useHaptic();
  const { togglePlayPause, skipNext, stop } = usePlayer();
  const segments = useSegments();

  const isPlaying = playbackState.state === State.Playing;
  const progressRatio =
    progress.duration > 0 ? progress.position / progress.duration : 0;

  // Slide-up animation on first appearance
  const slideAnim = useRef(new Animated.Value(60)).current;
  const hasAnimated = useRef(false);

  // Keep a snapshot of the last active track so we can still render during slide-out
  const lastTrackRef = useRef(activeTrack);
  const [visible, setVisible] = useState(false);
  const dismissingRef = useRef(false);

  useEffect(() => {
    if (activeTrack) {
      lastTrackRef.current = activeTrack;
      dismissingRef.current = false;
      setVisible(true);
      if (!hasAnimated.current) {
        hasAnimated.current = true;
        slideAnim.setValue(60);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 14,
        }).start();
      }
    } else if (visible && !dismissingRef.current) {
      // Track went away — slide down then hide
      dismissingRef.current = true;
      hasAnimated.current = false;
      Animated.timing(slideAnim, {
        toValue: 80,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        dismissingRef.current = false;
      });
    }
  }, [!!activeTrack]);

  const displayTrack = activeTrack ?? lastTrackRef.current;

  if (!visible || !displayTrack || segments.includes("nowplaying" as never)) return null;

  const props: MiniPlayerViewProps = {
    activeTrack: displayTrack,
    isPlaying,
    progressRatio,
    slideAnim,
    theme,
    onNavigate: () => router.push("/nowplaying"),
    onStop: () => stop(),
    onTogglePlay: () => {
      triggerHaptic();
      togglePlayPause();
    },
    onSkipNext: () => {
      triggerHaptic();
      skipNext();
    },
    hasArtwork: !!displayTrack.artwork,
  };

  return theme.variant === "light"
    ? <MiniPlayerLight {...props} />
    : <MiniPlayerFull {...props} />;
}
