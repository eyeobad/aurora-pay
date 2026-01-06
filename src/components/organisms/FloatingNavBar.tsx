// src/components/organisms/FloatingNavBar.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle, Platform } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

type IconPack = "mi" | "mci";

export type FloatingNavItem = {
  key: string;
  icon: string;
  pack?: IconPack;
  onPress: () => void;
};

type Props = {
  // pass 4 items (home, cards, history, settings)
  items: FloatingNavItem[];
  fab: { icon: string; pack?: IconPack; onPress: () => void };
  activeKey?: string;
  primary?: string;
  background?: string;
  style?: ViewStyle;
};

export default function FloatingNavBar({
  items,
  fab,
  activeKey,
  primary = "#135bec",
  background = "rgba(25,34,51,0.92)",
  style,
}: Props) {
  // your items order: [home, cards, history, settings]
  const left = items.slice(0, 2);
  const right = items.slice(2, 4);

  return (
    <View style={[styles.wrap, style]} pointerEvents="box-none">
      <BlurView intensity={Platform.OS === "ios" ? 35 : 25} tint="dark" style={styles.nav}>
        {/* fallback tint under blur */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: background, borderRadius: 999 }]} />

        {/* ICON ROW (retain old spacing) */}
        <View style={styles.iconRow} pointerEvents="auto">
          {left.map((item) => {
            const IconComp = item.pack === "mci" ? MaterialCommunityIcons : MaterialIcons;
            const isActive = item.key === activeKey;
            return (
              <TouchableOpacity
                key={item.key}
                style={isActive ? styles.navItemActive : styles.navItem}
                accessibilityRole="button"
                onPress={item.onPress}
              >
                <IconComp name={item.icon as any} size={27} color={isActive ? primary : "#94a3b8"} />
              </TouchableOpacity>
            );
          })}

          {/* spacer where the FAB sits (prevents icons feeling "squeezed") */}
          <View style={styles.centerGap} />

          {right.map((item) => {
            const IconComp = item.pack === "mci" ? MaterialCommunityIcons : MaterialIcons;
            const isActive = item.key === activeKey;
            return (
              <TouchableOpacity
                key={item.key}
                style={isActive ? styles.navItemActive : styles.navItem}
                accessibilityRole="button"
                onPress={item.onPress}
              >
                <IconComp name={item.icon as any} size={27} color={isActive ? primary : "#94a3b8"} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FAB (Scanner) absolutely centered like your old layout */}
        <TouchableOpacity style={styles.fab} accessibilityRole="button" onPress={fab.onPress}>
          <LinearGradient
            colors={[primary, "#0c40a8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            {fab.pack === "mci" ? (
              <MaterialCommunityIcons name={fab.icon as any} size={28} color="#fff" />
            ) : (
              <MaterialIcons name={fab.icon as any} size={28} color="#fff" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const NAV_H = 72;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 22 : 18,
    paddingTop: 10,
  },

  nav: {
    height: NAV_H,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    justifyContent: "center",
  },

  // THIS keeps the original "space-around" feel
  iconRow: {
    height: NAV_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
  },

  centerGap: {
    width: 72, // reserve space for the FAB so spacing feels like your old nav
  },

  navItem: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  // match your old active sizing (you had 64x60)
  navItemActive: {
    width: 64,
    height: 60,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  fab: {
    position: "absolute",
    left: "50%",
    bottom: 8, // inside the pill + still floating
    transform: [{ translateX: -28 }], // 56/2
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -26,
    shadowColor: "#135bec",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    overflow: "hidden",
  },

  fabGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
