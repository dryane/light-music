import { useSegments } from "expo-router";
import { withLayoutContext } from "expo-router";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import type { StackNavigationOptions, StackNavigationEventMap } from "@react-navigation/stack";
import type { ParamListBase, StackNavigationState } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { View, StyleSheet, AppState, Dimensions } from "react-native";
import TrackPlayer, { State } from "react-native-track-player";
import { usePlaybackState } from "react-native-track-player";
import { InvertColorsProvider } from "@/contexts/InvertColorsContext";
import { HapticProvider } from "@/contexts/HapticContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { MusicProvider } from "@/contexts/MusicContext";
import { ThemeVariantProvider } from "@/contexts/ThemeVariantContext";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useTheme } from "@/hooks/useTheme";
import { pushNowPlayingInstant, getSkipAnimation, clearSkipAnimation } from "@/hooks/useNowPlayingNav";

SplashScreen.preventAutoHideAsync();

// Register RNTP background service exactly once at startup.
let serviceRegistered = false;
if (!serviceRegistered) {
  serviceRegistered = true;
  TrackPlayer.registerPlaybackService(() => require("../service"));
}

// JS-based stack navigator — supports gestures on transparentModal screens
const { Navigator } = createStackNavigator();
const JsStack = withLayoutContext<
  StackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  StackNavigationEventMap
>(Navigator);

const SCREEN_W = Dimensions.get("window").width;

function AppShell() {
  const { bg, animate } = useTheme();
  const playbackState = usePlaybackState();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);

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
          .catch(() => {});
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [segments]);

  const slideOptions = {
    gestureEnabled: true,
    gestureDirection: "horizontal" as const,
    gestureResponseDistance: SCREEN_W * 0.3,
    cardOverlayEnabled: false,
    animationEnabled: animate,
    cardStyleInterpolator: animate
      ? ({ current, next, layouts }: any) => ({
          cardStyle: {
            transform: [
              {
                translateX: next
                  ? next.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -layouts.screen.width * 0.1],
                    })
                  : current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
              },
            ],
          },
        })
      : () => ({ cardStyle: {} }),
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <JsStack
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
          cardStyle: { backgroundColor: "transparent" },
          detachPreviousScreen: false,
        }}
      >
        <JsStack.Screen name="(tabs)" />
        <JsStack.Screen name="artist/[artistId]" options={slideOptions} />
        <JsStack.Screen name="album/[albumId]" options={slideOptions} />
        <JsStack.Screen
          name="nowplaying"
          options={() => {
            const skip = getSkipAnimation();
            clearSkipAnimation();
            return {
              gestureEnabled: true,
              gestureDirection: "vertical",
              cardOverlayEnabled: false,
              ...(!animate || skip
                ? { animationEnabled: false, cardStyleInterpolator: () => ({ cardStyle: {} }) }
                : TransitionPresets.ModalSlideFromBottomIOS),
            };
          }}
        />
      </JsStack>
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
