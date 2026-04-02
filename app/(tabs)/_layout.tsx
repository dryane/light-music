import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { MiniPlayer } from "@/components/MiniPlayer";

export default function TabsLayout() {
  const { invertColors } = useInvertColors();
  const bg = invertColors ? "#ffffff" : "#000000";

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
