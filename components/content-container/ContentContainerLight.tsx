import React from "react";
import { View, StyleSheet } from "react-native";
import { Header } from "@/components/Header";
import { ContentContainerViewProps } from "@/components/content-container/types";
import { n } from "@/utils/scaling";

export function ContentContainerLight({
    headerTitle,
    children,
    hideBackButton,
    rightIcon,
    showRightIcon,
    onRightIconPress,
    style,
    theme,
}: ContentContainerViewProps) {
    const { bg } = theme;

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            {headerTitle && (
                <Header
                    headerTitle={headerTitle}
                    hideBackButton={hideBackButton}
                    rightIcon={showRightIcon ? rightIcon : undefined}
                    onRightIconPress={onRightIconPress}
                />
            )}
            <View style={[styles.content, style]}>{children ?? null}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
    },
    content: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "flex-start",
        paddingHorizontal: n(37),
        paddingTop: n(14),
        gap: n(47),
    },
});
