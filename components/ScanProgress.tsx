import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ScanProgressFull } from "@/components/scan-progress/ScanProgressFull";
import { ScanProgressLight } from "@/components/scan-progress/ScanProgressLight";

interface ScanProgressProps {
  progress: number;
  status?: string;
}

const BAR_COUNT = 8;
const DELAYS = [0, 100, 200, 300, 400, 300, 200, 100];

export function ScanProgress({ progress, status }: ScanProgressProps) {
  const theme = useTheme();

  // Per-instance animation values — no module-level shared state
  const anims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  ).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      anims.forEach((anim, i) => {
        const phase = ((elapsed - DELAYS[i]) / 800) * Math.PI * 2;
        const value = 0.3 + ((Math.sin(phase) + 1) / 2) * 0.7;
        anim.setValue(value);
      });
    }, 16); // ~60 fps

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      anims.forEach((anim) => anim.stopAnimation());
    };
  }, []);

  const props = { progress, status, theme, anims };

  return theme.variant === "light"
    ? <ScanProgressLight {...props} />
    : <ScanProgressFull {...props} />;
}
