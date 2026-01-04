// src/components/molecules/BalanceCard.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import AppText from "../atoms/AppText";
import Button from "../atoms/Button";
import { colors, spacing, radius } from "../tokens";

type Props = {
  available: number | string;
  pending?: number | string;
  onAction?: (key: string) => void;
  testID?: string;
};

export default function BalanceCard({ available, pending, onAction, testID }: Props) {
  return (
    <View style={styles.card} testID={testID}>
      <AppText variant="caption" style={styles.label}>
        Available Balance
      </AppText>
      <AppText variant="h1" style={styles.balance}>
        {typeof available === "number" ? formatCurrency(available) : available}
      </AppText>

      {pending ? (
        <AppText variant="caption" style={styles.pending}>
          Pending: {typeof pending === "number" ? formatCurrency(pending) : pending}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <Button title="Send" onPress={() => onAction?.("send")} variant="primary" style={styles.actionBtn} />
        <Button title="Receive" onPress={() => onAction?.("receive")} variant="secondary" style={styles.actionBtn} />
      </View>
    </View>
  );
}

function formatCurrency(n: number) {
  try {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  } catch {
    return String(n);
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.muted, marginBottom: 6 },
  balance: { marginBottom: 6 },
  pending: { color: colors.muted },
  actions: { flexDirection: "row", marginTop: spacing.md, gap: spacing.sm },
  actionBtn: { flex: 1 },
});
