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
  Alert,
  StatusBar,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";

import { TopHeader, TransactionListItem, Input, AppText, BottomNav, Button } from "../components";
import { colors, spacing, radius } from "../components/tokens";

import { useApp } from "../context/AppContext";

type Nav = {
  navigate: (route: string, params?: any) => void;
};

type Tx = {
  id: string;
  title: string;
  subtitle?: string;
  amount: string;
  status?: "sent" | "received" | "pending" | "failed";
  date?: string; // ISO or friendly
  memo?: string;
  avatarUri?: string;
};

export default function TransactionHistoryScreen() {
  const nav = useNavigation<Nav>();
  const isFocused = useIsFocused();

  const { state, refresh, getTransactions } = useApp();

  // UI state
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [displayed, setDisplayed] = useState<Tx[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "received" | "pending" | "failed">("all");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  // subtle entrance animation
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [anim]);

  // initial load & refresh on focus
  useEffect(() => {
    if (isFocused) loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const mapStoredToTx = useCallback((stored: any[]): Tx[] => {
    const mapped: Tx[] = (stored || []).map((t: any) => {
      const isSend = t.type === "send";
      const amountStr = `${isSend ? "-" : "+"}${Number(t.amount).toFixed(2)}`;
      // friendly date (YYYY-MM-DD) or fallback to createdAt ISO slice
      const dateFriendly = t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : undefined;
      return {
        id: String(t.id),
        title: t.counterparty ?? (t.type === "send" ? "Sent" : "Received"),
        subtitle: t.note ?? "",
        amount: amountStr,
        status: (t.status as Tx["status"]) ?? (isSend ? "sent" : "received"),
        date: dateFriendly,
        memo: t.note ?? undefined,
      };
    });

    // newest first by date string if present, otherwise keep order
    mapped.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    return mapped;
  }, []);

  const loadInitial = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh context (this will re-read storage and update context.state)
      await refresh();

      // After refresh, synchronously read transactions via getTransactions()
      const stored = getTransactions(); // storage Transaction[] from context
      // If there's no user in context, redirect to Login
      if (!state.user) {
        nav.navigate("Login");
        setTransactions([]);
        setDisplayed([]);
        setPage(1);
        return;
      }

      const mapped = mapStoredToTx(stored as any[]);
      setTransactions(mapped);
      setPage(1);
    } catch (e) {
      console.warn("loadInitial transaction history failed:", e);
      Alert.alert("Error", "Could not load transactions (demo).");
    } finally {
      setRefreshing(false);
    }
  }, [refresh, getTransactions, state.user, nav, mapStoredToTx]);

  const onRefresh = useCallback(async () => {
    await loadInitial();
  }, [loadInitial]);

  // filtering & searching — re-run when dependencies change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, query, filter, startDate, endDate, page]);

  function applyFilters() {
    const q = query.trim().toLowerCase();
    let result = transactions.slice();

    if (filter !== "all") {
      result = result.filter((t) => t.status === filter);
    }

    if (startDate) {
      result = result.filter((t) => (t.date ?? "") >= startDate);
    }
    if (endDate) {
      result = result.filter((t) => (t.date ?? "") <= endDate);
    }

    if (q) {
      result = result.filter(
        (t) =>
          (t.title ?? "").toLowerCase().includes(q) ||
          (t.subtitle ?? "").toLowerCase().includes(q) ||
          (t.memo ?? "").toLowerCase().includes(q) ||
          (t.amount ?? "").toLowerCase().includes(q)
      );
    }

    setDisplayed(result.slice(0, perPage * page));
  }

  // load more (pagination)
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (displayed.length >= transactions.length) return; // all loaded
    setLoadingMore(true);
    // small simulated delay for UX
    await new Promise((r) => setTimeout(r, 500));
    setPage((p) => p + 1);
    setLoadingMore(false);
  }, [loadingMore, displayed.length, transactions.length]);

  // select date helper (simple prompt fallback)
  async function pickDate(which: "start" | "end") {
    if (Platform.OS === "ios" && (Alert as any).prompt) {
      // @ts-ignore
      (Alert as any).prompt(
        `Select ${which} date`,
        `Enter date in YYYY-MM-DD format`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "OK",
            onPress: (val: string) => {
              if (which === "start") setStartDate(val || null);
              else setEndDate(val || null);
            },
          },
        ],
        "plain-text"
      );
      return;
    }

    Alert.alert(
      `Select ${which} date`,
      "Date picker not available in demo. Use app UI or implement RN DateTimePicker for production.",
      [{ text: "OK" }]
    );
  }

  // clear filters
  function resetFilters() {
    setQuery("");
    setFilter("all");
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  }

  const renderItem = useCallback(
    ({ item }: { item: Tx }) => (
      <TransactionListItem
        title={item.title}
        subtitle={item.subtitle}
        amount={item.amount}
        status={item.status}
        onPress={() => nav.navigate("TransactionDetail", { id: item.id })}
      />
    ),
    [nav]
  );

  const statusCount = useMemo(() => {
    const counts: Record<string, number> = { all: transactions.length, sent: 0, received: 0, pending: 0, failed: 0 };
    transactions.forEach((t) => {
      if (t.status && counts[t.status] !== undefined) counts[t.status] += 1;
    });
    return counts;
  }, [transactions]);

  // small top spacer amount — use StatusBar.currentHeight on Android for safe offset
  const topSpacer = Platform.OS === "android" ? (StatusBar.currentHeight ?? 12) : 12;

  return (
    <SafeAreaView style={styles.root}>
      {/* push the header down a bit so it doesn't overlap the status bar */}
      <View style={{ paddingTop: topSpacer, backgroundColor: "transparent" }}>
        <TopHeader title="Transactions" right={<AppText variant="caption" style={{ color: colors.primary }}>Filter</AppText>} />
      </View>

      <Animated.View style={[styles.container, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
        <View style={styles.searchRow}>
          <Input placeholder="Search transactions, merchants, amounts..." value={query} onChangeText={setQuery} />
          <TouchableOpacity style={styles.filterBtn} onPress={() => Alert.alert("Filters", "Use UI controls below to filter.")} accessibilityRole="button">
            <AppText variant="button" style={{ color: colors.primary }}>⚙️</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {(["all", "sent", "received", "pending", "failed"] as const).map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.filterChip, filter === k && styles.filterChipActive]}
              onPress={() => {
                setFilter(k);
                setPage(1);
              }}
              accessibilityRole="button"
            >
              <AppText variant="caption" style={filter === k ? { color: "#fff" } : { color: colors.textPrimary }}>
                {k === "all" ? `All (${statusCount.all})` : `${k.charAt(0).toUpperCase() + k.slice(1)} (${(statusCount as any)[k] ?? 0})`}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => pickDate("start")} style={styles.dateBtn} accessibilityRole="button">
            <AppText variant="caption">{startDate ? `From: ${startDate}` : "From"}</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickDate("end")} style={styles.dateBtn} accessibilityRole="button">
            <AppText variant="caption">{endDate ? `To: ${endDate}` : "To"}</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetFilters} style={styles.resetBtn} accessibilityRole="button">
            <AppText variant="caption" style={{ color: colors.primary }}>Reset</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.listWrap}>
          {refreshing && transactions.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : displayed.length === 0 ? (
            <View style={styles.empty}>
              <AppText variant="h2">No transactions</AppText>
              <AppText variant="caption" style={{ marginTop: 8, color: colors.textSecondary }}>
                Try adjusting your filters or come back later.
              </AppText>
              <Button title="Reload" variant="secondary" onPress={loadInitial} style={{ marginTop: spacing.md }} />
            </View>
          ) : (
            <FlatList
              data={displayed}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              onEndReached={loadMore}
              onEndReachedThreshold={0.4}
              ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={colors.primary} /> : null}
            />
          )}
        </View>
      </Animated.View>

      <BottomNav
        items={[
          { key: "home", label: "Home" },
          { key: "wallet", label: "Wallet" },
          { key: "scan", label: "Scan" },
          { key: "activity", label: "Activity" },
          { key: "profile", label: "Profile" },
        ]}
        activeKey="activity"
        onNavigate={(k) => {
          if (k === "home") nav.navigate("Dashboard");
          else if (k === "wallet") nav.navigate("Wallet");
          else if (k === "scan") nav.navigate("Scanner");
          else if (k === "profile") nav.navigate("Profile");
          else nav.navigate("History");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.md },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterBtn: { marginLeft: 8, padding: 8, borderRadius: radius.sm, backgroundColor: colors.surface },
  filterRow: { flexDirection: "row", marginTop: spacing.sm, flexWrap: "wrap", gap: 8 },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginTop: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, gap: 8 },
  dateBtn: { flex: 1, padding: 10, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  resetBtn: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 10 },
  listWrap: { flex: 1, marginTop: spacing.md },
  center: { alignItems: "center", justifyContent: "center", padding: 32 },
  empty: { alignItems: "center", justifyContent: "center", padding: 32 },
});
