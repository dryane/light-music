import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { StyledText } from "@/components/StyledText";
import { useTheme } from "@/hooks/useTheme";

interface ScanProgressProps {
  progress: number;
  status?: string;
}

const BAR_COUNT = 8;
const DELAYS = [0, 100, 200, 300, 400, 300, 200, 100];

// Static bar component — never re-renders after mount
const Bar = React.memo(({ anim, color }: { anim: Animated.Value; color: string }) => {
  const scaleY = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  return (
    <Animated.View
      style={[styles.bar, { backgroundColor: color, transform: [{ scaleY }] }]}
    />
  );
});

export function ScanProgress({ progress, status }: ScanProgressProps) {
  const { fg, fgMuted, trackBg } = useTheme();

  // Per-instance animation values — no module-level shared state
  const anims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  ).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      anims.forEach((anim, i) => {
        const phase = ((elapsed - DELAYS[i]) / 800) * Math.PI * 2;
        const value = 0.3 + ((Math.sin(phase) + 1) / 2) * 0.7;
        anim.setValue(value);
      });
    }, 16); // ~60 fps

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      anims.forEach((anim) => anim.stopAnimation());
    };
  }, []);

  return (
    <View style={styles.container}>
      <StyledText style={[styles.label, { color: fg }]}>Scanning Library</StyledText>
      <StyledText style={[styles.sub, { color: fgMuted }]} numberOfLines={1}>
        {status || "Reading your music files…"}
      </StyledText>
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
  bar: { width: 3, height: 24, borderRadius: 2 },
  label: { fontSize: 17, fontWeight: "600", letterSpacing: -0.3 },
  sub: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  track: { width: "100%", height: 1.5, borderRadius: 1, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 1 },
  pct: { fontSize: 10, letterSpacing: 0.5 },
});
