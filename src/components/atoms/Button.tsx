// src/components/atoms/Button.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, radius, spacing, typography } from "../tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type Props = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  style,
  textStyle,
  testID,
}: Props) {
  const isDisabled = !!disabled || !!loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : colors.primary} />
      ) : (
        <Text style={[styles.text, variant === "primary" ? styles.textPrimary : null, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    flexDirection: "row",
  },
  text: {
    ...typography.button,
    color: colors.text,
  },
  textPrimary: {
    color: "#fff",
  },
  disabled: {
    opacity: 0.6,
  },
});

const variantStyles: Record<ButtonVariant, any> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: colors.danger },
};

const sizeStyles = {
  sm: { paddingVertical: 8, minHeight: 36 },
  md: { paddingVertical: 12, minHeight: 44 },
  lg: { paddingVertical: 16, minHeight: 52 },
};
