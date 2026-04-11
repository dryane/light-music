import React from "react";
import { View, StyleSheet } from "react-native";
import { StyledText } from "@/components/StyledText";
import { ScanProgressViewProps } from "@/components/scan-progress/types";

export function ScanProgressFull({ progress, status, theme }: ScanProgressViewProps) {
  const { fg, fgMuted, trackBg } = theme;

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
  label: { fontSize: 17, fontWeight: "600", letterSpacing: -0.3 },
  sub: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  track: { width: "100%", height: 1.5, borderRadius: 1, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 1 },
  pct: { fontSize: 10, letterSpacing: 0.5 },
});
