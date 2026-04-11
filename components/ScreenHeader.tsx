import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { ScreenHeaderFull } from "@/components/screen-header/ScreenHeaderFull";
import { ScreenHeaderLight } from "@/components/screen-header/ScreenHeaderLight";

interface ScreenHeaderProps {
  title: string;
  meta: string;
  onPlay: () => void;
  onShuffle: () => void;
}

export function ScreenHeader({ title, meta, onPlay, onShuffle }: ScreenHeaderProps) {
  const theme = useTheme();

  const props = { title, meta, theme, onPlay, onShuffle };

  return theme.variant === "light"
    ? <ScreenHeaderLight {...props} />
    : <ScreenHeaderFull {...props} />;
}
