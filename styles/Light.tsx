import React from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { n } from "@/utils/scaling"
import { MINI_PLAYER_HEIGHT } from "@/components/MiniPlayer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "@/contexts/PlayerContext";

export function useLight(): StyleSheet {
  const { fg, fgMuted, bg, sectionBg, border } = useTheme();
  const { currentTrack } = usePlayer();

  const rawInsets = useSafeAreaInsets();
  const insets = { ...rawInsets, bottom: rawInsets.bottom + (currentTrack ? MINI_PLAYER_HEIGHT : 0) };

  return StyleSheet.create({
    body: {
      fontSize: n(14),
      textAlign: "center",
      lineHeight: n(20)
    },
    h2: {
      fontSize: n(19),
      fontWeight: "600",
      textAlign: "center"
    },
    home: {
      artistRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: n(18),
        paddingVertical: n(12),
      },
      artistInfo: {
        flex: 1,
        gap: 0
      },
      artistName: {
        fontSize: n(16),
        color: fg
      },
    },
    artist: {
      albumRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: n(18),
        paddingVertical: n(12),
        gap: n(12),
        color: fg
      },
    },
    album: {
      albumTitle: {
      }
    },
    nowPlaying: {
      container: {
        paddingHorizontal: n(20),
        gap: n(15),
      }
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      paddingHorizontal: n(18),
      paddingVertical: n(12),
      borderBottomColor: border
    },
    stickyHeader: {
      backgroundColor: sectionBg,
      paddingHorizontal: n(18),
      paddingVertical: n(5),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: border
    },
    stickyHeaderText: {
      color:fgMuted,
      fontSize: n(8),
      fontWeight: "600",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    btn: {
      borderWidth: 1,
      paddingHorizontal: n(28),
      paddingVertical: n(10),
      borderColor: fg
    },
    btnText: {
      fontSize: n(15),
      color:fg
    }
  });
}