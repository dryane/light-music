import React from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { n } from "@/utils/scaling"
import { MINI_PLAYER_HEIGHT } from "@/components/MiniPlayer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "@/contexts/PlayerContext";

export function useGeneral(): StyleSheet {
  const { fg, fgMuted, fgDim, bg, sectionBg, border, trackBg, progressBg } = useTheme();
  const { currentTrack } = usePlayer();

  const rawInsets = useSafeAreaInsets();
  const insets = { ...rawInsets, bottom: rawInsets.bottom + (currentTrack ? MINI_PLAYER_HEIGHT : 0) };

  return StyleSheet.create({
    color: {
      color: fg
    },
    colorMuted: {
      color: fgMuted
    },
    colorDim: {
      color: fgDim
    },
    bg: {
      backgroundColor: bg
    },
    root: {
      flex: 1,
      backgroundColor: bg,
      color: fg,
      paddingTop: insets.top
    },
    flexLeft: {
      flex: 1,
      gap: 2
    },
    copy: {
      fontSize: n(12),
      letterSpacing: n(-0.3),
      color: fg
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: n(14),
      padding: n(36),
    },
    verticalCentered: {
      flex: 1,
      justifyContent: "center",
    },
    nowPlaying: {
      trackInfo: {
        gap: n(4),
        marginBottom: n(-15)
      },
      trackTitle: {
        fontSize: n(14),
        fontWeight: "700",
        lineHeight: n(24),
        marginBottom: n(-6),
        color: fg
      },
      trackSub: {
        fontSize: n(10),
        color: fgDim
      },
      progressSection: {
        gap: n(8),
        marginBottom: n(-30)
      },
      seekHitArea: {
        height: n(36),
        justifyContent: "center",
        position: "relative"
      },
      progressTrack: {
        height: n(3),
        borderRadius: n(2),
        overflow: "hidden",
        backgroundColor: trackBg
      },
      progressFill: {
        height: "100%",
        borderRadius: n(2),
        backgroundColor: fg
      },
      timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: n(-15)
      },
      time: {
        fontSize: n(10),
        color: fgDim
      },
      controls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: n(28),
      },
    },
    miniPlayer: {
      progressBar: {
        height: n(1.5),
        width: "100%",
        backgroundColor: progressBg
      },
      progressFill: {
        height: "100%",
        backgroundColor: fg
      },
      container: {
        backgroundColor: bg,
        flexDirection: "row",
        alignItems: "center",
        paddingRight: n(14),
        paddingLeft: n(18),
        paddingTop: n(8),
        paddingBottom: n(10),
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTOpColor: border,
        gap: n(11),
      },
      info: {
        flex: 1,
        gap: 1
      },
      title: {
        color:fg,
        fontSize: n(10),
        marginBottom: n(-3),
        fontWeight: "500"
      },
      artist: {
        fontSize: n(8),
        color:fgMuted
      },
      btn: {
        padding: n(4)
      },
    }
  });
}