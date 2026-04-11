import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { ToggleSwitchFull } from "@/components/toggle-switch/ToggleSwitchFull";
import { ToggleSwitchLight } from "@/components/toggle-switch/ToggleSwitchLight";

interface ToggleSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ToggleSwitch({ label, value, onValueChange }: ToggleSwitchProps) {
  const theme = useTheme();

  const props = { label, value, theme, onToggle: () => onValueChange(!value) };

  return theme.variant === "light"
    ? <ToggleSwitchLight {...props} />
    : <ToggleSwitchFull {...props} />;
}
