// src/components/molecules/Input.tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Text,
} from "react-native";
import { colors, spacing, radius, typography } from "../tokens";

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  right?: React.ReactNode;
  isCurrency?: boolean;
  currency?: string; // e.g. "USD" (used only for formatting)
};

export default function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  right,
  isCurrency,
  currency = "USD",
  value,
  onChangeText,
  ...rest
}: Props) {
  const [internal, setInternal] = useState(value ?? "");

  function handleChange(text: string) {
    setInternal(text);
    if (onChangeText) onChangeText(text);
  }

  async function onBlur() {
    if (isCurrency && internal) {
      // simple, tolerant formatting
      const numeric = parseFloat(String(internal).replace(/[^0-9.-]+/g, ""));
      if (!Number.isNaN(numeric)) {
        try {
          const formatted = numeric.toLocaleString(undefined, {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
          });
          setInternal(formatted);
          if (onChangeText) onChangeText(formatted);
        } catch {
          // fallback: keep raw
        }
      }
    }
    if ((rest as any).onBlur) (rest as any).onBlur();
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TextInput
          value={internal as string}
          onChangeText={handleChange}
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.muted}
          onBlur={onBlur}
          {...rest}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", marginVertical: spacing.sm },
  label: { marginBottom: 6, color: colors.muted, fontSize: 13 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    padding: 0,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  right: { marginLeft: spacing.sm },
  error: { marginTop: 6, color: colors.danger, fontSize: 12 },
});
