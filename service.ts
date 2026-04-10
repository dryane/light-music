import TrackPlayer, { Event } from "react-native-track-player";

module.exports = async function () {
  console.log("[SERVICE] registered");
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    console.log("[SERVICE] RemotePrevious fired");
    const progress = await TrackPlayer.getProgress();
    if (progress.position > 5) {
      await TrackPlayer.seekTo(0);
    } else {
      await TrackPlayer.skipToPrevious();
    }
  });
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.destroy());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => {
    TrackPlayer.seekTo(position);
  });
  TrackPlayer.addEventListener(Event.RemoteDuck, async ({ paused, permanent }) => {
    if (permanent) {
      await TrackPlayer.pause();
    } else if (paused) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  });
};
