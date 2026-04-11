import React, { useState, useRef } from "react";
import {
    FlatList,
    View,
    Animated,
    StyleSheet,
    FlatListProps,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { n } from "@/utils/scaling";

type CustomScrollViewProps<T = any> = FlatListProps<T>;

const CustomScrollView = <T,>({
    style,
    contentContainerStyle,
    ...rest
}: CustomScrollViewProps<T>) => {
    const { fg } = useTheme();
    const [contentHeight, setContentHeight] = useState(0);
    const [scrollViewHeight, setScrollViewHeight] = useState(0);
    const scrollY = useRef(new Animated.Value(0)).current;

    const scrollIndicatorHeight =
        scrollViewHeight > 0 && contentHeight > scrollViewHeight
            ? Math.max((scrollViewHeight * scrollViewHeight) / contentHeight, n(20))
            : 0;

    const scrollIndicatorPosition =
        contentHeight > scrollViewHeight && scrollIndicatorHeight > 0
            ? scrollY.interpolate({
                  inputRange: [0, contentHeight - scrollViewHeight],
                  outputRange: [0, scrollViewHeight - scrollIndicatorHeight],
                  extrapolate: "clamp",
              })
            : 0;

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: false,
            listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                rest.onScroll?.(event);
            },
        }
    );

    return (
        <View style={styles.container}>
            <FlatList
                style={[{ width: "100%" }, style]}
                contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
                showsVerticalScrollIndicator={false}
                overScrollMode="never"
                onContentSizeChange={(width, height) => {
                    setContentHeight(height);
                    rest.onContentSizeChange?.(width, height);
                }}
                onLayout={(event) => {
                    setScrollViewHeight(event.nativeEvent.layout.height);
                    rest.onLayout?.(event);
                }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                {...rest}
            />
            {scrollIndicatorHeight > 0 && (
                <View
                    style={[
                        styles.scrollTrack,
                        { transform: [{ translateX: n(1) }], backgroundColor: fg },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.scrollThumb,
                            {
                                backgroundColor: fg,
                                height: scrollIndicatorHeight,
                                transform: [{ translateY: scrollIndicatorPosition as any }],
                            },
                        ]}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "row",
        width: "100%",
    },
    scrollTrack: {
        width: n(1),
        height: "100%",
        position: "absolute",
        right: n(-2),
    },
    scrollThumb: {
        width: n(5),
        position: "absolute",
        right: n(-2),
    },
});

export default CustomScrollView;
