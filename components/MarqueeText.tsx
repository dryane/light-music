import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, Animated, Easing, StyleSheet, TextStyle, StyleProp, LayoutChangeEvent } from "react-native";
import { StyledText } from "@/components/StyledText";
import { useTheme } from "@/hooks/useTheme";

interface MarqueeTextProps {
  children: string | undefined;
  style?: StyleProp<TextStyle>;
  pauseDuration?: number;
  speed?: number;
  gap?: number;
}

const FADE_WIDTH = 28;
// Opacity steps from left (transparent) to right (solid)
const FADE_STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];

export function MarqueeText({
  children,
  style,
  pauseDuration = 4,
  speed = 25,
  gap = 100,
}: MarqueeTextProps) {
  const { bg } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const overflow = textWidth > containerWidth && containerWidth > 0;
  const totalScroll = textWidth + gap;

  const cleanup = useCallback(() => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    scrollX.setValue(0);
  }, [scrollX]);

  useEffect(() => {
    cleanup();
    if (!overflow) return;

    const runCycle = () => {
      scrollX.setValue(0);

      timeoutRef.current = setTimeout(() => {
        const scrollDuration = (totalScroll / speed) * 1000;
        const anim = Animated.timing(scrollX, {
          toValue: -totalScroll,
          duration: scrollDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        });
        animRef.current = anim;
        anim.start(({ finished }) => {
          if (!finished) return;
          runCycle();
        });
      }, pauseDuration * 1000);
    };

    runCycle();
    return cleanup;
  }, [overflow, totalScroll, speed, pauseDuration, cleanup]);

  useEffect(() => {
    cleanup();
    setTextWidth(0);
  }, [children]);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const onMeasureLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setTextWidth(w);
  }, []);

  // Fade visibility: hide during the gap between text copies
  const textEndAtEdge = textWidth - containerWidth;
  const gapEnds = textEndAtEdge + gap;

  const fadeOpacity = overflow
    ? scrollX.interpolate({
        inputRange: [
          -totalScroll,
          -gapEnds,
          -(gapEnds - 1),
          -(textEndAtEdge + 1),
          -textEndAtEdge,
          0,
        ],
        outputRange: [1, 1, 0, 0, 1, 1],
        extrapolate: "clamp",
      })
    : 0;

  const sliceWidth = FADE_WIDTH / FADE_STEPS.length;

  return (
    <View>
      {/* Hidden measurement */}
      <View style={styles.measureWrap} pointerEvents="none">
        <StyledText style={style} onLayout={onMeasureLayout}>
          {children}
        </StyledText>
      </View>

      <View onLayout={onContainerLayout} style={overflow ? styles.clipped : undefined}>
        {overflow ? (
          <>
            <Animated.View style={[styles.track, { width: textWidth * 2 + gap, transform: [{ translateX: scrollX }] }]}>
              <StyledText style={style} numberOfLines={1}>{children}</StyledText>
              <View style={{ width: gap }} />
              <StyledText style={style} numberOfLines={1}>{children}</StyledText>
            </Animated.View>

            {/* Right-edge fade: always visible */}
            <View
              style={styles.fadeWrap}
              pointerEvents="none"
            >
              {FADE_STEPS.map((opacity, i) => (
                <View
                  key={i}
                  style={{
                    width: sliceWidth,
                    height: "100%",
                    backgroundColor: bg,
                    opacity,
                  }}
                />
              ))}
            </View>
          </>
        ) : (
          <StyledText style={style} numberOfLines={1}>
            {children}
          </StyledText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  measureWrap: {
    position: "absolute",
    opacity: 0,
    top: -9999,
    left: 0,
    width: 99999,
    flexDirection: "row",
  },
  clipped: {
    overflow: "hidden",
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
  },
  fadeWrap: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
    flexDirection: "row",
  },
});
