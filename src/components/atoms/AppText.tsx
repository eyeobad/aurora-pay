// src/components/atoms/AppText.tsx
import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";
import { typography, colors } from "../tokens";

type Variant = "h1" | "h2" | "body" | "caption" | "button";
type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export default function AppText({ children, variant = "body", style, color, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[styles.base, styles[variant], color ? { color } : null, style]}
      accessibilityRole="text"
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  h1: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    lineHeight: typography.h1.lineHeight,
  },
  h2: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    lineHeight: typography.h2.lineHeight,
  },
  body: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  caption: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
    color: colors.muted,
  },
  button: {
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
    lineHeight: typography.button.lineHeight,
  },
});
