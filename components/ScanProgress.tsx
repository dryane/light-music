import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { StyledText } from "@/components/StyledText";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { Easing } from "react-native";

interface ScanProgressProps {
  progress: number;
  status?: string;
}

const BAR_COUNT = 8;
const DELAYS = [0, 100, 200, 300, 400, 300, 200, 100];
const anims = Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3));

let intervalId: any = null;
let startTime: number | null = null;

function startAnims() {
  if (intervalId) return;
  startTime = Date.now();
  intervalId = setInterval(() => {
    const elapsed = Date.now() - startTime!;
    anims.forEach((anim, i) => {
      // Each bar is offset by its delay, creating a pure sine wave
      const phase = ((elapsed - DELAYS[i]) / 800) * Math.PI * 2;
      const value = 0.3 + ((Math.sin(phase) + 1) / 2) * 0.7;
      anim.setValue(value);
    });
  }, 16); // ~60fps
}

function stopAnims() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  anims.forEach(anim => anim.setValue(0.3));
}

// Static bar components — never re-render
const Bar = React.memo(({ anim, color }: { anim: Animated.Value; color: string }) => {
  const scaleY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: color, transform: [{ scaleY }] },
      ]}
    />
  );
});

const Waveform = React.memo(({ color }: { color: string }) => (
  <View style={styles.waveform}>
    {anims.map((anim, i) => (
      <Bar key={i} anim={anim} color={color} />
    ))}
  </View>
));

export function ScanProgress({ progress, status }: ScanProgressProps) {
  const { invertColors } = useInvertColors();
  const fg = invertColors ? "#000000" : "#ffffff";
  const fgMuted = invertColors ? "#888888" : "#484848";
  const trackBg = invertColors ? "#e0e0e0" : "#1e1e1e";

    useEffect(() => {
      startAnims();
      return () => {
        anims.forEach(anim => anim.stopAnimation());
      };
    }, []);

//     <View style={styles.container}>
//       <Waveform color={fg} />
// Temp removed Waveform

  return (
    <View style={styles.container}>
      <StyledText style={[styles.label, { color: fg }]}>Scanning Library</StyledText>
      <StyledText style={[styles.sub, { color: fgMuted }]} numberOfLines={1}>
        {status || "Reading your music files…"}
      </StyledText>
      <View style={[styles.track, { backgroundColor: trackBg }]}>
        <View
          style={[styles.fill, { backgroundColor: fg, width: `${Math.round(progress * 100)}%` }]}
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