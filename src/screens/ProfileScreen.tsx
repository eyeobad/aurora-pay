// src/screens/ProfileScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  ImageBackground,
  Switch,
  Platform,
  Dimensions,
  Modal,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useApp } from "../context/AppContext";
import { notifyLocal } from "../lib/notifications";


type Nav = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

const COLORS = {
  primary: "#135bec",
  bg: "#101622",
  surface: "#151c2a",
  surface2: "#1b2537",
  ring: "rgba(255,255,255,0.08)",
  ring2: "rgba(255,255,255,0.10)",
  textMuted: "#92a4c9",
  textMuted2: "#637588",
  white: "#ffffff",
  green: "#22c55e",
  purple: "#a855f7",
  red: "#ef4444",
};

const NAV_H = 72;
const { width: SCREEN_W } = Dimensions.get("window");
const MAX_W = 420;
const CONTAINER_W = Math.min(SCREEN_W, MAX_W);

const Icon = ({
  pack,
  name,
  size = 24,
  color = "#fff",
}: {
  pack: "mi" | "mci";
  name: any;
  size?: number;
  color?: string;
}) => {
  const Comp = pack === "mi" ? MaterialIcons : MaterialCommunityIcons;
  return <Comp name={name} size={size} color={color} />;
};

const Row = ({
  icon,
  iconBg,
  iconColor,
  title,
  rightText,
  onPress,
  showChevron = true,
  rightSlot,
  isLast,
}: {
  icon: { pack: "mi" | "mci"; name: any };
  iconBg: string;
  iconColor: string;
  title: string;
  rightText?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightSlot?: React.ReactNode;
  isLast?: boolean;
}) => {
  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container activeOpacity={0.85} onPress={onPress} style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
        <Icon pack={icon.pack} name={icon.name} size={20} color={iconColor} />
      </View>

      <View style={styles.rowTitleWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>

      {rightSlot ? (
        <View style={styles.rowRightWrap}>{rightSlot}</View>
      ) : (
        <View style={styles.rowRightWrap}>
          {rightText ? <Text style={styles.rowRightText}>{rightText}</Text> : null}
          {showChevron ? (
            <View style={styles.chevWrap}>
              <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
            </View>
          ) : null}
        </View>
      )}
    </Container>
  );
};

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const { state, refresh, logout, setBiometricsEnabled, setShowAccountNumber, setShowBalance } = useApp();
  const [qrOpen, setQrOpen] = useState(false);

  const prefs = state.preferences;
  const accountNumber = state.user?.accountNumber ?? "0000000000";
  const maskedAccount = `•••• •••• ${accountNumber.slice(-4)}`;
  const balance = state.balance ?? 0;

  const user = useMemo(
    () => ({
      name: state.user?.name ?? "Alex Morgan",
      handle: state.user?.identifier ? `@${state.user.identifier.split("@")[0]}` : "@aurora",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBgCkzQOjJiaAnheJZs3ffMra-XWbD4UhJeen7RLJVA28abiXYLrXqCchoyLkoxzUDGT8fpYHp6339tBFtGv-UKOhOLbtQRSWW8G7uttIg22u2TtGZeWxhSt7xkPlGMQeMteMc7dr-WTE79IdIQMYFfqrYiZyC9Qn8m9p0V9zBqzhn6gf0b3tiDBegT-OeIZLCbYJroXyfYrNrd66q6_i2NsVOnUx3MNU2AFMYureuKzd_mtLX3BjdjMGohVN4UsLe9nvZo-aMEFtaP",
    }),
    [state.user?.name, state.user?.identifier],
  );

  const formatCurrency = (value: number) => {
    try {
      return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  React.useEffect(() => {
    if (isFocused) refresh().catch(() => {});
  }, [isFocused, refresh]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <View style={styles.shell}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.85} style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios-new" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          <View style={{ width: 40, height: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: NAV_H + 90 }}>
          {/* Profile Header */}
          <View style={styles.profileWrap}>
            <View style={styles.glow} />

            <View style={styles.profileInner}>
              <View style={styles.avatarWrap}>
                <ImageBackground
                  source={{ uri: user.avatar }}
                  style={styles.avatar}
                  imageStyle={styles.avatarImg}
                  resizeMode="cover"
                />
                <TouchableOpacity activeOpacity={0.9} style={styles.avatarEditBtn}>
                  <MaterialIcons name="edit" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: "center" }}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <MaterialIcons name="verified" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.userHandle}>{user.handle}</Text>
              </View>

              <TouchableOpacity activeOpacity={0.9} style={styles.premiumBtn}>
                <MaterialCommunityIcons name="diamond" size={18} color="#fff" />
                <Text style={styles.premiumText}>Aurora Premium</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsWrap}>
            <View style={styles.statCard}>
              <View style={styles.statIconGhost}>
                <MaterialIcons name="account-balance-wallet" size={36} color={COLORS.primary} />
              </View>

              <Text style={styles.statLabel}>TOTAL ASSETS</Text>

              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{prefs.showBalance ? formatCurrency(balance) : "••••"}</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.eyeBtn}
                  onPress={() => setShowBalance(!prefs.showBalance)}
                >
                  <MaterialIcons
                    name={prefs.showBalance ? "visibility" : "visibility-off"}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.deltaRow}>
                <MaterialIcons name="trending-up" size={14} color={COLORS.green} />
                <Text style={styles.deltaText}>+2.4%</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconGhost}>
                <MaterialIcons name="stars" size={36} color={COLORS.purple} />
              </View>

              <Text style={styles.statLabel}>POINTS</Text>
              <Text style={styles.statValue}>1,250</Text>
              <Text style={styles.tierText}>Gold Tier</Text>
            </View>
          </View>

          {/* Actions Bar */}
          <View style={styles.actionsWrap}>
            <View style={styles.actionsRow}>
              <TouchableOpacity activeOpacity={0.85} style={styles.actionItem} onPress={() => setQrOpen(true)}>
                <View style={styles.actionCircle}>
                  <MaterialCommunityIcons name="qrcode" size={24} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>My QR</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} style={styles.actionItem} onPress={() => navigation.navigate("MyCards")}>
                <View style={styles.actionCircle}>
                  <MaterialCommunityIcons name="credit-card" size={24} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>Cards</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} style={styles.actionItem} onPress={() => navigation.navigate("History")}>
                <View style={styles.actionCircle}>
                  <MaterialIcons name="description" size={24} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.actionItem}
                onPress={() => notifyLocal("Share", "Share options are coming soon.")}
              >
                <View style={styles.actionCircle}>
                  <MaterialIcons name="ios-share" size={24} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <View style={styles.sectionCard}>
              <Row
                icon={{ pack: "mi", name: "account-balance" }}
                iconBg="rgba(59,130,246,0.14)"
                iconColor={COLORS.primary}
                title="Account Number"
                rightText={prefs.showAccountNumber ? accountNumber : maskedAccount}
                onPress={() => setShowAccountNumber(!prefs.showAccountNumber)}
                showChevron={false}
              />
              <Row
                icon={{ pack: "mi", name: "account-balance" }}
                iconBg="rgba(59,130,246,0.14)"
                iconColor={COLORS.primary}
                title="Linked Banks & Cards"
                onPress={() => navigation.navigate("MyCards")}
                isLast
              />
            </View>
          </View>

          {/* Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SECURITY</Text>
            <View style={styles.sectionCard}>
              <Row
                icon={{ pack: "mi", name: "face" }}
                iconBg="rgba(34,197,94,0.14)"
                iconColor={Platform.OS === "ios" ? "#34d399" : "#22c55e"}
                title="Biometric Login"
                showChevron={false}
                rightSlot={
                  <Switch
                    value={prefs.biometricsEnabled}
                    onValueChange={setBiometricsEnabled}
                    trackColor={{ false: "#232f48", true: COLORS.primary }}
                    thumbColor="#ffffff"
                  />
                }
              />
              <Row
                icon={{ pack: "mi", name: "lock-reset" }}
                iconBg="rgba(34,197,94,0.14)"
                iconColor={Platform.OS === "ios" ? "#34d399" : "#22c55e"}
                title="Change Password"
                onPress={() => notifyLocal("Coming soon", "Password changes are handled via reset flow for now.")}
                isLast
              />
            </View>
          </View>

          {/* App */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>APP</Text>
            <View style={styles.sectionCard}>
              <Row
                icon={{ pack: "mi", name: "settings" }}
                iconBg="rgba(168,85,247,0.14)"
                iconColor={COLORS.purple}
                title="Preferences"
                rightText="English"
                onPress={() => navigation.navigate("Settings")}
              />
              <Row
                icon={{ pack: "mi", name: "help" }}
                iconBg="rgba(168,85,247,0.14)"
                iconColor={COLORS.purple}
                title="Help & Support"
                onPress={() => notifyLocal("Support", "Help center is coming soon.")}
                isLast
              />
            </View>
          </View>

          {/* Logout */}
          <View style={styles.logoutWrap}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.logoutBtn}
              onPress={async () => {
                await logout();
                navigation.navigate("Login");
              }}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>Aurora Pay v1.0.2 (Build 240)</Text>
          </View>
        </ScrollView>

        <Modal visible={qrOpen} transparent animationType="fade" onRequestClose={() => setQrOpen(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setQrOpen(false)}>
            <View style={styles.qrSheet}>
              <Text style={styles.qrTitle}>My Aurora QR</Text>
              <View style={styles.qrWrap}>
                <QRCode value={`aurora://pay?account=${accountNumber}`} size={180} />
              </View>
              <Text style={styles.qrSub}>{accountNumber}</Text>
              <TouchableOpacity style={styles.qrCloseBtn} activeOpacity={0.9} onPress={() => setQrOpen(false)}>
                <Text style={styles.qrCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  shell: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    backgroundColor: "rgba(16,22,34,0.90)",
    borderBottomWidth: 1,
    borderBottomColor: "#232f48",
  },
  headerBtn: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: "#fff", marginRight: 40 },

  profileWrap: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 10,
    position: "relative",
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    top: 34,
    left: "50%",
    transform: [{ translateX: -64 }],
    width: 128,
    height: 128,
    borderRadius: 999,
    backgroundColor: "rgba(19,91,236,0.30)",
    opacity: 1,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.6,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  profileInner: { alignItems: "center", gap: 14 },

  avatarWrap: { position: "relative" },
  avatar: { width: 140, height: 140, borderRadius: 999, overflow: "hidden", right:11,},
  avatarImg: {
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "#232f48",
  },
  avatarEditBtn: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userName: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.2 },
  userHandle: { marginTop: 2, fontSize: 14, fontWeight: "700", color: COLORS.textMuted },

  premiumBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  premiumText: { color: "#fff", fontSize: 13, fontWeight: "900" },

  statsWrap: { paddingHorizontal: 16, paddingTop: 16, flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#232f48",
    borderRadius: 18,
    padding: 14,
    overflow: "hidden",
  },
  statIconGhost: {
    position: "absolute",
    top: 6,
    right: 6,
    opacity: 0.12,
  },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  eyeBtn: { padding: 6, borderRadius: 999 },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  deltaText: { color: COLORS.green, fontSize: 12, fontWeight: "900" },
  tierText: { marginTop: 6, color: "rgba(168,85,247,0.85)", fontSize: 12, fontWeight: "800" },

  actionsWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  actionsRow: { flexDirection: "row", justifyContent: "space-between" },
  actionItem: { alignItems: "center", gap: 8, width: (CONTAINER_W - 32) / 4 },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#232f48",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { color: "#fff", fontSize: 12, fontWeight: "700", opacity: 0.95 },

  section: { paddingHorizontal: 16, paddingTop: 14 },
  sectionTitle: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    color: "#fff",
    opacity: 0.6,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#232f48",
    borderRadius: 18,
    overflow: "hidden",
  },

  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "rgba(35,47,72,0.55)" },
  rowIconWrap: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  rowTitleWrap: { flex: 1, justifyContent: "center" },
  rowTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  rowRightWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowRightText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "800" },
  chevWrap: { width: 26, alignItems: "flex-end", justifyContent: "center" },

  logoutWrap: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18, alignItems: "center", gap: 12 },
  logoutBtn: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 12,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "#f87171", fontSize: 13, fontWeight: "900", letterSpacing: 0.6 },
  versionText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  qrSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#232f48",
    alignItems: "center",
  },
  qrTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  qrWrap: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#fff",
  },
  qrSub: { marginTop: 12, color: COLORS.textMuted, fontSize: 14, fontWeight: "700" },
  qrCloseBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qrCloseText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});
