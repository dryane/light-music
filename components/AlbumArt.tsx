import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { useInvertColors } from "@/contexts/InvertColorsContext";

interface AlbumArtProps {
  uri: string | null;
  size: number;
  radius?: number;
}

export function AlbumArt({ uri, size, radius = 0 }: AlbumArtProps) {
  const { invertColors } = useInvertColors();
  const placeholderBg = invertColors ? "#e8e8e8" : "#141414";

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: placeholderBg }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: radius, backgroundColor: placeholderBg },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {},
});
