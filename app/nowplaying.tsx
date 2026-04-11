import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";
import TrackPlayer, {
  useProgress,
  useActiveTrack,
  usePlaybackState,
  State,
} from "react-native-track-player";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@/hooks/useTheme";
import { setGlobalDismissing } from "@/hooks/useSwipeBack";
import { NowPlayingViewFull } from "@/views/NowPlayingViewFull";
import { NowPlayingViewLight } from "@/views/NowPlayingViewLight";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const DISMISS_THRESHOLD = SCREEN_H * 0.28;
const DISMISS_VELOCITY = 0.6;
const ART_SWIPE_THRESHOLD = 80;

export default function NowPlayingScreen() {
  const { togglePlayPause, skipNext, skipPrev } = usePlayer();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const progress = useProgress(500);
  const isPlaying = playbackState.state === State.Playing;
  const { position, duration } = progress;

  // ─── Seek bar ──────────────────────────────────────────────────────────────
  const seekAnim = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const wasPlaying = useRef(false);
  const durationRef = useRef(duration);
  const isPlayingRef = useRef(isPlaying);
  const barPageX = useRef(0);
  const barWidth = useRef(1);
  const [labelSecs, setLabelSecs] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    seekAnim.stopAnimation();
    seekAnim.setValue(0);
    setLabelSecs(0);
  }, [activeTrack?.id]);

  useEffect(() => {
    if (isDragging.current || duration <= 0) return;
    const ratio = Math.min(1, position / duration);
    Animated.timing(seekAnim, {
      toValue: ratio,
      duration: 480,
      useNativeDriver: false,
    }).start();
    setLabelSecs(position);
  }, [position, duration]);

  const fillWidth = seekAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });
  const thumbLeft = seekAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  const screenXToRatio = (screenX: number) => {
    const x = screenX - barPageX.current;
    return Math.min(1, Math.max(0, x / barWidth.current));
  };

  const seekPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (e) => {
        isDragging.current = true;
        wasPlaying.current = isPlayingRef.current;
        seekAnim.stopAnimation();
        TrackPlayer.pause();
        setDragging(true);
        const ratio = screenXToRatio(e.nativeEvent.pageX);
        seekAnim.setValue(ratio);
        setLabelSecs(ratio * durationRef.current);
      },

      onPanResponderMove: (e, g) => {
        const ratio = screenXToRatio(g.moveX);
        seekAnim.setValue(ratio);
        setLabelSecs(ratio * durationRef.current);
      },

      onPanResponderRelease: (e, g) => {
        const ratio = screenXToRatio(g.moveX);
        const targetSecs = ratio * durationRef.current;
        seekAnim.setValue(ratio);
        setLabelSecs(targetSecs);
        TrackPlayer.seekTo(targetSecs).then(() => {
          isDragging.current = false;
          setDragging(false);
          if (wasPlaying.current) TrackPlayer.play();
        });
      },

      onPanResponderTerminate: () => {
        isDragging.current = false;
        setDragging(false);
        if (wasPlaying.current) TrackPlayer.play();
      },
    })
  ).current;

  // ─── Keep skip callbacks up to date in PanResponder closures ──────────────
  const skipNextRef = useRef(skipNext);
  const skipPrevRef = useRef(skipPrev);
  useEffect(() => { skipNextRef.current = skipNext; }, [skipNext]);
  useEffect(() => { skipPrevRef.current = skipPrev; }, [skipPrev]);

  // ─── Album art swipe (left = next, right = prev) ───────────────────────────
  const artX = useRef(new Animated.Value(0)).current;
  const artOpacity = useRef(new Animated.Value(1)).current;

  const animateSkip = useCallback(
    (direction: "left" | "right", onComplete: () => void) => {
      const toValue = direction === "left" ? -SCREEN_W : SCREEN_W;
      Animated.parallel([
        Animated.timing(artX, { toValue, duration: 180, useNativeDriver: true }),
        Animated.timing(artOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        onComplete();
        artX.setValue(direction === "left" ? SCREEN_W : -SCREEN_W);
        artOpacity.setValue(0);
        Animated.parallel([
          Animated.spring(artX, { toValue: 0, useNativeDriver: true, tension: 100, friction: 12 }),
          Animated.timing(artOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      });
    },
    [artX, artOpacity]
  );

  const artPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => {
        artX.setValue(g.dx * 0.4);
        artOpacity.setValue(1 - Math.abs(g.dx) / (SCREEN_W * 0.8));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -ART_SWIPE_THRESHOLD) {
          animateSkip("left", () => skipNextRef.current());
        } else if (g.dx > ART_SWIPE_THRESHOLD) {
          animateSkip("right", () => skipPrevRef.current());
        } else {
          Animated.parallel([
            Animated.spring(artX, { toValue: 0, useNativeDriver: true }),
            Animated.timing(artOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  // ─── Screen dismiss swipe down ─────────────────────────────────────────────
  const screenY = useRef(new Animated.Value(0)).current;
  const dismissingRef = useRef(false);

  const screenPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !dismissingRef.current && g.dy > 2 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: (_, g) => {
        if (!dismissingRef.current && g.dy > 0) screenY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (dismissingRef.current) return;
        if (g.dy > DISMISS_THRESHOLD || g.vy > DISMISS_VELOCITY) {
          dismissingRef.current = true;
          setGlobalDismissing(true);
          router.back();
          setTimeout(() => setGlobalDismissing(false), 1000);
        } else {
          Animated.spring(screenY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 14,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (dismissingRef.current) return;
        Animated.spring(screenY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 14,
        }).start();
      },
    })
  ).current;

  const barLayoutHandler = (e: any) => {
    barWidth.current = e.nativeEvent.layout.width;
    e.target.measure((_x: number, _y: number, _w: number, _h: number, pageX: number) => {
      barPageX.current = pageX;
    });
  };

  const viewProps = {
    theme,
    insets,
    activeTrack,
    isPlaying,
    labelSecs,
    duration,
    dragging,
    fillWidth,
    thumbLeft,
    seekPanHandlers: seekPan.panHandlers,
    artPanHandlers: artPan.panHandlers,
    screenPanHandlers: screenPan.panHandlers,
    screenY: screenY,
    artX,
    artOpacity,
    barLayoutHandler,
    onTogglePlayPause: togglePlayPause,
    onSkipNext: skipNext,
    onSkipPrev: skipPrev,
  };

  return theme.variant === "light"
    ? <NowPlayingViewLight {...viewProps} />
    : <NowPlayingViewFull {...viewProps} />;
}
