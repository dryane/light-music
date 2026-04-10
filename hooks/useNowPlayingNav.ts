import { router } from "expo-router";

let _skipAnimation = false;

export function getSkipAnimation(): boolean {
  return _skipAnimation;
}

export function clearSkipAnimation(): void {
  _skipAnimation = false;
}

export function pushNowPlayingInstant(): void {
  _skipAnimation = true;
  router.push("/nowplaying");
}

export function pushNowPlayingAnimated(): void {
  _skipAnimation = false;
  router.push("/nowplaying");
}