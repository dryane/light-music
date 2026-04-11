import React, { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ContentContainerFull } from "@/components/content-container/ContentContainerFull";
import { ContentContainerLight } from "@/components/content-container/ContentContainerLight";

interface ContentContainerProps {
    headerTitle?: string;
    children?: ReactNode;
    hideBackButton?: boolean;
    rightIcon?: keyof typeof MaterialIcons.glyphMap;
    showRightIcon?: boolean;
    onRightIconPress?: () => void;
    style?: StyleProp<ViewStyle>;
}

export default function ContentContainer({
    headerTitle,
    children,
    hideBackButton = false,
    rightIcon,
    showRightIcon = true,
    onRightIconPress,
    style,
}: ContentContainerProps) {
    const theme = useTheme();

    const props = {
        headerTitle,
        children,
        hideBackButton,
        rightIcon,
        showRightIcon,
        onRightIconPress,
        style,
        theme,
    };

    return theme.variant === "light"
        ? <ContentContainerLight {...props} />
        : <ContentContainerFull {...props} />;
}
