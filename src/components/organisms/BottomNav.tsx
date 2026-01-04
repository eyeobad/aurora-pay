// src/components/organisms/BottomNav.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { spacing, colors } from "../tokens";

export type BottomNavItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
};

type Props = {
  items: BottomNavItem[];
  activeKey?: string;
  onNavigate: (key: string) => void;
  testID?: string;
};

export default function BottomNav({ items, activeKey, onNavigate, testID }: Props) {
  return (
    <View style={styles.container} testID={testID}>
      {items.map((it) => {
        const active = it.key === activeKey;
        return (
          <TouchableOpacity
            key={it.key}
            onPress={() => onNavigate(it.key)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={it.label}
          >
            <View style={styles.icon}>{it.icon ?? <Text>{it.label[0]}</Text>}</View>
            <Text style={[styles.label, active ? styles.active : undefined]}>{it.label}</Text>
            {it.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{it.badge > 9 ? "9+" : String(it.badge)}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 66,
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: spacing.sm },
  icon: { marginBottom: 4 },
  label: { fontSize: 12, color: colors.muted },
  active: { color: colors.primary, fontWeight: "600" as const },
  badge: {
    position: "absolute",
    right: 18,
    top: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" as const },
});
