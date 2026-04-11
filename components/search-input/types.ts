import { Theme } from "@/hooks/useTheme";

export interface SearchInputViewProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onSubmit?: () => void;
  autoFocus: boolean;
  theme: Theme;
  onClear: () => void;
}
