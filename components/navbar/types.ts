import { Theme } from "@/hooks/useTheme";
import { TabConfigItem } from "@/components/Navbar";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export interface NavbarViewProps {
  tabsConfig?: ReadonlyArray<TabConfigItem>;
  currentScreenName: string;
  navigation: BottomTabBarProps["navigation"];
  theme: Theme;
}
