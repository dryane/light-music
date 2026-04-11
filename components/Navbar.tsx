import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { HapticPressable } from "./HapticPressable";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "@/hooks/useTheme";
import { n } from "@/utils/scaling";

export interface TabConfigItem {
    name: string;
    screenName: string;
    iconName: keyof typeof MaterialIcons.glyphMap;
}

interface NavbarProps {
    tabsConfig?: ReadonlyArray<TabConfigItem>;
    currentScreenName: string;
    navigation: BottomTabBarProps["navigation"];
}

export function Navbar({ tabsConfig, currentScreenName, navigation }: NavbarProps) {
    const { fg, fgMuted, bg } = useTheme();

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
