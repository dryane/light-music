import { Theme } from "@/hooks/useTheme";
import { Animated } from "react-native";

export interface ScanProgressViewProps {
  progress: number;
  status?: string;
  theme: Theme;
  anims: Animated.Value[];
}
