import React from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTheme } from "@/hooks/useTheme";
import { useHaptic } from "@/contexts/HapticContext";
import { Track } from "@/types/music";
import { TrackRowFull } from "@/components/track-row/TrackRowFull";
import { TrackRowLight } from "@/components/track-row/TrackRowLight";

interface TrackRowProps {
  track: Track;
  queue: Track[];
  trackNumber?: number | null;
}

export function TrackRow({ track, queue, trackNumber }: TrackRowProps) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { triggerHaptic } = useHaptic();
  const theme = useTheme();
  const isActive = currentTrack?.id === track.id;

  const props = {
    track,
    trackNumber,
    isActive,
    isPlaying,
    theme,
    onPress: () => { triggerHaptic(); playTrack(track, queue); },
  };

  return theme.variant === "light"
    ? <TrackRowLight {...props} />
    : <TrackRowFull {...props} />;
}
