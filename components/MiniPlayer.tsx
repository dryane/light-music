import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Pressable, Animated } from "react-native";
import { router, useSegments } from "expo-router";
import { useActiveTrack, usePlaybackState, useProgress, State } from "react-native-track-player";
import TrackPlayer from "react-native-track-player";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StyledText } from "@/components/StyledText";
import { AlbumArt } from "@/components/AlbumArt";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { useMusic } from "@/contexts/MusicContext";

export function MiniPlayer() {
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const progress = useProgress(1000);
  const { artists } = useMusic();
  const { invertColors } = useInvertColors();
  const segments = useSegments();

  const isPlaying = playbackState.state === State.Playing;
  const progressRatio = progress.duration > 0 ? progress.position / progress.duration : 0;

  // Slide-up animation on first appear
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

  const fg = invertColors ? "#000000" : "#ffffff";
  const fgMuted = invertColors ? "#888888" : "#484848";
  const bg = invertColors ? "#ffffff" : "#000000";
  const border = invertColors ? "#e0e0e0" : "#1a1a1a";
  const progressColor = invertColors ? "#000000" : "#ffffff";
  const progressBg = invertColors ? "#e0e0e0" : "#2a2a2a";

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      {/* Thin progress bar along top edge */}
      <View style={[styles.progressBar, { backgroundColor: progressBg }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: progressColor, width: `${progressRatio * 100}%` },
          ]}
        />
      </View>

      <View style={[styles.container, { backgroundColor: bg, borderTopColor: border }]}>
        <TouchableOpacity
          onPress={() => router.push("/nowplaying")}
          activeOpacity={1}
            style={!activeTrack.artwork ? { marginRight: -11 } : undefined}
        >
          <AlbumArt uri={activeTrack.artwork ?? null} size={34} radius={4} />
        </TouchableOpacity>

        <Pressable
          style={styles.info}
          onPress={() => router.push("/nowplaying")}
        >
          <StyledText style={[styles.title, { color: fg }]} numberOfLines={1}>
            {activeTrack.title}
          </StyledText>
          <StyledText style={[styles.artist, { color: fgMuted }]} numberOfLines={1}>
            {activeTrack.artist}
          </StyledText>
        </Pressable>

        <TouchableOpacity
          onPress={async () => {
            await TrackPlayer.reset();
          }}
          hitSlop={12}
          style={styles.btn}
        >
          <FontAwesome5 name="stop" size={16} color={fgMuted} solid />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            isPlaying ? TrackPlayer.pause() : TrackPlayer.play();
          }}
          hitSlop={12}
          style={styles.btn}
        >
          <FontAwesome5
            name={isPlaying ? "pause" : "play"}
            size={18}
            color={fg}
            solid
            style={isPlaying ? undefined : { marginLeft: 2 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            TrackPlayer.skipToNext();
          }}
          hitSlop={12}
          style={styles.btn}
        >
          <FontAwesome5 name="step-forward" size={18} color={fg} solid />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    height: 1.5,
    width: "100%",
  },
  progressFill: {
    height: "100%",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 14,
    paddingLeft:18,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 11,
  },
  info: { flex: 1, gap: 1 },
  title: { fontSize: 10, marginBottom: -3, fontWeight: "500" },
  artist: { fontSize: 8 },
  btn: { padding: 4 },
});
