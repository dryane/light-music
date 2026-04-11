import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { StyledText } from "@/components/StyledText";
import { HapticPressable } from "@/components/HapticPressable";
import { HeaderViewProps } from "@/components/header/types";
import { n } from "@/utils/scaling";

export function HeaderLight({
  headerTitle,
  hideBackButton,
  theme,
  onBack,
  leftIcon,
  onLeftIconPress,
  rightIcon,
  onRightIconPress,
}: HeaderViewProps) {
  const { fg, bg } = theme;

  const renderLeftButton = () => {
    if (!hideBackButton) {
      return (
        <HapticPressable onPress={onBack}>
          <View style={styles.button}>
            <MaterialIcons name="arrow-back-ios" size={n(28)} color={fg} />
          </View>
        </HapticPressable>
      );
    }
    if (leftIcon) {
      return (
        <HapticPressable onPress={onLeftIconPress}>
          <View style={styles.button}>
            <MaterialIcons name={leftIcon} size={n(28)} color={fg} />
          </View>
        </HapticPressable>
      );
    }
    return <View style={styles.button} />;
  };

  const renderRightButton = () => {
    if (rightIcon) {
      return (
        <HapticPressable onPress={onRightIconPress}>
          <View style={styles.button}>
            <MaterialIcons name={rightIcon} size={n(28)} color={fg} />
          </View>
        </HapticPressable>
      );
    }
    return <View style={styles.button} />;
  };

  return (
    <View style={[styles.header, { backgroundColor: bg }]}>
      {renderLeftButton()}
      <StyledText style={styles.title} numberOfLines={1}>
        {headerTitle}
      </StyledText>
      {renderRightButton()}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: n(22),
    paddingVertical: n(5),
    zIndex: 1,
  },
  title: {
    fontSize: n(20),
    fontFamily: "PublicSans-Regular",
    paddingTop: n(2),
    maxWidth: "75%",
  },
  button: {
    width: n(32),
    height: n(32),
    alignItems: "center",
    paddingTop: n(6),
    paddingRight: n(4),
  },
});
