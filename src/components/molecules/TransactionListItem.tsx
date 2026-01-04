// src/components/molecules/TransactionListItem.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Text } from "react-native";
import AppText from "../atoms/AppText";
import { spacing, colors, radius } from "../tokens";

export type TransactionStatus = "sent" | "received" | "pending" | "failed";

type Props = {
  title: string;
  subtitle?: string;
  amount: string | number;
  status?: TransactionStatus;
  onPress?: () => void;
  avatarUri?: string;
  testID?: string;
};

export default function TransactionListItem({ title, subtitle, amount, status = "sent", onPress, avatarUri, testID }: Props) {
  const statusColor = status === "received" ? colors.success : status === "failed" ? colors.danger : colors.muted;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button" testID={testID}>
      {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder} />}
      <View style={styles.content}>
        <AppText variant="body">{title}</AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
      <View style={styles.right}>
        <AppText variant="body" style={{ color: statusColor }}>
          {typeof amount === "number" ? amount.toFixed(2) : amount}
        </AppText>
        <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: spacing.md },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, marginRight: spacing.md },
  content: { flex: 1 },
  right: { alignItems: "flex-end" },
  status: { fontSize: 12, marginTop: 4, textTransform: "capitalize" },
});
