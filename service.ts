import { Event } from "react-native-track-player";
import TrackPlayer from "react-native-track-player";
import { playerActions } from "./playerActions";

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => playerActions.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => playerActions.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => playerActions.skipNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => playerActions.skipPrev());
  TrackPlayer.addEventListener(Event.RemoteStop, () => playerActions.stop());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => playerActions.seekTo(position));
  TrackPlayer.addEventListener(Event.RemoteDuck, ({ paused, permanent }) => playerActions.onDuck(paused, permanent));
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => playerActions.onQueueEnded());
};
