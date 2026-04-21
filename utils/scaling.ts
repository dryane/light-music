import { PixelRatio } from "react-native";

const TARGET_DENSITY = 2.55;
const GLOBAL_SCALE = 1.25; // increase to make everything bigger, e.g. 1.2

export const getDensityNormalization = () => TARGET_DENSITY / PixelRatio.get();

export const n = (size: number) => size * getDensityNormalization() * GLOBAL_SCALE;