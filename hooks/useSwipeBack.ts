import { useRef, useEffect, useState, useLayoutEffect } from "react";
import { PanResponder, Animated, Dimensions } from "react-native";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";

const SCREEN_W = Dimensions.get("window").width;

// Tuned to feel closer to iOS

// How close to the left edge a touch must start to even consider swipe-back.
// Smaller = stricter (more like iOS), larger = easier to trigger anywhere.
const EDGE_ZONE = SCREEN_W * 0.3; // percentage

// How much vertical movement is allowed before we reject the gesture.
// Lower = must be more horizontal (strict swipe-back only)
// Higher = allows more diagonal swipes
// ~0.7 ≈ allows ~55° diagonal swipes
const ANGLE_RATIO = 0.7;

// Minimum horizontal movement before we even start treating it as a swipe.
// Prevents accidental triggers from tiny finger jitter.
const ACTIVATE_DX = 5; // pixels

// How far you must drag the screen before it "commits" to going back.
// Expressed as % of screen width.
// Lower = easier to trigger back
// Higher = requires more deliberate swipe
const DISMISS_THRESHOLD = SCREEN_W * 0.2;

// How fast a swipe must be to trigger "go back" even if distance is small.
// Higher = requires faster flicks
// Lower = more forgiving / easier flick-to-go-back
const DISMISS_VELOCITY = 0.5;

// Module-level — shared across all instances
export let globalDismissing = false;
export function setGlobalDismissing(val: boolean) {
  globalDismissing = val;
}

export function useSwipeBack() {
  const translateX = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);
  const dismissedRef = useRef(false);
  const startXRef = useRef(0);

  const [pointerEvents, setPointerEvents] = useState<"auto" | "none">("auto");

    useLayoutEffect(() => {
      isFocusedRef.current = isFocused;

      if (isFocused) {
        // 👇 this is the key fix
        translateX.stopAnimation(() => {
          translateX.setValue(0);
        });

        dismissedRef.current = false;
        setPointerEvents("auto");
      }
    }, [isFocused]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: (e) => {
        startXRef.current = e.nativeEvent.pageX;
        return false;
      },

      onMoveShouldSetPanResponder: (_, g) =>
        !globalDismissing &&
        !dismissedRef.current &&
        isFocusedRef.current &&
        g.dx > ACTIVATE_DX &&
        Math.abs(g.dx) > Math.abs(g.dy) * ANGLE_RATIO,

      onMoveShouldSetPanResponderCapture: (_, g) => {
        if (globalDismissing || dismissedRef.current || !isFocusedRef.current) return false;

        const fromEdge = startXRef.current < EDGE_ZONE;
        if (!fromEdge) return false;

        return (
          g.dx > ACTIVATE_DX &&
          g.dx > 0 &&
          Math.abs(g.dx) > Math.abs(g.dy) * ANGLE_RATIO
        );
      },

      onPanResponderMove: (_, g) => {
        if (g.dx <= 0) return;

        // iOS-like resistance past threshold
        let dx = g.dx;
        if (dx > DISMISS_THRESHOLD) {
          const extra = dx - DISMISS_THRESHOLD;
          dx = DISMISS_THRESHOLD + extra * 0.3;
        }

        translateX.setValue(dx);
      },

      onPanResponderRelease: (_, g) => {
        if (globalDismissing || dismissedRef.current) return;

        const shouldDismiss =
          g.dx > DISMISS_THRESHOLD || g.vx > DISMISS_VELOCITY;

        if (shouldDismiss) {
          globalDismissing = true;
          dismissedRef.current = true;
          setPointerEvents("none");

          Animated.timing(translateX, {
            toValue: SCREEN_W,
            duration: 200,
            useNativeDriver: true,
          }).start();

          router.back();

          setTimeout(() => {
            globalDismissing = false;
          }, 300);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        if (!globalDismissing && !dismissedRef.current) {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }).start();
        }
      },
    })
  ).current;

  return { panHandlers: panResponder.panHandlers, translateX, pointerEvents };
}