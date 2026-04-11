import { MaterialIcons } from "@expo/vector-icons";
import { Theme } from "@/hooks/useTheme";

export interface HeaderViewProps {
  headerTitle?: string;
  hideBackButton: boolean;
  theme: Theme;
  onBack: () => void;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  onLeftIconPress?: () => void;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
}
