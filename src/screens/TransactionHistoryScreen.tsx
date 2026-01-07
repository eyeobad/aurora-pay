// src/screens/TransactionHistoryScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StatusBar,
  TextInput,
  Image,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { AppText } from "../components";
import { useApp } from "../context/AppContext";
import { notifyLocal } from "../lib/notifications";

type Nav = {
  goBack: () => void;
  navigate: (route: string, params?: any) => void;
};

type Chip = "all" | "income" | "expense" | "pending";
type TxStatus = "sent" | "received" | "pending" | "failed";

type Tx = {
  id: string;
  title: string;
  subtitle?: string;
  amount: number; // signed: - expense, + income
  status?: TxStatus;
  date?: string; // YYYY-MM-DD
  createdAt?: string;
  avatarUri?: string;
  kind?: "movie" | "topup" | "coffee" | "payment" | "shopping" | "pending" | "transfer" | "generic";
};

const UI = {
  bg: "#101622",
  card: "#1C2333",
  primary: "#135bec",
  primaryDark: "#0c40a8",
  border: "rgba(255,255,255,0.06)",
  slate400: "#94a3b8",
  slate500: "#64748b",
  white: "#fff",
};

// ----- helpers -----
function formatCurrency(n: number) {
  try {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function isoDay(d?: string) {
  return d ?? "";
}

function getSectionLabel(yyyyMmDd: string) {
  if (!yyyyMmDd) return "EARLIER";

  const today = new Date();
  const d = new Date(`${yyyyMmDd}T00:00:00`);
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((t0.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return "TODAY";
  if (diff === 1) return "YESTERDAY";

  const label = d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  return label.toUpperCase();
}

function inferKind(title: string) {
  const s = String(title || "").toLowerCase();
  if (s.includes("netflix")) return "movie";
  if (s.includes("top up")) return "topup";
  if (s.includes("starbucks")) return "coffee";
  if (s.includes("upwork")) return "payment";
  if (s.includes("whole foods")) return "shopping";
  if (s.includes("uber")) return "pending";
  return "generic";
}

// ✅ Icon mapping
function iconName(kind?: Tx["kind"]) {
  switch (kind) {
    case "movie":
      return { lib: "material", name: "movie" as const };
    case "topup":
      return { lib: "material", name: "add-card" as const };
    case "coffee":
      return { lib: "mci", name: "coffee" as const };
    case "payment":
      return { lib: "material", name: "payments" as const };
    case "shopping":
      return { lib: "material", name: "shopping-basket" as const };
    case "pending":
      return { lib: "material", name: "schedule" as const };
    case "transfer":
      return { lib: "material", name: "arrow-outward" as const };
    default:
      return { lib: "mci", name: "swap-horizontal" as const };
  }
}

function iconColor(kind?: Tx["kind"]) {
  switch (kind) {
    case "movie":
      return "#fb7185";
    case "topup":
      return UI.primary;
    case "coffee":
      return "#f97316";
    case "payment":
      return UI.primary;
    case "shopping":
      return "#4ade80";
    case "pending":
      return UI.slate400;
    default:
      return UI.white;
  }
}

function iconBg(kind?: Tx["kind"]) {
  switch (kind) {
    case "movie":
      return "rgba(251,113,133,0.14)";
    case "topup":
      return "rgba(19,91,236,0.16)";
    case "coffee":
      return "rgba(249,115,22,0.14)";
    case "payment":
      return "rgba(19,91,236,0.14)";
    case "shopping":
      return "rgba(74,222,128,0.14)";
    case "pending":
      return "rgba(148,163,184,0.12)";
    default:
      return "rgba(255,255,255,0.06)";
  }
}




export default function TransactionHistoryScreen() {
  const nav = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const { state, refresh, getTransactions } = useApp();

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" || width >= 860;

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<Chip>("all");
  const [page, setPage] = useState(1);

  const PER_PAGE = 50;

  // entrance animation
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  useEffect(() => {
    if (isFocused) loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const mapStoredToTx = useCallback((stored: any[]): Tx[] => {
    const mapped: Tx[] = (stored || []).map((t: any) => {
      const type = String(t.type ?? "").toLowerCase();
      const rawAmount = Number(t.amount ?? 0);

      const signed =
        type === "send"
          ? -Math.abs(rawAmount)
          : type === "receive" || type === "topup"
          ? Math.abs(rawAmount)
          : rawAmount;

      const createdAt = t.createdAt ? String(t.createdAt) : undefined;
      const date = createdAt ? new Date(createdAt).toISOString().split("T")[0] : undefined;

      const timeLabel = createdAt
        ? new Date(createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
        : undefined;

      const status: TxStatus =
        (t.status as TxStatus) ??
        (type === "send" ? "sent" : type === "receive" || type === "topup" ? "received" : "pending");

      const title =
        t.title ??
        t.counterparty ??
        (type === "topup" ? "Top Up from Bank" : type === "send" ? "Transfer" : type === "receive" ? "Payment" : "Transaction");

      const subtitleBase =
        t.subtitle ??
        (type === "topup"
          ? `${t.bankName ?? t.source ?? "Chase Bank"}`
          : t.note
          ? `${t.note}`
          : type === "send"
          ? "Transfer"
          : "Payment");

      const subtitle = timeLabel ? `${subtitleBase} • ${timeLabel}` : subtitleBase;

      const kind: Tx["kind"] = t.kind ?? inferKind(title);

      return {
        id: String(t.id),
        title,
        subtitle,
        amount: signed,
        status,
        date,
        createdAt,
        avatarUri: t.avatarUri ?? undefined,
        kind,
      };
    });

    mapped.sort((a, b) => isoDay(b.date).localeCompare(isoDay(a.date)));
    return mapped;
  }, []);

  const loadInitial = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();

      if (!state.user) {
        nav.navigate("Login");
        setTransactions([]);
        setPage(1);
        return;
      }

      const stored = getTransactions();
      setTransactions(mapStoredToTx(stored as any[]));
      setPage(1);
    } catch (e) {
      console.warn("Transaction history load failed:", e);
      await notifyLocal("Error", "Could not load transactions (demo).");
    } finally {
      setRefreshing(false);
    }
  }, [refresh, state.user, nav, getTransactions, mapStoredToTx]);

  const onRefresh = useCallback(async () => loadInitial(), [loadInitial]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = transactions.slice();

    if (chip === "income") arr = arr.filter((t) => t.amount > 0 && t.status !== "pending");
    if (chip === "expense") arr = arr.filter((t) => t.amount < 0 && t.status !== "pending");
    if (chip === "pending") arr = arr.filter((t) => t.status === "pending");

    if (q) {
      arr = arr.filter((t) => {
        const blob = `${t.title ?? ""} ${t.subtitle ?? ""} ${t.amount ?? ""}`.toLowerCase();
        return blob.includes(q);
      });
    }

    return arr;
  }, [transactions, chip, query]);

  const paged = useMemo(() => filtered.slice(0, page * PER_PAGE), [filtered, page]);

  type Row = { type: "header"; id: string; label: string } | { type: "tx"; id: string; tx: Tx };

  const rows: Row[] = useMemo(() => {
    const byDate = new Map<string, Tx[]>();
    paged.forEach((t) => {
      const key = t.date ?? "unknown";
      byDate.set(key, [...(byDate.get(key) ?? []), t]);
    });

    const keys = Array.from(byDate.keys()).sort((a, b) => isoDay(b).localeCompare(isoDay(a)));

    const out: Row[] = [];
    keys.forEach((k) => {
      out.push({ type: "header", id: `h_${k}`, label: getSectionLabel(k) });
      (byDate.get(k) ?? []).forEach((tx) => out.push({ type: "tx", id: tx.id, tx }));
    });

    return out;
  }, [paged]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (paged.length >= filtered.length) return;
    setLoadingMore(true);
    await new Promise((r) => setTimeout(r, 260));
    setPage((p) => p + 1);
    setLoadingMore(false);
  }, [loadingMore, paged.length, filtered.length]);

  const topSpacer = Platform.OS === "android" ? (StatusBar.currentHeight ?? 12) : 12;

  const renderRow = useCallback(
    ({ item }: { item: Row }) => {
      if (item.type === "header") {
        return (
          <View style={styles.sectionHeader}>
            <AppText variant="caption" style={styles.sectionHeaderText}>
              {item.label}
            </AppText>
          </View>
        );
      }

      const tx = item.tx;
      const isIncome = tx.amount > 0 && tx.status !== "pending";
      const isPending = tx.status === "pending";

      const icon = iconName(tx.kind);
      const bg = iconBg(tx.kind);
      const fg = iconColor(tx.kind);

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.row, isPending && { opacity: 0.88 }]}
          onPress={() => notifyLocal("Details", "Transaction details are coming soon.")}
        >
          {/* Left bubble / avatar */}
          <View style={styles.leftCol}>
            {tx.avatarUri ? (
              <View style={styles.avatarWrap}>
                <Image source={{ uri: tx.avatarUri }} style={styles.avatarImg} />
                <View style={styles.avatarBadgeOuter}>
                  <View style={styles.avatarBadgeInner}>
                    <MaterialIcons name="arrow-outward" size={12} color={UI.slate400} />
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.bubble, { backgroundColor: bg }]}>
                {icon.lib === "material" ? (
                  <MaterialIcons name={icon.name as any} size={22} color={fg} />
                ) : (
                  <MaterialCommunityIcons name={icon.name as any} size={22} color={fg} />
                )}
              </View>
            )}
          </View>

          {/* Middle text */}
          <View style={styles.midCol}>
            <View style={styles.titleRow}>
              <AppText variant="body" style={styles.titleText} numberOfLines={1 as any}>
                {tx.title}
              </AppText>

              {tx.status === "pending" ? (
                <View style={styles.pendingPill}>
                  <AppText variant="caption" style={styles.pendingPillText}>
                    Pending
                  </AppText>
                </View>
              ) : null}
            </View>

            <AppText variant="caption" style={styles.subText} numberOfLines={1 as any}>
              {tx.subtitle ?? ""}
            </AppText>
          </View>

          {/* Right amount */}
          <View style={styles.rightCol}>
            <AppText variant="body" style={[styles.amountText, isIncome && styles.amountIncome, isPending && styles.amountPending]}>
              {tx.amount < 0 ? "-" : "+"} {formatCurrency(Math.abs(tx.amount))}
            </AppText>
          </View>
        </TouchableOpacity>
      );
    },
    [nav]
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={UI.bg} />

      {/* Sticky header group */}
      <View style={[styles.stickyHeader, { paddingTop: topSpacer }]}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBtn} onPress={() => nav.goBack()} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios-new" size={22} color={UI.white} />
          </TouchableOpacity>

          <AppText variant="h2" style={styles.navTitle}>
            History
          </AppText>

          <TouchableOpacity
            style={styles.navBtn}
            accessibilityRole="button"
            onPress={() => notifyLocal("Filters", "Add a filter modal here if you want.")}
          >
            <MaterialIcons name="tune" size={24} color={UI.primary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={"rgba(148,163,184,0.9)"} />
            <TextInput
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setPage(1);
              }}
              placeholder="Search transactions..."
              placeholderTextColor={"rgba(148,163,184,0.75)"}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Chips */}
        <View style={styles.chipsRow}>
          {[
            { key: "all" as const, label: "All" },
            { key: "income" as const, label: "Income" },
            { key: "expense" as const, label: "Expense" },
            { key: "pending" as const, label: "Pending" },
          ].map((c) => {
            const active = chip === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  setChip(c.key);
                  setPage(1);
                }}
                activeOpacity={0.9}
                accessibilityRole="button"
              >
                <AppText variant="caption" style={active ? styles.chipTextActive : styles.chipTextOutline}>
                  {c.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
        ]}
      >
        {refreshing && transactions.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={UI.primary} />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.center}>
            <AppText variant="h2">No transactions</AppText>
            <AppText variant="caption" style={{ marginTop: 8, color: "rgba(148,163,184,0.8)" }}>
              Try another search or filter.
            </AppText>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(r) => r.id}
            renderItem={renderRow}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.primary} />}
            stickyHeaderIndices={rows.map((r, i) => (r.type === "header" ? i : -1)).filter((i) => i >= 0)}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            ListFooterComponent={
              paged.length >= filtered.length ? (
                <View style={styles.footer}>
                  <AppText variant="caption" style={styles.footerText}>
                    No more transactions
                  </AppText>
                </View>
              ) : loadingMore ? (
                <ActivityIndicator style={{ margin: 16 }} color={UI.primary} />
              ) : (
                <View style={{ height: 16 }} />
              )
            }
            // ✅ important: pad so list doesn't hide behind bottom bar
            contentContainerStyle={{ paddingBottom: isDesktop ? 140 : 100 }}
          />
        )}
      </Animated.View>

    </SafeAreaView>
  );
}

