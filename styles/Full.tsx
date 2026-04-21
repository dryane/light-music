import React from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { n } from "@/utils/scaling"
import { MINI_PLAYER_HEIGHT } from "@/components/MiniPlayer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "@/contexts/PlayerContext";

export function useFull(): StyleSheet {
  const { fg, fgMuted, bg, sectionBg, border, fgDim } = useTheme();
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
        paddingVertical: n(9),
        borderBottomWidth: 1,
        borderBottomColor: border
      },
      artistInfo: {
        flex: 1,
        gap: 0
      },
      artistName: {
        fontSize: n(14),
        marginBottom: n(-2),
        color: fg
      },
      artistMeta: {
        fontSize: n(7),
        color: fgMuted
      },
    },
    artist: {
      header: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: n(18),
        paddingVertical: n(12),
        borderBottomColor: border,
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      artistName: {
        fontSize: n(16),
        fontWeight: "700",
        letterSpacing: n(-0.3),
        color:fg,
        marginBottom: n(-3)
      },
      artistMeta: {
        fontSize: n(8),
        color:fgMuted
      },
      headerIcons: {
        flexDirection: "row",
        gap: n(16),
        paddingBottom: n(2)
      },
      albumRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: n(18),
        paddingVertical: n(2),
        gap: n(12),
        color: fg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: border
      },
      rowTitle: {
        fontSize: n(11),
        fontWeight: "700",
        marginBottom: n(-3),
        letterSpacing: n(-0.3),
        color:fg
      },
      rowMeta: {
        fontSize: n(7),
        color:fgMuted
      },
    },
    album: {
      header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: n(18),
        paddingVertical: n(12),
        borderBottomColor: border,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: n(10),
      },
      albumTitle: {
        fontSize: n(11),
        fontWeight: "700",
        letterSpacing: n(-0.3),
        marginBottom: n(-3),
        color:fg
      },
      albumMeta: {
        fontSize: n(7),
        color:fgMuted
      },
      headerIcons: {
        flexDirection: "row",
        gap: n(16),
        paddingBottom: n(2),
        alignSelf:"flex-end"
      },
    },
    nowPlaying: {
      container: {
        paddingHorizontal: n(20),
        gap: n(15),
      },
      artWrap: {
        alignSelf: "center"
      },
      handleWrap: {
        alignItems: "center",
        marginBottom: n(-4)
      },
      handle: {
        width: n(36),
        height: n(4),
        borderRadius: n(2),
        opacity: 0.3,
        backgroundColor: fgDim
      },
    },
    stickyHeader: {
      backgroundColor: sectionBg,
      paddingHorizontal: n(18),
      paddingVertical: n(4),
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