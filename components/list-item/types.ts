import { ReactNode } from "react";
import { Theme } from "@/hooks/useTheme";

export interface ListItemViewProps {
  primaryText: string | ReactNode;
  secondaryText: string;
  theme: Theme;
  onPress: () => void;
}
