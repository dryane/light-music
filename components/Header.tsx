import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { HeaderFull } from "@/components/header/HeaderFull";
import { HeaderLight } from "@/components/header/HeaderLight";

interface HeaderProps {
    headerTitle?: string;
    hideBackButton?: boolean;
    onBackPress?: () => void;
    leftIcon?: keyof typeof MaterialIcons.glyphMap;
    onLeftIconPress?: () => void;
    rightIcon?: keyof typeof MaterialIcons.glyphMap;
    onRightIconPress?: () => void;
}

export function Header({
    headerTitle,
    hideBackButton = false,
    onBackPress,
    leftIcon,
    onLeftIconPress,
    rightIcon,
    onRightIconPress,
}: HeaderProps) {
    const theme = useTheme();

    const handleBack = onBackPress ?? (() => {
        if (router.canGoBack()) router.back();
    });

    const props = {
        headerTitle,
        hideBackButton,
        theme,
        onBack: handleBack,
        leftIcon,
        onLeftIconPress,
        rightIcon,
        onRightIconPress,
    };

    return theme.variant === "light"
        ? <HeaderLight {...props} />
        : <HeaderFull {...props} />;
}
