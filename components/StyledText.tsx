import React from "react";
import { Text as DefaultText, TextProps, StyleSheet } from "react-native";
import { useInvertColors } from "@/contexts/InvertColorsContext";

const FONT_SCALE = 1.375; // change this to adjust all text globally

interface StyledTextProps extends TextProps {
    children: React.ReactNode;
}

export function StyledText({ style, ...rest }: StyledTextProps) {
    const { invertColors } = useInvertColors();

    const scaleStyle = (s: any) => {
        if (!s || typeof s !== "object" || !s.fontSize) return s;
        return { ...s, fontSize: s.fontSize * FONT_SCALE };
    };

    const scaledStyle = Array.isArray(style)
        ? style.map(scaleStyle)
        : scaleStyle(style);

    return (
        <DefaultText
            allowFontScaling={false}
            style={[
                styles.text,
                { color: invertColors ? "black" : "white" },
                scaledStyle,
            ]}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    text: {
        fontFamily: "PublicSans-Regular",
    },
});