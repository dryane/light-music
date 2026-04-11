import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { useHaptic } from "@/contexts/HapticContext";
import { SearchInputFull } from "@/components/search-input/SearchInputFull";
import { SearchInputLight } from "@/components/search-input/SearchInputLight";

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
    const theme = useTheme();
    const { triggerHaptic } = useHaptic();

    const handleClear = () => {
        triggerHaptic();
        onChangeText("");
    };

    const props = { value, onChangeText, placeholder, onSubmit, autoFocus, theme, onClear: handleClear };

    return theme.variant === "light"
        ? <SearchInputLight {...props} />
        : <SearchInputFull {...props} />;
}
