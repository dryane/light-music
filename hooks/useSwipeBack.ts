import { useRef, useState, useLayoutEffect } from "react";
import { PanResponder, Animated, Dimensions } from "react-native";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";

const SCREEN_W = Dimensions.get("window").width;

// ─── Tuning knobs ────────────────────────────────────────────────────────────

// How close to the left edge a touch must start to trigger early capture.
const EDGE_ZONE = SCREEN_W * 0.6;

// Angle ratio: lower = more forgiving diagonal swipes.
// 0.5 ≈ 63° arc (thumb-friendly)
const ANGLE_RATIO = 0.5;

// Minimum horizontal pixels before treating as a swipe (non-capture path).
const ACTIVATE_DX = 12;

// Early capture threshold — must beat the ScrollView.
const CAPTURE_DX = 4;

// How far you must drag before it commits to going back (% of screen).
const DISMISS_THRESHOLD = SCREEN_W * 0.2;

// How fast a flick must be to trigger back even if distance is small.
const DISMISS_VELOCITY = 0.5;

// ─── Global dismiss guard ────────────────────────────────────────────────────

export let globalDismissing = false;
export function setGlobalDismissing(val: boolean) {
  globalDismissing = val;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

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

      // Record touch start position but don't capture — taps pass through
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

      // Early capture near left edge — beats the ScrollView
      onMoveShouldSetPanResponderCapture: (e, g) => {
        if (globalDismissing || dismissedRef.current || !isFocusedRef.current) return false;

        // Must start near left edge
        if (startXRef.current >= EDGE_ZONE) return false;

        // Use raw movement to work around g.dx=0 on early frames
        const rawDx = e.nativeEvent.pageX - startXRef.current;
        const dx = Math.max(g.dx, rawDx);

        if (dx < CAPTURE_DX) return false;

        // Forgiving angle early (thumb arc), stricter later
        const dynamicAngle = dx < 20 ? 0.6 : ANGLE_RATIO;
        return Math.abs(dx) > Math.abs(g.dy) * dynamicAngle;
      },

      // Let ScrollView reclaim if gesture turns vertical
      onPanResponderTerminationRequest: (_, g) => {
        // Once we have meaningful horizontal movement, don't release
        if (g.dx > 6) return false;
        // Early ambiguous movement — let ScrollView have it if clearly vertical
        return Math.abs(g.dy) > Math.abs(g.dx) * 3;
      },

      onPanResponderMove: (e, g) => {
            console.log(`[SWIPE] dx=${g.dx.toFixed(1)} dy=${g.dy.toFixed(1)} vx=${g.vx.toFixed(2)} vy=${g.vy.toFixed(2)} pageX=${e.nativeEvent.pageX.toFixed(0)}`);

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

        const progress = g.dx / SCREEN_W;
        const shouldDismiss =
          g.dx > DISMISS_THRESHOLD ||
          g.vx > DISMISS_VELOCITY ||
          (progress > 0.1 && g.vx > 0.2);

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
          setTimeout(() => { globalDismissing = false; }, 300);
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

      onPanResponderTerminate: (e, g) => {
            console.log(`[SWIPE] TERMINATED at dx=${g.dx.toFixed(1)} dy=${g.dy.toFixed(1)}`);

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
