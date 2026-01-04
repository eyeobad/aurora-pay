// src/components/organisms/TopHeader.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import AppText from "../atoms/AppText";
import { spacing, colors } from "../tokens";

type Props = {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  left?: React.ReactNode;
  testID?: string;
};

export default function TopHeader({ title, onBack, left, right, testID }: Props) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.left}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} accessibilityRole="button" style={styles.iconWrap}>
            <AppText variant="h2">‹</AppText>
          </TouchableOpacity>
        ) : (
          left || null
        )}
      </View>

      <View style={styles.center}>
        {title ? <AppText variant="h2">{title}</AppText> : null}
      </View>

      <View style={styles.right}>{right || null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  left: { width: 56, alignItems: "flex-start" },
  center: { flex: 1, alignItems: "center" },
  right: { width: 56, alignItems: "flex-end" },
  iconWrap: { padding: 8 },
});
