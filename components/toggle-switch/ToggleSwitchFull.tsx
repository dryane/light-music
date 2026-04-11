import React from "react";
import { View, StyleSheet } from "react-native";
import { StyledText } from "@/components/StyledText";
import { HapticPressable } from "@/components/HapticPressable";
import { ToggleSwitchViewProps } from "@/components/toggle-switch/types";
import { n } from "@/utils/scaling";

// ── Dimensions (computed once at module load) ──────────────────────────────
const CIRCLE_DIAMETER = n(9.8);
const CIRCLE_BORDER   = n(2.5);
const LINE_WIDTH      = n(14.5);
const LINE_HEIGHT     = n(2.22);

const ToggleSwitchGraphic = React.memo(({ value, fg }: { value: boolean; fg: string }) => {
  return (
    <View style={graphicStyles.container}>
      {!value ? (
        <>
          <View style={[graphicStyles.hollowCircle, { borderColor: fg }]} />
          <View style={[graphicStyles.line, { backgroundColor: fg }]} />
        </>
      ) : (
        <>
          <View style={[graphicStyles.line, { backgroundColor: fg }]} />
          <View style={[graphicStyles.circle, { backgroundColor: fg }]} />
        </>
      )}
    </View>
  );
});

const graphicStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  circle: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    borderRadius: CIRCLE_DIAMETER / 2,
  },
  hollowCircle: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    borderRadius: CIRCLE_DIAMETER / 2,
    borderWidth: CIRCLE_BORDER,
  },
  line: {
    width: LINE_WIDTH,
    height: LINE_HEIGHT,
  },
});

export function ToggleSwitchFull({ label, value, theme, onToggle }: ToggleSwitchViewProps) {
  const { fg } = theme;

  return (
    <HapticPressable onPress={onToggle} style={styles.container}>
      <View style={styles.switchWrap}>
        <ToggleSwitchGraphic value={value} fg={fg} />
      </View>
      <View style={styles.labelWrap}>
        <StyledText style={styles.label}>{label}</StyledText>
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: n(9),
  },
  switchWrap: {
    marginTop: n(13),
    marginRight: n(20),
    marginLeft: n(8.5),
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize: n(30),
  },
});
