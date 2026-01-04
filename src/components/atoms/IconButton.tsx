// src/components/atoms/IconButton.tsx
import React from "react";
import { TouchableOpacity, ViewStyle, StyleSheet } from "react-native";
import { spacing, radius, colors } from "../tokens";

type Props = {
  children: React.ReactNode; // usually an <Svg/> or <Image/>
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
};

export default function IconButton({ children, size = 40, onPress, style, accessibilityLabel, testID }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      testID={testID}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 0,
    margin: spacing.xs,
  },
});
