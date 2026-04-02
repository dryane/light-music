import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

interface ButtonProps {
  onPress: () => void;
  color: string;
  size?: number;
}

export function PlayButton({ onPress, color, size = 16 }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={12}>
      <FontAwesome5 name="play" size={size} color={color} solid />
    </TouchableOpacity>
  );
}

export function ShuffleButton({ onPress, color, size = 16 }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={12}>
      <FontAwesome5 name="random" size={size} color={color} solid />
    </TouchableOpacity>
  );
}

export function SkipPrevButton({ onPress, color, size = 24 }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={12}>
      <FontAwesome5 name="step-backward" size={size} color={color} solid />
    </TouchableOpacity>
  );
}

export function SkipNextButton({ onPress, color, size = 24 }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={12}>
      <FontAwesome5 name="step-forward" size={size} color={color} solid />
    </TouchableOpacity>
  );
}

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onPress: () => void;
  color: string;
  size?: number;
}

export function PlayPauseButton({ isPlaying, onPress, color, size = 60 }: PlayPauseButtonProps) {
  const iconSize = size * 0.38;
  return (
    <TouchableOpacity
      style={[
        styles.playBtn,
        {
          borderColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      onPress={onPress}
    >
      <FontAwesome5
        name={isPlaying ? "pause" : "play"}
        size={iconSize}
        color={color}
        solid
        style={isPlaying ? undefined : styles.playOffset}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  playBtn: {
    borderWidth:0,
    alignItems: "center",
    justifyContent: "center",
  },
  // Play icon is naturally left-biased, nudge it right slightly
  playOffset: {
    marginLeft: 3,
  },
});
