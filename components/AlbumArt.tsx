import React from "react";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface AlbumArtProps {
  uri: string | null;
  size: number;
  radius?: number;
  /** When true, renders a loading indicator over the placeholder. */
  loading?: boolean;
}

export function AlbumArt({ uri, size, radius = 0, loading = false }: AlbumArtProps) {
  const { placeholderBg, fgMuted } = useTheme();

  if (uri) {
    return (
      <View style={{ width: size, height: size }}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius, backgroundColor: placeholderBg }}
          resizeMode="cover"
        />
        {loading && (
          <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
            <ActivityIndicator size="small" color={fgMuted} />
          </View>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: size, height: size, borderRadius: radius, backgroundColor: placeholderBg },
        ]}
      >
        <ActivityIndicator size="small" color={fgMuted} />
      </View>
    );
  }

  // No art and not loading — collapse to zero width (existing behaviour)
  return (
    <View style={{ height: size, width: 0, marginRight: -12 }} />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 4,
  },
});
