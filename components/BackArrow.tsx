import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useInvertColors } from "@/contexts/InvertColorsContext";
import { router } from "expo-router";


export function BackArrow(){
    const { invertColors, setInvertColors, scaledStyle } = useInvertColors();

  return (
    <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
      <FontAwesome5 name="chevron-left" style={[
        styles.arrow,
      { color: invertColors ? "black" : "white" },
      ]} />
    </TouchableOpacity>
    );


}

const styles = StyleSheet.create({
  arrow: {
    fontSize:20,
    marginRight:10
  }
});
