import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { useTheme } from "@/hooks/useTheme";
import { useHaptic } from "@/contexts/HapticContext";
import { n } from "@/utils/scaling";

interface SearchInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    onSubmit?: () => void;
    autoFocus?: boolean;
}

export function SearchInput({
    value,
    onChangeText,
    placeholder,
    onSubmit,
    autoFocus = false,
}: SearchInputProps) {
    const { fg } = useTheme();
    const { triggerHaptic } = useHaptic();

    const handleClear = () => {
        triggerHaptic();
        onChangeText("");
    };

    return (
        <View style={[styles.container, { borderBottomColor: fg }]}>
            <TextInput
                style={[styles.input, { color: fg }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={fg}
                cursorColor={fg}
                selectionColor={fg}
                allowFontScaling={false}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={onSubmit}
                autoFocus={autoFocus}
            />
            {value.length > 0 && (
                <HapticPressable onPress={handleClear} style={styles.clearButton}>
                    <MaterialIcons name="close" size={n(24)} color={fg} />
                </HapticPressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        borderBottomWidth: n(1),
    },
    input: {
        flex: 1,
        fontSize: n(24),
        fontFamily: "PublicSans-Regular",
        paddingVertical: n(2),
        paddingBottom: n(6),
    },
    clearButton: {
        padding: n(5),
    },
});
