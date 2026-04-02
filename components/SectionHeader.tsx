import React from "react";
import { View, StyleSheet } from "react-native";
import { StyledText } from "@/components/StyledText";
import { useTheme } from "@/hooks/useTheme";

interface SectionHeaderProps {
  title: string;
  paddingHorizontal?: number;
}

export function SectionHeader({ title, paddingHorizontal = 18 }: SectionHeaderProps) {
  const { fgMuted, sectionBg, border } = useTheme();
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
