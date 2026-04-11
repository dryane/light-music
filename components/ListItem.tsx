import React, { memo, ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";
import { ListItemFull } from "@/components/list-item/ListItemFull";
import { ListItemLight } from "@/components/list-item/ListItemLight";

interface ListItemProps {
    primaryText: string | ReactNode;
    secondaryText: string;
    onPress: () => void;
}

export const ListItem = memo(function ListItem({
    primaryText,
    secondaryText,
    onPress,
}: ListItemProps) {
    const theme = useTheme();

    const props = { primaryText, secondaryText, theme, onPress };

    return theme.variant === "light"
        ? <ListItemLight {...props} />
        : <ListItemFull {...props} />;
});
