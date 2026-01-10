// src/screens/NotificationScreen.tsx
import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";

type Nav = {
  goBack: () => void;
};

const UI = {
  bg: "#101622",
  surface: "#1c2433",
  border: "rgba(255,255,255,0.08)",
  primary: "#135bec",
  text: "#ffffff",
  muted: "#94a3b8",
  muted2: "#64748b",
  green: "#4ade80",
};

type Notice = {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: { name: any; pack: "mi" | "mci" };
  color: string;
  iconBg: string;
};

function formatTime(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function buildNotice(tx: any): Notice {
  const type = String(tx.type ?? "").toLowerCase();
  const amount = Number(tx.amount ?? 0).toFixed(2);
  const name = tx.counterparty ?? "Aurora";

  switch (type) {
    case "send":
      return {
        id: tx.id,
        title: "Payment sent",
        body: `You sent $${amount} to ${name}.`,
        time: formatTime(tx.createdAt),
        icon: { name: "send", pack: "mi" },
        color: UI.primary,
        iconBg: "rgba(19,91,236,0.14)",
      };
    case "topup":
      return {
        id: tx.id,
        title: "Top-up complete",
        body: `Added $${amount} to your wallet.`,
        time: formatTime(tx.createdAt),
        icon: { name: "add-card", pack: "mi" },
        color: UI.primary,
        iconBg: "rgba(19,91,236,0.14)",
      };
    case "receive":
      return {
        id: tx.id,
        title: "Money received",
        body: `You received $${amount} from ${name}.`,
        time: formatTime(tx.createdAt),
        icon: { name: "south-west", pack: "mi" },
        color: UI.green,
        iconBg: "rgba(74,222,128,0.14)",
      };
    case "request":
      return {
        id: tx.id,
        title: "Request sent",
        body: `You requested $${amount} from ${name}.`,
        time: formatTime(tx.createdAt),
        icon: { name: "payments", pack: "mi" },
        color: UI.primary,
        iconBg: "rgba(19,91,236,0.14)",
      };
    default:
      return {
        id: tx.id,
        title: "Activity",
        body: `Transaction of $${amount} with ${name}.`,
        time: formatTime(tx.createdAt),
        icon: { name: "notifications", pack: "mi" },
        color: UI.primary,
        iconBg: "rgba(255,255,255,0.08)",
      };
  }
}

export default function NotificationScreen() {
  const nav = useNavigation<Nav>();
  const { state } = useApp();

  const notices = useMemo<Notice[]>(() => {
    if (!state.transactions?.length) return [];
    return state.transactions.map((tx) => buildNotice(tx));
  }, [state.transactions]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.shell}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.85} style={styles.headerBtn} onPress={() => nav.goBack()}>
            <MaterialIcons name="arrow-back-ios-new" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40, height: 40 }} />
        </View>

        {notices.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="notifications-none" size={36} color={UI.muted} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>Your recent activity will show here.</Text>
          </View>
        ) : (
          <FlatList
            data={notices}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => {
              const IconPack = item.icon.pack === "mi" ? MaterialIcons : MaterialCommunityIcons;
              return (
                <View style={styles.card}>
                  <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                    <IconPack name={item.icon.name as any} size={20} color={item.color} />
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardBody}>{item.body}</Text>
                    <Text style={styles.cardTime}>{item.time}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: UI.bg },
  shell: {
    flex: 1,
    backgroundColor: UI.bg,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(16,22,34,0.90)",
  },
  headerBtn: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: "#fff", marginRight: 40 },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: UI.surface,
    borderWidth: 1,
    borderColor: UI.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  cardTitle: { color: UI.text, fontSize: 14, fontWeight: "900" },
  cardBody: { color: UI.muted, fontSize: 12, fontWeight: "700", marginTop: 4 },
  cardTime: { color: UI.muted2, fontSize: 11, fontWeight: "700", marginTop: 6 },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { color: UI.text, fontSize: 16, fontWeight: "900" },
  emptySub: { color: UI.muted, fontSize: 13, fontWeight: "700", textAlign: "center" },
});