// ----- styles -----
const NAV_H = 72;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI.bg },

  stickyHeader: {
    backgroundColor: UI.bg,
    borderBottomWidth: 1,
    borderBottomColor: UI.border,
  },

  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    color: UI.white,
    fontWeight: "900",
  },

  searchWrap: { paddingHorizontal: 14, paddingBottom: 10 },
  searchBar: {
    height: 46,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: UI.white,
    fontSize: 16,
    fontWeight: "700",
  },

  chipsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  chip: {
    height: 40,
    borderRadius: 999,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  chipActive: {
    backgroundColor: UI.primary,
    borderColor: UI.primary,
    shadowColor: UI.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  chipTextActive: { color: UI.white, fontWeight: "900" },
  chipTextOutline: { color: "rgba(226,232,240,0.82)", fontWeight: "800" },

  content: { flex: 1 },

  sectionHeader: {
    backgroundColor: UI.bg,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionHeaderText: {
    color: "rgba(148,163,184,0.65)",
    fontWeight: "900",
    letterSpacing: 1,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 16,
  },

  leftCol: { width: 56, alignItems: "flex-start", justifyContent: "center" },

  bubble: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarBadgeOuter: {
    position: "absolute",
    right: -2,
    bottom: -2,
    padding: 2,
    borderRadius: 999,
    backgroundColor: UI.bg,
  },
  avatarBadgeInner: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  midCol: { flex: 1, paddingRight: 10, minWidth: 0 },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  titleText: { color: UI.white, fontWeight: "900", flex: 1 },

  subText: { marginTop: 4, color: "rgba(148,163,184,0.9)", fontWeight: "700" },

  pendingPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(234,179,8,0.12)",
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.22)",
  },
  pendingPillText: { color: "rgba(234,179,8,0.95)", fontWeight: "900" },

  rightCol: { alignItems: "flex-end", justifyContent: "center" },

  amountText: { color: UI.white, fontWeight: "900" },
  amountIncome: { color: UI.primary },
  amountPending: { color: "rgba(148,163,184,0.85)" },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 14,
  },

  center: { padding: 32, alignItems: "center", justifyContent: "center" },

  footer: { paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  footerText: { color: "rgba(148,163,184,0.5)", fontWeight: "700" },

  // ===== Desktop Bottom Bar (Dashboard copy) =====
  desktopWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 22 : 18,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  desktopNav: {
    width: "100%",
    maxWidth: 760,
    height: NAV_H,
    borderRadius: 999,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(25,34,51,0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  desktopItem: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopItemActive: {
    width: 64,
    height: 60,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopFab: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -26,
    shadowColor: UI.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    overflow: "hidden",
  },
  desktopFabGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
