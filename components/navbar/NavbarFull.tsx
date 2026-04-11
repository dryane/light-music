import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { HapticPressable } from "@/components/HapticPressable";
import { NavbarViewProps } from "@/components/navbar/types";
import { n } from "@/utils/scaling";

export function NavbarFull({ tabsConfig, currentScreenName, navigation, theme }: NavbarViewProps) {
    const { fg, fgMuted, bg } = theme;

    return (
        <View style={[styles.navbar, { backgroundColor: bg }]}>
            {tabsConfig?.map((tab) => (
                <HapticPressable
                    key={tab.screenName}
                    onPress={() => navigation.navigate(tab.screenName)}
                >
                    <MaterialIcons
                        name={tab.iconName}
                        size={n(48)}
                        color={tab.screenName === currentScreenName ? fg : fgMuted}
                    />
                </HapticPressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    navbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: n(11),
        paddingHorizontal: n(20),
    },
});
