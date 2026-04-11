import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Theme } from "@/hooks/useTheme";

export interface ContentContainerViewProps {
    headerTitle?: string;
    children?: ReactNode;
    hideBackButton: boolean;
    rightIcon?: keyof typeof MaterialIcons.glyphMap;
    showRightIcon: boolean;
    onRightIconPress?: () => void;
    style?: StyleProp<ViewStyle>;
    theme: Theme;
}
