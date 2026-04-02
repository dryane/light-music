import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { View, StyleSheet } from "react-native";
import { InvertColorsProvider, useInvertColors } from "@/contexts/InvertColorsContext";
import { HapticProvider } from "@/contexts/HapticContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { MusicProvider } from "@/contexts/MusicContext";
import { MiniPlayer } from "@/components/MiniPlayer";

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { invertColors } = useInvertColors();
  const bg = invertColors ? "#ffffff" : "#000000";

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="artist/[artistId]"
          options={{
            presentation: "transparentModal",
            animation: "slide_from_right",
            gestureEnabled: false,
            cardOverlayEnabled: false,
          }}
        />
        <Stack.Screen
          name="album/[albumId]"
          options={{
            presentation: "transparentModal",
            animation: "slide_from_right",
            gestureEnabled: false,
            cardOverlayEnabled: false,
          }}
        />
        <Stack.Screen
          name="nowplaying"
          options={{
            presentation: "transparentModal",
            animation: "slide_from_bottom",
            gestureEnabled: false,
          }}
        />
      </Stack>
      <MiniPlayer />
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({});

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  return (
    <InvertColorsProvider>
      <HapticProvider>
        <PlayerProvider>
          <MusicProvider>
            <StatusBar translucent style="auto" />
            {loaded && <AppShell />}
          </MusicProvider>
        </PlayerProvider>
      </HapticProvider>
    </InvertColorsProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
