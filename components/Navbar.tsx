import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { NavbarFull } from "@/components/navbar/NavbarFull";
import { NavbarLight } from "@/components/navbar/NavbarLight";

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
    const theme = useTheme();

    const props = { tabsConfig, currentScreenName, navigation, theme };

    return theme.variant === "light"
        ? <NavbarLight {...props} />
        : <NavbarFull {...props} />;
}
