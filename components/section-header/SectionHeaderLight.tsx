import React from "react";
import { View, StyleSheet } from "react-native";
import { StyledText } from "@/components/StyledText";
import { SectionHeaderViewProps } from "@/components/section-header/types";

export function SectionHeaderLight({ title, paddingHorizontal, theme }: SectionHeaderViewProps) {
  const { fgMuted, sectionBg, border } = theme;
  return (
    <View style={[styles.wrap, { backgroundColor: sectionBg, borderBottomColor: border, paddingHorizontal }]}>
      <StyledText style={[styles.text, { color: fgMuted }]}>{title}</StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
