// src/screens/DashboardScreen.tsx
import React, { useEffect, useMemo } from "react";
import {
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Text,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import FloatingNavBar, { FloatingNavItem } from "../components/organisms/FloatingNavBar";
import { useApp } from "../context/AppContext";
import { AppText } from "../components";
import { notifyLocal } from "../lib/notifications";

type Nav = {
  navigate: (screen: string, params?: any) => void;
};

const COLORS = {
  bg: "#101622",
  surfaceDark: "#192233",
  surface2: "#151c2b",
  primary: "#135bec",
  primaryDark: "#0c40a8",
  white: "#ffffff",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate900: "#0b1220",
  borderLight: "rgba(255,255,255,0.10)",
  borderLight2: "rgba(255,255,255,0.08)",
  emerald: "#4ade80",
};

const NAV_H = 72;

const quickActions = [
  { key: "send", label: "Send", icon: "send", route: "Transaction" },
  { key: "request", label: "Request", icon: "cash-sync", route: "request" },
  { key: "topup", label: "Top Up", icon: "credit-card-plus", route: "TopUp" },
  { key: "more", label: "More", icon: "view-grid", route: "PayBills" },
];

const items = [
  {
    id: "tx_spotify",
    title: "Spotify Premium",
    subtitle: "Subscription • Today, 9:41 AM",
    amount: "-$12.99",
    status: "send",
    icon: "music",
  },
  {
    id: "tx_sarah",
    title: "Sarah Jenkins",
    subtitle: "Transfer • Yesterday",
    amount: "+$50.00",
    status: "receive",
    icon: "person",
  },
  {
    id: "tx_starbucks",
    title: "Starbucks Coffee",
    subtitle: "Food & Drink • Oct 24",
    amount: "-$4.50",
    status: "send",
    icon: "coffee",
  },
  {
    id: "tx_apple",
    title: "Apple Store",
    subtitle: "Electronics • Oct 21",
    amount: "-$1,299.00",
    status: "send",
    icon: "laptop",
  },
];

// map items[].icon -> MaterialCommunityIcons
const itemIcon = (icon?: string) => {
  switch (icon) {
    case "music":
      return "music-note";
    case "person":
      return "account";
    case "coffee":
      return "coffee";
    case "laptop":
      return "laptop";
    default:
      return "swap-horizontal";
  }
};

const itemIconColor = (icon?: string) => {
  switch (icon) {
    case "music":
      return "#1db954";
    case "person":
      return COLORS.primary;
    case "coffee":
      return "#f97316";
    case "laptop":
      return "#94a3b8";
    default:
      return "#ffffff";
  }
};

const itemIconBg = (icon?: string) => {
  switch (icon) {
    case "music":
      return "rgba(29,185,84,0.12)";
    case "person":
      return "rgba(19,91,236,0.12)";
    case "coffee":
      return "rgba(249,115,22,0.12)";
    case "laptop":
      return "rgba(148,163,184,0.12)";
    default:
      return "rgba(255,255,255,0.10)";
  }
};

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const { state, refresh } = useApp();

  const refreshing = state.loading ?? false;
  const balance = state.balance ?? 0;
  const transactions = state.transactions ?? [];
  const accountNumber = state.user?.accountNumber ?? "0000000000";
  const accountDisplay = accountNumber.replace(/(\d{4})(?=\d)/g, "$1 ");

  useEffect(() => {
    if (!state.user) navigation.navigate("Login");
  }, [state.user, navigation]);

  useEffect(() => {
    if (isFocused) refresh().catch(() => {});
  }, [isFocused, refresh]);

  const onRefresh = () => refresh().catch(() => {});

  const recentTxs = useMemo(() => {
    if (transactions.length > 0) {
      return transactions.slice(0, 6).map((tx) => ({
        id: tx.id,
        title: tx.counterparty ?? tx.type,
        subtitle: `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} • ${new Date(
          tx.createdAt
        ).toLocaleDateString()}`,
        amount: tx.type === "send" ? `-$${Number(tx.amount).toFixed(2)}` : `+$${Number(tx.amount).toFixed(2)}`,
        status: tx.type,
        icon: tx.type === "send" ? "laptop" : "person",
      }));
    }
    return items;
  }, [transactions]);

  const Amount = ({ value }: { value: string }) => {
    const isNegative = value.startsWith("-");
    return <Text style={[styles.amount, isNegative ? styles.amountNeg : styles.amountPos]}>{value}</Text>;
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.userRow}>
          <View style={styles.avatarWrap}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Profile")}
              style={styles.avatarTap}
              accessibilityRole="button"
              accessibilityLabel="Go to Profile"
            >
              <Image style={styles.avatar} source={require("../../assets/avatar.png")} resizeMode="cover" />
            </TouchableOpacity>
          </View>

          <View>
            <AppText variant="caption" style={{ color: COLORS.slate400 }}>
              Good Morning
            </AppText>
            <AppText variant="h3" style={{ color: COLORS.white }}>
              {state.user?.name ?? "there"}
            </AppText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.notifBtn}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => navigation.navigate("Notifications")}
        >
          <MaterialIcons name="notifications" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={recentTxs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <View style={styles.cardOuter}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceCard}
              >
                <View style={[styles.blob, styles.blobTopRight]} />
                <View style={[styles.blob2, styles.blobBottomLeft]} />

                <View style={styles.balanceContent}>
                  <View style={styles.balanceHeaderRow}>
                    <AppText variant="caption" style={{ color: "rgba(255,255,255,0.8)" }}>
                      Total Balance
                    </AppText>

                    <View style={styles.currencyPill}>
                      <Text style={styles.currencyText}>USD</Text>
                      <MaterialCommunityIcons name="chevron-down" size={14} color="#fff" />
                    </View>
                  </View>

                  <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>

                  <View style={styles.deltaRow}>
                    <View style={styles.deltaPill}>
                      <MaterialCommunityIcons name="trending-up" size={16} color={COLORS.emerald} />
                      <Text style={styles.deltaText}>+2.4%</Text>
                    </View>
                    <Text style={styles.deltaSub}>this month</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.cardNumberRow}
                    accessibilityRole="button"
                    onPress={() => notifyLocal("Account number", accountNumber)}
                  >
                    <Text style={styles.cardNumber}>{accountDisplay}</Text>
                    <MaterialIcons name="content-copy" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsWrap}>
              <View style={styles.actionsRow}>
                {quickActions.map((action) => (
                  <View key={action.key} style={styles.actionItem}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => navigation.navigate(action.route)}
                      accessibilityRole="button"
                    >
                      <MaterialCommunityIcons name={action.icon as any} size={26} color={COLORS.slate900} />
                    </TouchableOpacity>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent header */}
            <View style={styles.recentHeaderCard}>
              <View style={styles.recentHeaderRow}>
                <Text style={styles.recentTitle}>Recent Activity</Text>

                <TouchableOpacity
                  style={styles.seeAllBtn}
                  onPress={() => navigation.navigate("History")}
                  accessibilityRole="button"
                >
                  <Text style={styles.seeAllText}>See All</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.txOuter}>
            <View style={styles.txRow}>
              <View style={styles.txLeft}>
                <View style={[styles.txIconWrap, { backgroundColor: itemIconBg((item as any).icon) }]}>
                  <MaterialCommunityIcons
                    name={itemIcon((item as any).icon) as any}
                    size={22}
                    color={itemIconColor((item as any).icon)}
                  />
                </View>

                <View>
                  <Text style={styles.txTitle}>{(item as any).title}</Text>
                  <Text style={styles.txSubtitle}>{(item as any).subtitle}</Text>
                </View>
              </View>

              <Amount value={(item as any).amount} />
            </View>
          </View>
        )}
      />

      {/* FloatingNavBar with centered scanner */}
      <FloatingNavBar
        activeKey="home"
        primary={COLORS.primary}
        background="rgba(25,34,51,0.92)"
        fab={{
          icon: "qrcode-scan",
          pack: "mci",
          onPress: () => navigation.navigate("Scanner"),
        }}
        items={[
          { key: "home", icon: "home", pack: "mi", onPress: () => navigation.navigate("Dashboard") } as FloatingNavItem,
          { key: "cards", icon: "credit-card", pack: "mci", onPress: () => navigation.navigate("MyCards") } as FloatingNavItem,
          { key: "history", icon: "history", pack: "mi", onPress: () => navigation.navigate("History") } as FloatingNavItem,
          { key: "settings", icon: "settings", pack: "mi", onPress: () => navigation.navigate("Settings") } as FloatingNavItem,
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  topBar: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 12 : 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceDark,
  },
  // ✅ added
  avatarTap: {
    width: "100%",
    height: "100%",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.slate900,
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    paddingBottom: NAV_H + 64,
  },

  cardOuter: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  balanceCard: {
    borderRadius: 32,
    overflow: "hidden",
    padding: 24,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  balanceContent: {
    gap: 18,
  },
  balanceHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currencyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  currencyText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  balanceValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  deltaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(74, 222, 128, 0.18)",
  },
  deltaText: {
    color: COLORS.emerald,
    fontWeight: "800",
    fontSize: 12,
  },
  deltaSub: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 12,
    fontWeight: "600",
  },
  cardNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    opacity: 0.9,
  },
  cardNumber: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1.2,
  },

  blob: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  blob2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  blobTopRight: {
    top: -40,
    right: -40,
  },
  blobBottomLeft: {
    bottom: -40,
    left: -40,
  },

  actionsWrap: {
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  actionItem: {
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(248,250,252,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.slate400,
  },

  recentHeaderCard: {
    marginHorizontal: 24,
    marginBottom: 8,
    borderRadius: 32,
    padding: 18,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.borderLight2,
  },
  recentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recentTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  seeAllText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 14,
  },

  txOuter: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  txRow: {
    borderRadius: 18,
    backgroundColor: COLORS.slate900,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  txIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e1b4c",
  },
  txTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  txSubtitle: {
    color: COLORS.slate400,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: "900",
  },
  amountPos: {
    color: COLORS.emerald,
  },
  amountNeg: {
    color: "#fff",
  },
});
