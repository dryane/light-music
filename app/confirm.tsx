import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ContentContainer from "@/components/ContentContainer";
import { StyledText } from "@/components/StyledText";
import { HapticPressable } from "@/components/HapticPressable";
import { useTheme } from "@/hooks/useTheme";
import { n } from "@/utils/scaling";

export default function ConfirmScreen() {
    const router = useRouter();
    const { fg } = useTheme();
    const params = useLocalSearchParams<{
        title: string;
        message: string;
        confirmText: string;
        action: string;
        returnPath: string;
    }>();

    const handleConfirm = () => {
        router.navigate({
            pathname: (params.returnPath || "/(tabs)/settings") as any,
            params: { confirmed: "true", action: params.action },
        });
    };

    return (
        <ContentContainer headerTitle={params.title || "Confirm"}>
            <StyledText style={styles.messageText}>
                {params.message}
            </StyledText>

            <View style={styles.buttonContainer}>
                <HapticPressable onPress={handleConfirm} style={styles.button}>
                    <StyledText style={[styles.buttonText, { color: fg }]}>
                        {params.confirmText || "Confirm"}
                    </StyledText>
                </HapticPressable>
            </View>
        </ContentContainer>
    );
}

const styles = StyleSheet.create({
    messageText: {
        fontSize: n(18),
        marginTop: n(10),
    },
    buttonContainer: {
        width: "100%",
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
    },
    button: {
        paddingVertical: n(15),
        paddingHorizontal: n(30),
        alignItems: "center",
        justifyContent: "flex-end",
        minWidth: n(200),
    },
    buttonText: {
        fontSize: n(40),
        textTransform: "uppercase",
    },
});
