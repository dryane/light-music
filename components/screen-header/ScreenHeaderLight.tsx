import React from "react";
import { View, StyleSheet } from "react-native";
import { StyledText } from "@/components/StyledText";
import { PlayButton, ShuffleButton } from "@/components/PlayerButtons";
import { ScreenHeaderViewProps } from "@/components/screen-header/types";

export function ScreenHeaderLight({ title, meta, theme, onPlay, onShuffle }: ScreenHeaderViewProps) {
  const { fg, fgMuted, border } = theme;
  return (
    <View style={[styles.header, { borderBottomColor: border }]}>
      <View style={styles.left}>
        <StyledText style={[styles.title, { color: fg }]} numberOfLines={1}>
          {title}
        </StyledText>
        <StyledText style={[styles.meta, { color: fgMuted }]}>
          {meta}
        </StyledText>
      </View>
      <View style={styles.icons}>
        <PlayButton onPress={onPlay} color={fg} />
        <ShuffleButton onPress={onShuffle} color={fgMuted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  meta: { fontSize: 8 },
  icons: { flexDirection: "row", gap: 14, paddingBottom: 2 },
});
