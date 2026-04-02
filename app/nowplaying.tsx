import React, { useRef, useEffect, useCallback } from "react";
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
import { FontAwesome5 } from "@expo/vector-icons";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { PlayPauseButton, SkipPrevButton, SkipNextButton } from "@/components/PlayerButtons";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { usePlayer } from "@/contexts/PlayerContext";

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
  const { invertColors } = useInvertColors();
  const insets = useSafeAreaInsets();

  // ─── RNTP hooks — single source of truth ─────────────────────────────────
  // useProgress updates on a native timer — smooth with zero JS state needed
  const progress = useProgress(100); // 100ms update interval for smooth seek display
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;

  const { position, duration } = progress;

  const fg = invertColors ? "#000000" : "#ffffff";
  const fgMuted = invertColors ? "#888888" : "#484848";
  const bg = invertColors ? "#ffffff" : "#000000";
  const trackBg = invertColors ? "#e0e0e0" : "#1e1e1e";

  // ─── Seek bar — Animated.Value driven, zero setState during drag ──────────
  const seekProgress = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(1);
  const isDragging = useRef(false);
  const wasPlaying = useRef(false);

  // Refs so PanResponder callbacks always have fresh values
  const durationRef = useRef(duration);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Drive seekProgress from RNTP when not dragging
  useEffect(() => {
    if (!isDragging.current && duration > 0) {
      seekProgress.setValue(position / duration);
    }
  }, [position, duration]);

  // Interpolated fill and thumb position — runs on native thread
  const fillWidth = seekProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });
  const thumbLeft = seekProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  // Time label state — only updates while dragging (30fps throttle)
  const displayTime = useRef(position);
  const lastLabelUpdate = useRef(0);
  const [labelPosition, setLabelPosition] = React.useState(0);

  // Sync label with player when not dragging
  useEffect(() => {
    if (!isDragging.current) setLabelPosition(position);
  }, [position]);

  const seekPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (e) => {
        isDragging.current = true;
        wasPlaying.current = isPlayingRef.current;
        if (isPlayingRef.current) TrackPlayer.pause();

        const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / barWidth.current));
        seekProgress.setValue(ratio);
        const ms = ratio * durationRef.current;
        displayTime.current = ms;
        setLabelPosition(ms);
      },

      onPanResponderMove: (e) => {
        const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / barWidth.current));
        // Update native animated value — no re-render
        seekProgress.setValue(ratio);

        // Throttle label to ~30fps
        const now = Date.now();
        if (now - lastLabelUpdate.current > 33) {
          lastLabelUpdate.current = now;
          const secs = ratio * durationRef.current;
          displayTime.current = secs;
          setLabelPosition(secs);
        }
      },

      onPanResponderRelease: (e) => {
        const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / barWidth.current));
        const targetSecs = ratio * durationRef.current;

        seekProgress.setValue(ratio);
        setLabelPosition(targetSecs);
        isDragging.current = false;

        TrackPlayer.seekTo(targetSecs).then(() => {
          if (wasPlaying.current) TrackPlayer.play();
        });
      },

      onPanResponderTerminate: () => {
        isDragging.current = false;
        if (wasPlaying.current) TrackPlayer.play();
      },
    })
  ).current;

  // ─── Art swipe left/right to skip ────────────────────────────────────────
  const artX = useRef(new Animated.Value(0)).current;
  const artOpacity = useRef(new Animated.Value(1)).current;
  const skipNextRef = useRef(skipNext);
  const skipPrevRef = useRef(skipPrev);
  useEffect(() => { skipNextRef.current = skipNext; }, [skipNext]);
  useEffect(() => { skipPrevRef.current = skipPrev; }, [skipPrev]);

  const animateSkip = useCallback((direction: "left" | "right", onComplete: () => void) => {
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
  }, [artX, artOpacity]);

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

  // ─── Screen swipe down to dismiss ────────────────────────────────────────
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

  const screenPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 2 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) screenY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > DISMISS_VELOCITY) {
          Animated.timing(screenY, {
            toValue: SCREEN_H,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            router.back();
            screenY.setValue(0);
          });
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
          <StyledText style={{ color: fgMuted }}>Nothing is playing.</StyledText>
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
          transform: [{ translateY: screenY }, { scale: screenScale }],
          opacity: screenOpacity,
        },
      ]}
      {...screenPan.panHandlers}
    >
      {/* Drag handle */}
      <View style={styles.handleWrap}>
        <View style={[styles.handle, { backgroundColor: fgMuted }]} />
      </View>

      {/* Album art — swipe left/right to skip */}
      <Animated.View
        style={[styles.artWrap, { transform: [{ translateX: artX }], opacity: artOpacity }]}
        {...artPan.panHandlers}
      >
        <AlbumArt uri={activeTrack.artwork ?? null} size={ART_SIZE} radius={8} />
      </Animated.View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <StyledText style={[styles.trackTitle, { color: fg }]} numberOfLines={2}>
          {activeTrack.title}
        </StyledText>
        <StyledText style={[styles.trackSub, { color: fgMuted }]} numberOfLines={1}>
          {activeTrack.artist}
          {activeTrack.album && activeTrack.album !== "Unknown Album"
            ? ` · ${activeTrack.album}`
            : ""}
        </StyledText>
      </View>

      {/* Seek bar */}
      <View style={styles.progressSection}>
        <View
          style={styles.seekHitArea}
          onLayout={(e) => { barWidth.current = e.nativeEvent.layout.width; }}
          {...seekPan.panHandlers}
        >
          <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
            <Animated.View
              style={[styles.progressFill, { backgroundColor: fg, width: fillWidth }]}
            />
          </View>
          <Animated.View
            style={[styles.thumb, { backgroundColor: fg, left: thumbLeft }]}
          />
        </View>

        <View style={styles.timeRow}>
          <StyledText style={[styles.time, { color: fgMuted }]}>
            {fmt(labelPosition)}
          </StyledText>
          <StyledText style={[styles.time, { color: fgMuted }]}>
            {fmt(duration)}
          </StyledText>
        </View>
      </View>

      {/* Controls */}
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
  trackInfo: { gap: 4 },
  trackTitle: { fontSize: 14, fontWeight: "700", lineHeight: 24, marginBottom: -6 },
  trackSub: { fontSize: 10 },
  progressSection: { gap: 8, marginBottom: -30 },
  seekHitArea: {
    height: 36,
    justifyContent: "center",
    position: "relative",
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 10,
    marginLeft: -8,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -5,
  },
  time: { fontSize: 10 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    marginTop: -10,
  },
});
