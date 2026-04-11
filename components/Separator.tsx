import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { n } from "@/utils/scaling";

export function Separator() {
    const { invertColors } = useTheme();
    const color = invertColors ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)";

    return <View style={[styles.separator, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
    separator: {
        height: n(1),
        width: "100%",
    },
});
