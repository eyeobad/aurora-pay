// src/screens/PayBillsScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  TextInput,
  Dimensions,
  Platform,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import FloatingNavBar, { FloatingNavItem } from "../components/organisms/FloatingNavBar";
import { useNavigation } from "@react-navigation/native";

const { width: SCREEN_W } = Dimensions.get("window");
const MAX_W = 420;
const CONTAINER_W = Math.min(SCREEN_W, MAX_W);

const PRIMARY = "#135bec";
const BG_DARK = "#101622";
const SURFACE_DARK = "#1c2433";
const RING_DARK = "rgba(255,255,255,0.06)";

type IconPack = "mi" | "mci";

type Nav = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

const Icon = ({
  pack,
  name,
  size = 24,
  color = "#fff",
}: {
  pack: IconPack;
  name: any;
  size?: number;
  color?: string;
}) => {
  const Comp = pack === "mi" ? MaterialIcons : MaterialCommunityIcons;
  return <Comp name={name} size={size} color={color} />;
};

const NAV_H = 72;

export default function PayBillsScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => [
      { id: "1", label: "Electric", icon: { pack: "mi" as IconPack, name: "bolt" }, kind: "primary" },
      { id: "2", label: "Internet", icon: { pack: "mi" as IconPack, name: "wifi" }, kind: "primary" },
      { id: "3", label: "Water", icon: { pack: "mi" as IconPack, name: "water-drop" }, kind: "primary" },
      { id: "4", label: "TV", icon: { pack: "mi" as IconPack, name: "tv" }, kind: "primary" },
      { id: "5", label: "Mobile", icon: { pack: "mi" as IconPack, name: "smartphone" }, kind: "primary" },
      { id: "6", label: "More", icon: { pack: "mi" as IconPack, name: "grid-view" }, kind: "muted" },
    ],
    []
  );

  const savedBillers = useMemo(
    () => [
      {
        id: "s1",
        name: "Spectrum",
        sub: "Due: $89.99",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxvxdCMaoDPJV95Vj89V7OsXFB9XyC27uaV8QtoPkYy3jMcahBZsloh5N39s81xpQ44KedIa-9MkcEdCJqwXiVRzWcXwVVz0WjjlDpr61Ilq1rK7V-WKKjkpZFisTbnlY8FKKOmA4HizYIYBs0MEx0HehG9AyVhM1Vy6gyNd2kExBhOe2Nf1i23ugGcMuJalhWLFQ4W7qgpLBQT8HmK_bXG-0T8RcQw4AEI7xsW9UZ9OcS5vfl9weRgvcabZxMWKlhN95ZvSRDXk2I",
        badge: true,
        badgeColor: "#ef4444",
        ringOnBadge: SURFACE_DARK,
        iconBg: "rgba(59,130,246,0.18)",
      },
      {
        id: "s2",
        name: "City Water",
        sub: "Paid Oct 15",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCo_RLjIcyP2SZNW9MFZkCz1TRwZCVmGO9MneqwPOjaf28-0fMOISkPXAUOUzvBuTEYJufCBEvUuHNl0ZcNbHZ961fABor7y_Xr6vkiFx1OIZqkdY0FE15sXSfSmLA8BcOUc13Qb0DGgyVRAlSRj5b4_lD1jH6ZgxTKY6l3G0Vm9Jz8OSsJFmrWADFbsnsTOP2EJP4JKnZ_zAkYcoHewBnKB3__SjA20jUjXv3RVgqjhB8hTRUkI6e97UUmSGB2nIdF2ue3aViN560a",
        badge: false,
        iconBg: "rgba(34,197,94,0.18)",
      },
      {
        id: "s3",
        name: "Netflix",
        sub: "Auto-pay on",
        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUJvVhC9jFc5lJWzWk6ktAARU3mstBtWfbSQRZCs2TuLwGiqiKkmzCndNCnD-x1g0U8bFc-1cssyG4Y6yxU1NolDDmqQ-86ndLZjRElunaKkMkNIE1obiq2AgbDOu-YZtRSx82wkVxNVQkS_P2d3IyvkGbSGZBI5JrxdXk9uQkDOXdNvCfg6g5ozpTQfOcWJApNi9RMhN6umSixY7632f9YiXg5a25alv9BldtJdIm3gqGsHLJ08CouUwPNMLOcgKZjNzww2D62VsQ",
        badge: false,
        iconBg: "rgba(168,85,247,0.18)",
      },
    ],
    []
  );

  const popular = useMemo(
    () => [
      {
        id: "p1",
        title: "PG&E Electric",
        subtitle: "Electricity • California",
        icon: { pack: "mci" as IconPack, name: "flash-outline" },
        iconColor: "rgba(148,163,184,0.9)",
        iconBg: "rgba(255,255,255,0.06)",
      },
      {
        id: "p2",
        title: "AT&T Fiber",
        subtitle: "Internet • Nationwide",
        icon: { pack: "mci" as IconPack, name: "router-wireless" },
        iconColor: "#3b82f6",
        iconBg: "rgba(59,130,246,0.12)",
      },
      {
        id: "p3",
        title: "Verizon Wireless",
        subtitle: "Mobile • Nationwide",
        icon: { pack: "mci" as IconPack, name: "cellphone-tower" },
        iconColor: "#ef4444",
        iconBg: "rgba(239,68,68,0.12)",
      },
      {
        id: "p4",
        title: "SoCal Gas",
        subtitle: "Gas • California",
        icon: { pack: "mci" as IconPack, name: "gas-cylinder" },
        iconColor: "#f97316",
        iconBg: "rgba(249,115,22,0.12)",
      },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <View style={styles.shell}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.85} style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios-new" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Pay Bills</Text>

          <TouchableOpacity activeOpacity={0.85} style={styles.headerBtn} onPress={() => navigation.navigate("History")}>
            <MaterialIcons name="history" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ✅ give extra bottom space for floating bar */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: NAV_H + 64 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headlineWrap}>
            <Text style={styles.headline}>Who are you paying today?</Text>
          </View>

          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <View style={styles.searchIcon}>
                <MaterialIcons name="search" size={22} color="#94A3B8" />
              </View>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search billers (e.g., Comcast)"
                placeholderTextColor={Platform.OS === "ios" ? "#64748B" : "#6B7280"}
                style={styles.searchInput}
              />
            </View>
          </View>

          <View style={styles.catsWrap}>
            <FlatList
              data={categories}
              horizontal
              keyExtractor={(x) => x.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 18 }}
              ItemSeparatorComponent={() => <View style={{ width: 24 }} />}
              renderItem={({ item }) => {
                const primaryKind = item.kind === "primary";
                const bg = primaryKind ? "rgba(19,91,236,0.20)" : "rgba(255,255,255,0.06)";
                const fg = primaryKind ? PRIMARY : "#94A3B8";
                return (
                  <TouchableOpacity activeOpacity={0.85} style={styles.catBtn}>
                    <View style={[styles.catCircle, { backgroundColor: bg }]}>
                      <Icon pack={item.icon.pack} name={item.icon.name} size={28} color={fg} />
                    </View>
                    <Text style={styles.catLabel}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Saved Billers</Text>
            <TouchableOpacity activeOpacity={0.85}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.savedWrap}>
            <FlatList
              data={savedBillers}
              horizontal
              keyExtractor={(x) => x.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 18 }}
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.9} style={styles.savedCard}>
                  {item.badge ? (
                    <View
                      style={[
                        styles.savedBadge,
                        { backgroundColor: item.badgeColor, borderColor: item.ringOnBadge || SURFACE_DARK },
                      ]}
                    />
                  ) : null}

                  <View style={[styles.savedLogoWrap, { backgroundColor: item.iconBg }]}>
                    <Image source={{ uri: item.logo }} style={styles.savedLogo} />
                  </View>

                  <View style={{ alignItems: "center" }}>
                    <Text numberOfLines={1} style={styles.savedName}>
                      {item.name}
                    </Text>
                    <Text style={styles.savedSub}>{item.sub}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* ✅ FIXED Popular Billers layout + chevron spacing */}
          <View style={styles.popularWrap}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Popular Billers</Text>

            <View style={{ gap: 10 }}>
              {popular.map((p) => (
                <TouchableOpacity key={p.id} activeOpacity={0.85} style={styles.popRow}>
                  <View style={styles.popLeft}>
                    <View style={[styles.popIconWrap, { backgroundColor: p.iconBg }]}>
                      <Icon pack={p.icon.pack} name={p.icon.name} size={22} color={p.iconColor} />
                    </View>

                    <View style={styles.popTextWrap}>
                      <Text style={styles.popTitle}>{p.title}</Text>
                      <Text style={styles.popSubtitle}>{p.subtitle}</Text>
                    </View>
                  </View>

                  <View style={styles.chevWrap}>
                    <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity activeOpacity={0.85} style={styles.seeAllBillersBtn}>
              <Text style={styles.seeAllBillersText}>See All Billers</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ✅ Floating nav (same as Dashboard style) */}
        <FloatingNavBar
          activeKey="pay"
          primary={PRIMARY}
          background="rgba(25,34,51,0.92)"
          fab={{
            icon: "qrcode-scan",
            pack: "mci",
            onPress: () => navigation.navigate("Scanner"),
          }}
          items={[
            { key: "home", icon: "home", pack: "mi", onPress: () => navigation.navigate("Dashboard") } as FloatingNavItem,
            // ✅ match your screenshot: Pay uses "payments" icon
            { key: "pay", icon: "credit-card", pack: "mi", onPress: () => navigation.navigate("PayBills") } as FloatingNavItem,
            { key: "cards", icon: "history", pack: "mci", onPress: () => navigation.navigate("MyCards") } as FloatingNavItem,
            { key: "profile", icon: "settings", pack: "mi", onPress: () => navigation.navigate("Settings") } as FloatingNavItem,
          ]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG_DARK },
  shell: {
    flex: 1,
    backgroundColor: BG_DARK,
    width: "100%",
    maxWidth: MAX_W,
    alignSelf: "center",
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(16,22,34,0.80)",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  headlineWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  headline: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    lineHeight: 34,
  },

  searchWrap: { paddingHorizontal: 20, marginBottom: 18 },
  searchBar: {
    height: 56,
    borderRadius: 999,
    backgroundColor: SURFACE_DARK,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 14,
    borderWidth: 1,
    borderColor: RING_DARK,
  },
  searchIcon: { width: 32, alignItems: "center", justifyContent: "center" },
  searchInput: {
    flex: 1,
    height: "100%",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    paddingLeft: 8,
  },

  catsWrap: { paddingLeft: 20, paddingBottom: 18 },
  catBtn: { alignItems: "center", gap: 8 },
  catCircle: {
    width: 68,
    height: 68,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: { fontSize: 14, fontWeight: "800", color: "#CBD5E1" },

  sectionRow: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#FFFFFF" },
  editText: { fontSize: 14, fontWeight: "900", color: PRIMARY },

  savedWrap: { paddingLeft: 20, paddingBottom: 18 },
  savedCard: {
    width: 144,
    padding: 16,
    borderRadius: 14,
    backgroundColor: SURFACE_DARK,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    gap: 12,
  },
  savedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 99,
    borderWidth: 2,
  },
  savedLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  savedLogo: { width: "100%", height: "100%" },
  savedName: { width: 112, textAlign: "center", fontSize: 14, fontWeight: "900", color: "#FFFFFF" },
  savedSub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#94A3B8" },

  popularWrap: { paddingHorizontal: 20, paddingTop: 6 },

  // ✅ fixed row layout (matches HTML)
  popRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.00)",
  },
  popLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
    paddingRight: 10,
  },
  popIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  popTextWrap: {
    flex: 1,
    gap: 2,
  },
  chevWrap: {
    width: 28,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  popTitle: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
  popSubtitle: { fontSize: 12, fontWeight: "700", color: "#94A3B8" },

  seeAllBillersBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(19,91,236,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  seeAllBillersText: { fontSize: 14, fontWeight: "900", color: PRIMARY },
});
