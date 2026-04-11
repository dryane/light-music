import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { SeparatorFull } from "@/components/separator/SeparatorFull";
import { SeparatorLight } from "@/components/separator/SeparatorLight";

export function Separator() {
    const theme = useTheme();

    return theme.variant === "light"
        ? <SeparatorLight theme={theme} />
        : <SeparatorFull theme={theme} />;
}
