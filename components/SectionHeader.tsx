import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { SectionHeaderFull } from "@/components/section-header/SectionHeaderFull";
import { SectionHeaderLight } from "@/components/section-header/SectionHeaderLight";

interface SectionHeaderProps {
  title: string;
  paddingHorizontal?: number;
}

export function SectionHeader({ title, paddingHorizontal = 18 }: SectionHeaderProps) {
  const theme = useTheme();

  const props = { title, paddingHorizontal, theme };

  return theme.variant === "light"
    ? <SectionHeaderLight {...props} />
    : <SectionHeaderFull {...props} />;
}
