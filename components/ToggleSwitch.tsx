import React from "react";
import { View, StyleSheet } from "react-native";
import { StyledText } from "./StyledText";
import { HapticPressable } from "./HapticPressable";
import { useTheme } from "@/hooks/useTheme";
import { n } from "@/utils/scaling";

// ── Dimensions (computed once at module load) ──────────────────────────────
const CIRCLE_DIAMETER = n(9.8);
const CIRCLE_BORDER   = n(2.5);
const LINE_WIDTH      = n(14.5);
const LINE_HEIGHT     = n(2.22);

interface ToggleSwitchGraphicProps {
  value: boolean;
}

const ToggleSwitchGraphic = React.memo(({ value }: ToggleSwitchGraphicProps) => {
  const { fg } = useTheme();

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

// Static dimensions — only color is theme-driven, passed via style props above
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

interface ToggleSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ToggleSwitch({ label, value, onValueChange }: ToggleSwitchProps) {
  return (
    <HapticPressable onPress={() => onValueChange(!value)} style={styles.container}>
      <View style={styles.switchWrap}>
        <ToggleSwitchGraphic value={value} />
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
