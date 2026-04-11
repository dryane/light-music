import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export default function TabsLayout() {
  const { bg } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <View style={styles.inner}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        >
          <Tabs.Screen name="index" />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
});
