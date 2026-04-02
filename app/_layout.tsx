import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { View, StyleSheet, AppState } from "react-native";
import TrackPlayer from "react-native-track-player";
import { useActiveTrack, usePlaybackState, State } from "react-native-track-player";
import { router } from "expo-router";
import { InvertColorsProvider, useInvertColors } from "@/contexts/InvertColorsContext";
import { HapticProvider } from "@/contexts/HapticContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { MusicProvider } from "@/contexts/MusicContext";
import { MiniPlayer } from "@/components/MiniPlayer";

SplashScreen.preventAutoHideAsync();

// Register RNTP background service once at startup
let serviceRegistered = false;
if (!serviceRegistered) {
  serviceRegistered = true;
  TrackPlayer.registerPlaybackService(() => require("../service"));
}

function AppShell() {
  const { invertColors } = useInvertColors();
  const bg = invertColors ? "#ffffff" : "#000000";
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;
  const appState = useRef(AppState.currentState);

  // Open now playing when app comes back to foreground if playing
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        // App came to foreground
        TrackPlayer.getPlaybackState().then((state) => {
          if (state.state === State.Playing) {
            router.push("/nowplaying");
          }
        });
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

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
