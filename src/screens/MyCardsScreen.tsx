// src/screens/MyCardsScreen.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";

const { width: SCREEN_W } = Dimensions.get("window");
const MAX_W = 420; // mimic max-w-md
const CONTAINER_W = Math.min(SCREEN_W, MAX_W);
const H_PADDING = 20;
const CARD_W = Math.round((CONTAINER_W - H_PADDING * 2) * 0.85);
const CARD_H = Math.round(CARD_W / 1.586);

const BG_DARK = "#101622";
const SURFACE_DARK = "#1E2430";
const PRIMARY = "#135bec";

type CardItem = { type: "visa" | "mastercard" | "add"; last4?: string; holder?: string; exp?: string };

type TxnItem = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  amountColor: string;
  icon: { pack: "mi" | "mci"; name: string; color: string };
};

export default function MyCardsScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);

  const userName = state.user?.name ?? "Alex Morgan";
  const balance = state.balance ?? 14250;

  const cards = useMemo<CardItem[]>(
    () => [
      { type: "visa", last4: "4291", holder: userName, exp: "09/28" },
      { type: "mastercard", last4: "8832", holder: userName, exp: "12/26" },
      { type: "add" },
    ],
    [userName],
  );

  const fallbackTxns: TxnItem[] = [
    {
      id: "1",
      title: "Uber Ride",
      subtitle: "Today, 10:42 AM",
      amount: "-$24.50",
      amountColor: "#FFFFFF",
      icon: { pack: "mi", name: "local-taxi", color: "rgba(255,255,255,0.8)" },
    },
    {
      id: "2",
      title: "Apple Store",
      subtitle: "Yesterday, 4:20 PM",
      amount: "-$1,299.00",
      amountColor: "#FFFFFF",
      icon: { pack: "mi", name: "shopping-bag", color: "rgba(255,255,255,0.8)" },
    },
    {
      id: "3",
      title: "Top Up",
      subtitle: "Oct 24, 9:00 AM",
      amount: "+$500.00",
      amountColor: "#34D399",
      icon: { pack: "mi", name: "arrow-downward", color: "#34D399" },
    },
    {
      id: "4",
      title: "Netflix",
      subtitle: "Oct 21, 11:00 AM",
      amount: "-$15.99",
      amountColor: "#FFFFFF",
      icon: { pack: "mi", name: "movie", color: "rgba(255,255,255,0.8)" },
    },
  ];

  const txns = useMemo<TxnItem[]>(() => {
    if (state.transactions.length === 0) return fallbackTxns;
    return state.transactions.slice(0, 10).map((t) => {
      const isDebit = t.type === "send";
      const sign = isDebit ? "-" : "+";
      const amountStr = `${sign}$${Number(t.amount).toFixed(2)}`;
      const amountColor = isDebit ? "#FFFFFF" : "#34D399";
      return {
        id: t.id,
        title: t.counterparty ?? t.type,
        subtitle: new Date(t.createdAt).toLocaleString(),
        amount: amountStr,
        amountColor,
        icon: { pack: "mi", name: isDebit ? "shopping-bag" : "arrow-downward", color: amountColor },
      };
    });
  }, [state.transactions]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderCard = ({ item }: { item: CardItem }) => {
    if (item.type === "add") {
      return (
        <View style={[styles.cardBase, styles.addCard]}>
          <MaterialCommunityIcons name="credit-card-plus-outline" size={32} color="#64748B" />
          <Text style={styles.addCardText}>Add new card</Text>
        </View>
      );
    }

    if (item.type === "visa") {
      return (
        <View style={[styles.cardBase, styles.cardShadow]}>
          <LinearGradient
            colors={["#135bec", "#3b82f6", "#0a2e7a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardOverlay} />

          <View style={styles.cardInner}>
            <View style={styles.cardTopRow}>
              <LinearGradient
                colors={["#FEF08A", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chip}
              />
              <Text style={styles.brandVisa}>VISA</Text>
            </View>

            <View style={{ gap: 14 }}>
              <Text style={styles.cardNumber}>•••• •••• •••• {item.last4}</Text>

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.cardLabel}>Card Holder</Text>
                  <Text style={styles.cardValue}>{item.holder?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={[styles.cardLabel, { textAlign: "right" }]}>Expires</Text>
                  <Text style={[styles.cardValue, { textAlign: "right" }]}>{item.exp}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.cardBase, styles.cardShadow]}>
        <LinearGradient
          colors={["#1f2937", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cardOverlayRadial} />

        <View style={styles.cardInner}>
          <View style={styles.cardTopRow}>
            <LinearGradient
              colors={["#D1D5DB", "#6B7280"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.chip, { opacity: 0.85 }]}
            />
            <Text style={styles.brandMaster}>mastercard</Text>
          </View>

          <View style={{ gap: 14 }}>
            <Text style={[styles.cardNumber, { opacity: 0.9 }]}>•••• •••• •••• {item.last4}</Text>

            <View style={styles.cardBottomRow}>
              <View>
                <Text style={[styles.cardLabel, { color: "rgba(255,255,255,0.35)" }]}>Card Holder</Text>
                <Text style={[styles.cardValue, { color: "rgba(255,255,255,0.75)" }]}>
                  {item.holder?.toUpperCase()}
                </Text>
              </View>
              <View>
                <Text
                  style={[styles.cardLabel, { color: "rgba(255,255,255,0.35)", textAlign: "right" }]}
                >
                  Expires
                </Text>
                <Text style={[styles.cardValue, { color: "rgba(255,255,255,0.75)", textAlign: "right" }]}>
                  {item.exp}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const ActionButton = ({ iconName, label }: { iconName: any; label: string }) => (
    <TouchableOpacity activeOpacity={0.85} style={styles.actionBtn}>
      <View style={styles.actionIconWrap}>
        <MaterialIcons name={iconName} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const TxnIcon = ({ icon }: { icon: TxnItem["icon"] }) => {
    const IconComp = icon.pack === "mi" ? MaterialIcons : MaterialCommunityIcons;
    return <IconComp name={icon.name as any} size={22} color={icon.color} />;
  };

  const renderTxn = ({ item }: { item: TxnItem }) => (
    <TouchableOpacity activeOpacity={0.85} style={styles.txnRow}>
      <View style={styles.txnLeft}>
        <View style={styles.txnIconWrap}>
          <TxnIcon icon={item.icon} />
        </View>
        <View style={{ gap: 2 }}>
          <Text style={styles.txnTitle}>{item.title}</Text>
          <Text style={styles.txnSubtitle}>{item.subtitle}</Text>
        </View>
      </View>

      <Text style={[styles.txnAmount, { color: item.amountColor }]}>{item.amount}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgtXgCs3yhzgdmHKBWimI4Jh0qxhJOa5yV2ANrBdcjfxV4jKMA1c1SSgZExSmClkDgfXZmvvXBFfdmQStAdeolGhCXnwLxYWn-yMTrNsGMCIjZ0aL04tGsirTluXCDMZsCI23n4Vp-nlE33voxbH_FjFVqd-HYKEHh9-JEmHQ9BxQ74l6J9JZeB4T18m6JPzmQQHuz6ephND_ScthBTyQmBSc2Jg179XNGQOejsKRvh_6-V3dNF_giXW5nRZz8B3bM6nAZY20jNpSe",
                }}
                style={styles.avatarImg}
              />
            </View>
            <View>
              <Text style={styles.welcome}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.notifBtn}>
            <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 6 }}>
          <FlatList
            horizontal
            data={cards}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderCard}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + 16}
            decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
            contentContainerStyle={styles.cardsList}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
          />

          <View style={styles.dotsRow}>
            {cards.map((_, i) =>
              i === activeIndex ? <View key={i} style={styles.dotActive} /> : <View key={i} style={styles.dot} />,
            )}
          </View>
        </View>

        <View style={styles.balanceWrap}>
          <Text style={styles.balanceValue}>${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.balanceLabel}>Available Balance</Text>
        </View>

        <View style={styles.actionsWrap}>
          <View style={styles.actionsRow}>
            <ActionButton iconName="ac-unit" label="Freeze" />
            <ActionButton iconName="visibility-off" label="Reveal" />
            <ActionButton iconName="tune" label="Limits" />
            <ActionButton iconName="account-balance-wallet" label="Apple Pay" />
          </View>
        </View>

        <View style={styles.txnSection}>
          <View style={styles.txnHeader}>
            <Text style={styles.txnHeaderTitle}>Recent Activity</Text>
            <TouchableOpacity activeOpacity={0.85}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={txns}
            keyExtractor={(x) => x.id}
            renderItem={renderTxn}
            contentContainerStyle={{ paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.fab}>
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG_DARK },
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
    width: "100%",
    maxWidth: MAX_W,
    alignSelf: "center",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(19,91,236,0.30)",
    backgroundColor: "#0b1220",
  },
  avatarImg: { width: "100%", height: "100%" },
  welcome: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  userName: { fontSize: 14, color: "#FFFFFF", fontWeight: "800", letterSpacing: -0.2 },

  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: SURFACE_DARK,
    alignItems: "center",
    justifyContent: "center",
  },

  cardsList: { paddingHorizontal: 20, paddingBottom: 14 },
  cardBase: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  cardShadow: {
    shadowColor: PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)" },
  cardOverlayRadial: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  cardInner: { flex: 1, padding: 20, justifyContent: "space-between" },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  chip: { width: 40, height: 28, borderRadius: 4, opacity: 0.92 },

  brandVisa: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1.4,
  },
  brandMaster: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1.0,
    textTransform: "lowercase",
  },

  cardNumber: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  cardBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  addCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#334155",
    backgroundColor: "rgba(15,23,42,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addCardText: { color: "#64748B", fontWeight: "700" },

  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 6 },
  dotActive: { height: 6, width: 24, borderRadius: 999, backgroundColor: PRIMARY },
  dot: { height: 6, width: 6, borderRadius: 999, backgroundColor: "#334155" },

  balanceWrap: { alignItems: "center", paddingHorizontal: 16, paddingVertical: 6 },
  balanceValue: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  balanceLabel: { marginTop: 4, color: "#94A3B8", fontSize: 14, fontWeight: "600" },

  actionsWrap: { marginTop: 18, paddingHorizontal: 24 },
  actionsRow: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: { alignItems: "center", width: (CONTAINER_W - 48) / 4 },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: SURFACE_DARK,
    borderWidth: 1,
    borderColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { marginTop: 10, fontSize: 12, fontWeight: "700", color: "#CBD5E1" },

  txnSection: { marginTop: 22, paddingHorizontal: 20, flex: 1 },
  txnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  txnHeaderTitle: { fontSize: 18, fontWeight: "900", color: "#FFFFFF" },
  seeAll: { fontSize: 12, fontWeight: "900", color: PRIMARY },

  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: "rgba(30,36,48,0.0)",
  },
  txnLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  txnIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: SURFACE_DARK,
    borderWidth: 1,
    borderColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  txnTitle: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
  txnSubtitle: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },
  txnAmount: { fontSize: 16, fontWeight: "900" },

  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
