import { useRef, useEffect } from "react";
import { PanResponder, Animated, Dimensions } from "react-native";
import { router, useIsFocused } from "expo-router";

const SCREEN_W = Dimensions.get("window").width;
const DISMISS_THRESHOLD = SCREEN_W * 0.35;
const DISMISS_VELOCITY = 0.4;

// Module-level lock — shared across all instances
// Prevents underlying screens from triggering their own dismiss
// while a dismiss animation is already in progress
let globalDismissing = false;

export function useSwipeBack() {
  const translateX = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);

  useEffect(() => {
    isFocusedRef.current = isFocused;
    // Reset translateX when screen regains focus (e.g. after a child screen pops)
    if (isFocused) {
      translateX.setValue(0);
    }
  }, [isFocused]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !globalDismissing &&
        isFocusedRef.current &&
        g.dx > 2 &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderMove: (_, g) => {
        if (g.dx > 0) translateX.setValue(g.dx);
      },

      onPanResponderRelease: (_, g) => {
        if (globalDismissing) return;
        if (g.dx > DISMISS_THRESHOLD || g.vx > DISMISS_VELOCITY) {
          globalDismissing = true;
          Animated.timing(translateX, {
            toValue: SCREEN_W,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            router.back();
            translateX.setValue(0);
            setTimeout(() => { globalDismissing = false; }, 1000);
          });
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
        if (!globalDismissing) {
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

  return { panHandlers: panResponder.panHandlers, translateX };
}
