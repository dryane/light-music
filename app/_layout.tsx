import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { View, StyleSheet, AppState } from "react-native";
import TrackPlayer, { State } from "react-native-track-player";
import { usePlaybackState } from "react-native-track-player";
import { InvertColorsProvider } from "@/contexts/InvertColorsContext";
import { HapticProvider } from "@/contexts/HapticContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { MusicProvider } from "@/contexts/MusicContext";
import { ThemeVariantProvider } from "@/contexts/ThemeVariantContext";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useTheme } from "@/hooks/useTheme";
import { pushNowPlayingInstant } from "@/hooks/useNowPlayingNav"; // Bug fix: was missing

SplashScreen.preventAutoHideAsync();

// Register RNTP background service exactly once at startup.
let serviceRegistered = false;
if (!serviceRegistered) {
  serviceRegistered = true;
  TrackPlayer.registerPlaybackService(() => require("../service"));
}

function AppShell() {
  const { bg } = useTheme();
  const playbackState = usePlaybackState();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);

  // When the app returns to foreground while a track is playing,
  // immediately navigate to the now-playing screen (skip slide animation).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        TrackPlayer.getPlaybackState()
          .then((state) => {
            if (
              state.state === State.Playing &&
              !segments.includes("nowplaying" as never)
            ) {
              pushNowPlayingInstant();
            }
          })
          .catch(() => {
            // Player not yet initialised — ignore
          });
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [segments]);

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
  const [loaded] = useFonts({
      "PublicSans": require("../assets/fonts/PublicSans-Regular.ttf"),
      "ComicSans": require("../assets/fonts/Comic-Sans.ttf")
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  return (
    <ThemeVariantProvider>
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
    </ThemeVariantProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
