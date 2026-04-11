import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
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
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { PlayPauseButton, SkipPrevButton, SkipNextButton } from "@/components/PlayerButtons";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@/hooks/useTheme";
import { setGlobalDismissing } from "@/hooks/useSwipeBack";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const ART_SIZE = SCREEN_W - 200;
const DISMISS_THRESHOLD = SCREEN_H * 0.28;
const DISMISS_VELOCITY = 0.6;
const ART_SWIPE_THRESHOLD = 80;

function fmt(secs: number) {
  const s = Math.floor(Math.max(0, secs));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function NowPlayingScreen() {
  const { togglePlayPause, skipNext, skipPrev } = usePlayer();
  const { fg, fgDim, bg, trackBg } = useTheme();
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
  const screenOpacity = screenY.interpolate({
    inputRange: [0, SCREEN_H * 0.5],
    outputRange: [1, 0.4],
    extrapolate: "clamp",
  });
  const screenScale = screenY.interpolate({
    inputRange: [0, DISMISS_THRESHOLD],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });
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
      {...screenPan.panHandlers}
    >
      <View style={styles.handleWrap}>
        <View style={[styles.handle, { backgroundColor: fgDim }]} />
      </View>

      <Animated.View
        style={[styles.artWrap, { transform: [{ translateX: artX }], opacity: artOpacity }]}
        {...artPan.panHandlers}
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
          onLayout={(e) => {
            barWidth.current = e.nativeEvent.layout.width;
            e.target.measure((_x, _y, _w, _h, pageX) => {
              barPageX.current = pageX;
            });
          }}
          {...seekPan.panHandlers}
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
        <SkipPrevButton onPress={skipPrev} color={fg} size={18} />
        <PlayPauseButton isPlaying={isPlaying} onPress={togglePlayPause} color={fg} size={100} />
        <SkipNextButton onPress={skipNext} color={fg} size={18} />
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
