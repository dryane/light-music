import { useRef, useEffect, useState } from "react";
import { PanResponder, Animated, Dimensions } from "react-native";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";

const SCREEN_W = Dimensions.get("window").width;
const DISMISS_THRESHOLD = SCREEN_W * 0.20;
const DISMISS_VELOCITY = 0.3;

// Module-level — shared across all instances
// Prevents underlying screens from triggering their own dismiss
export let globalDismissing = false;
export function setGlobalDismissing(val: boolean) {
  globalDismissing = val;
}

export function useSwipeBack() {
  const translateX = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);
  const dismissedRef = useRef(false);
  const [pointerEvents, setPointerEvents] = useState<"auto" | "none">("auto");

  useEffect(() => {
    isFocusedRef.current = isFocused;
    if (isFocused) {
      translateX.setValue(0);
      dismissedRef.current = false;
      setPointerEvents("auto");
    }
  }, [isFocused]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !globalDismissing &&
        !dismissedRef.current &&
        isFocusedRef.current &&
        g.dx > 2 &&
        Math.abs(g.dx) > Math.abs(g.dy),
      // Capture horizontal swipes before the FlatList's ScrollView claims them
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !globalDismissing &&
        !dismissedRef.current &&
        isFocusedRef.current &&
        g.dx > 10 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.5,

      onPanResponderMove: (_, g) => {
        if (g.dx > 0) translateX.setValue(g.dx);
      },

      onPanResponderRelease: (_, g) => {
        if (globalDismissing || dismissedRef.current) return;
        if (g.dx > DISMISS_THRESHOLD || g.vx > DISMISS_VELOCITY) {
          globalDismissing = true;
          dismissedRef.current = true;
          setPointerEvents("none");
          // Animate off-screen so there's no pause at the release point
          Animated.spring(translateX, {
            toValue: SCREEN_W,
            velocity: g.vx,
            useNativeDriver: true,
            tension: 100,
            friction: 14,
          }).start();
          // Navigate immediately — the spring runs visually while the screen unmounts
          router.back();
          setTimeout(() => { globalDismissing = false; }, 300);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 14,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        if (!globalDismissing && !dismissedRef.current) {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 14,
          }).start();
        }
      },
    })
  ).current;

  return { panHandlers: panResponder.panHandlers, translateX, pointerEvents };
}
