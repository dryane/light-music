import React, { useEffect, useRef, useState } from "react";
import { Animated, View, StyleSheet } from "react-native";
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

/** Approximate height of the MiniPlayer for bottom padding calculations. */
export const MINI_PLAYER_HEIGHT = 55;

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
  const stoppingRef = useRef(false);

  useEffect(() => {
    if (activeTrack) {
      // Skip snapshot updates during stop — RNTP cycles through intermediate tracks
      // But if we stopped and a new track started without going null, clear the flag
      if (stoppingRef.current) {
        // Check if this is a genuinely new track (user started playback again)
        // vs an intermediate RNTP cycle during reset
        if (dismissingRef.current || !visible) {
          // Dismiss finished or in progress — this is a new playback session
          stoppingRef.current = false;
          dismissingRef.current = false;
          slideAnim.stopAnimation();
        } else {
          return;
        }
      }
      lastTrackRef.current = activeTrack;
      // Cancel any in-progress slide-down animation
      if (dismissingRef.current) {
        slideAnim.stopAnimation();
        dismissingRef.current = false;
      }
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
      } else {
        // Already animated in before — make sure it's at the visible position
        slideAnim.setValue(0);
      }
    } else if (visible && !dismissingRef.current) {
      // Track went away — slide down then hide
      stoppingRef.current = false;
      dismissingRef.current = true;
      hasAnimated.current = false;
      Animated.timing(slideAnim, {
        toValue: 80,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        // Only hide if the animation wasn't cancelled by a new track arriving
        if (finished) {
          setVisible(false);
          dismissingRef.current = false;
        }
      });
    }
  }, [activeTrack?.id]);

  const displayTrack = activeTrack ?? lastTrackRef.current;

  if (!visible || !displayTrack || segments.includes("nowplaying" as never)) return null;

  const props: MiniPlayerViewProps = {
    activeTrack: displayTrack,
    isPlaying,
    progressRatio,
    slideAnim,
    theme,
    onNavigate: () => router.push("/nowplaying"),
    onStop: () => {
      stoppingRef.current = true;
      // Begin dismiss immediately — don't wait for RNTP to cycle through tracks
      if (!dismissingRef.current) {
        dismissingRef.current = true;
        hasAnimated.current = false;
        Animated.timing(slideAnim, {
          toValue: 80,
          duration: 250,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            setVisible(false);
            dismissingRef.current = false;
          }
        });
      }
      stop();
    },
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

  const view = theme.variant === "light"
    ? <MiniPlayerLight {...props} />
    : <MiniPlayerFull {...props} />;

  return <View style={styles.overlay}>{view}</View>;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
