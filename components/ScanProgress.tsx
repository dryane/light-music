import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { StyledText } from "@/components/StyledText";
import { useInvertColors } from "@/contexts/InvertColorsContext";

interface ScanProgressProps {
  progress: number; // 0–1
}

function WaveBar({ delay, color }: { delay: number; color: string }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          transform: [{ scaleY: anim }],
        },
      ]}
    />
  );
}

export function ScanProgress({ progress }: ScanProgressProps) {
  const { invertColors } = useInvertColors();
  const fg = invertColors ? "#000000" : "#ffffff";
  const fgMuted = invertColors ? "#888888" : "#484848";
  const trackBg = invertColors ? "#e0e0e0" : "#1e1e1e";

  const delays = [0, 80, 160, 240, 320, 240, 160, 80];

  return (
    <View style={styles.container}>
      {/* Animated waveform */}
      <View style={styles.waveform}>
        {delays.map((d, i) => (
          <WaveBar key={i} delay={d} color={fg} />
        ))}
      </View>

      <StyledText style={[styles.label, { color: fg }]}>Scanning Library</StyledText>
      <StyledText style={[styles.sub, { color: fgMuted }]}>
        {progress < 0.3
          ? "Reading your music files…"
          : progress < 0.7
          ? "Extracting metadata…"
          : "Fetching album artwork…"}
      </StyledText>

      {/* Progress bar */}
      <View style={[styles.track, { backgroundColor: trackBg }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: fg, width: `${Math.round(progress * 100)}%` },
          ]}
        />
      </View>
      <StyledText style={[styles.pct, { color: fgMuted }]}>
        {Math.round(progress * 100)}%
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 40,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    marginBottom: 4,
  },
  bar: {
    width: 3,
    height: 24,
    borderRadius: 2,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  track: {
    width: "100%",
    height: 1.5,
    borderRadius: 1,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 1,
  },
  pct: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
