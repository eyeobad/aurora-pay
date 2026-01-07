// src/screens/SettingsScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  Switch,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

type Nav = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

const COLORS = {
  primary: "#135bec",
  bg: "#101622",
  surface: "#151c2a",
  border: "#232f48",
  divider: "rgba(35,47,72,0.55)",
  textMuted: "#92a4c9",
  textMuted2: "#637588",
  white: "#ffffff",
  green: "#22c55e",
  red: "#ef4444",
  teal: "#14b8a6",
  orange: "#f97316",
  purple: "#a855f7",
  indigo: "#6366f1",
};

const NAV_H = 84;
const { width: SCREEN_W } = Dimensions.get("window");
const MAX_W = 420;
const CONTAINER_W = Math.min(SCREEN_W, MAX_W);

const Icon = ({
  pack,
  name,
  size = 22,
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

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

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

const NavItem = ({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.navItem}>
    {icon}
    <Text style={[styles.navLabel, active && { color: COLORS.primary }]}>{label}</Text>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [faceId, setFaceId] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const user = useMemo(
    () => ({
      name: "Alex Morgan",
      email: "alex.morgan@aurora.com",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAmoJnZaf-0WuYgDX4vRNIiDZa27hzoosCWWTW4bNxxhHzLBnlWXU0xf8afcqvQoFhS_-SB42OQ1SD1o6sm7iNWAszJ7he8bRBeaCNs8wsQys-ve4DZ3C6KqCESo_mUvyAvvXOSP08G13npzoWcweqmLVEO4R5b0gc6aj0V8jUlqUgg6ivTKq5GsnBWsapzZJD-XtSQtFx1i7PLUrcJ6SOcZHy6ebdW6iL4ZjbURRgViwE24DZDn1beX2qqncxY5bgeIoGkUEj0oZ36",
    }),
    [],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <View style={styles.shell}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.85} style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios-new" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Settings</Text>

          <View style={{ width: 40, height: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: NAV_H + 120 }}
        >
          {/* Profile Header */}
          <View style={styles.profileWrap}>
            <View style={styles.profileInner}>
              <View style={styles.avatarWrap}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} resizeMode="cover" />
                <TouchableOpacity activeOpacity={0.9} style={styles.avatarEditBtn}>
                  <MaterialIcons name="edit" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>

              <View style={styles.badgesRow}>
                <View style={styles.badgePro}>
                  <Text style={styles.badgeProText}>Pro Member</Text>
                </View>
                <View style={styles.badgeVerified}>
                  <Text style={styles.badgeVerifiedText}>Verified</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ACCOUNT & SECURITY */}
          <View style={styles.section}>
            <SectionTitle>ACCOUNT &amp; SECURITY</SectionTitle>
            <View style={styles.sectionCard}>
              <Row
                icon={{ pack: "mi", name: "lock" }}
                iconBg="rgba(59,130,246,0.14)"
                iconColor={COLORS.primary}
                title="Change Password"
                onPress={() => navigation.navigate("ChangePassword")}
              />
              <Row
                icon={{ pack: "mi", name: "face" }}
                iconBg="rgba(168,85,247,0.14)"
                iconColor={COLORS.purple}
                title="Face ID Login"
                showChevron={false}
                rightSlot={
                  <Switch
                    value={faceId}
                    onValueChange={setFaceId}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor="#ffffff"
                  />
                }
              />
              <Row
                icon={{ pack: "mi", name: "shield" }}
                iconBg="rgba(20,184,166,0.14)"
                iconColor={COLORS.teal}
                title="2-Factor Auth"
                rightText="Enabled"
                onPress={() => navigation.navigate("TwoFactor")}
                isLast
              />
            </View>
          </View>

          {/* PREFERENCES */}
          <View style={styles.section}>
            <SectionTitle>PREFERENCES</SectionTitle>
            <View style={styles.sectionCard}>
              <Row
                icon={{ pack: "mi", name: "notifications" }}
                iconBg="rgba(249,115,22,0.14)"
                iconColor={COLORS.orange}
                title="Notifications"
                onPress={() => navigation.navigate("Notifications")}
              />
              <Row
                icon={{ pack: "mi", name: "payments" }}
                iconBg="rgba(34,197,94,0.14)"
                iconColor={COLORS.green}
                title="Currency"
                rightText="USD ($)"
                onPress={() => navigation.navigate("Currency")}
              />
              <Row
                icon={{ pack: "mi", name: "dark-mode" }}
                iconBg="rgba(99,102,241,0.14)"
                iconColor={COLORS.indigo}
                title="Dark Mode"
                showChevron={false}
                rightSlot={
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor="#ffffff"
                  />
                }
                isLast
              />
            </View>
          </View>

          {/* SUPPORT */}
          <View style={styles.section}>
            <SectionTitle>SUPPORT</SectionTitle>
            <View style={styles.sectionCard}>
              <Row
                icon={{ pack: "mi", name: "help" }}
                iconBg="rgba(236,72,153,0.14)"
                iconColor="#ec4899"
                title="Help Center"
                onPress={() => navigation.navigate("HelpCenter")}
              />
              <Row
                icon={{ pack: "mi", name: "policy" }}
                iconBg="rgba(148,163,184,0.12)"
                iconColor="#94a3b8"
                title="Privacy Policy"
                onPress={() => navigation.navigate("PrivacyPolicy")}
                isLast
              />
            </View>
          </View>

          {/* Logout */}
          <View style={styles.logoutWrap}>
            <TouchableOpacity activeOpacity={0.85} style={styles.logoutBtn}>
              <MaterialIcons name="logout" size={18} color="#f87171" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>Aurora Pay v2.4.0 (Build 108)</Text>
          </View>
        </ScrollView>

        {/* Bottom Navigation (fixed) */}
        <View style={styles.navWrap}>
          <View style={styles.navInner}>
            <NavItem
              label="Home"
              icon={<MaterialIcons name="home" size={22} color={COLORS.textMuted2} />}
              onPress={() => navigation.navigate("Dashboard")}
            />
            <NavItem
              label="Wallet"
              icon={<MaterialIcons name="account-balance-wallet" size={22} color={COLORS.textMuted2} />}
              onPress={() => navigation.navigate("MyCards")}
            />

            <TouchableOpacity activeOpacity={0.9} style={styles.qrBtn} onPress={() => navigation.navigate("Scanner")}>
              <View style={styles.qrBtnInner}>
                <MaterialCommunityIcons name="qrcode-scan" size={26} color="#fff" />
              </View>
            </TouchableOpacity>

            <NavItem
              label="Activity"
              icon={<MaterialIcons name="bar-chart" size={22} color={COLORS.textMuted2} />}
              onPress={() => navigation.navigate("History")}
            />
            <NavItem
              label="Settings"
              active
              icon={<MaterialIcons name="settings" size={22} color={COLORS.primary} />}
              onPress={() => navigation.navigate("Settings")}
            />
          </View>
        </View>
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
    borderBottomColor: COLORS.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    marginRight: 40,
  },

  profileWrap: { paddingTop: 18, paddingHorizontal: 16, paddingBottom: 8, alignItems: "center" },
  profileInner: { alignItems: "center", gap: 10 },

  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  avatar: { width: "100%", height: "100%" },
  avatarEditBtn: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.bg,
  },

  userName: { marginTop: 6, fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: -0.3 },
  userEmail: { fontSize: 14, fontWeight: "700", color: COLORS.textMuted },

  badgesRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  badgePro: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(19,91,236,0.18)",
    borderWidth: 1,
    borderColor: "rgba(19,91,236,0.20)",
  },
  badgeProText: { color: COLORS.primary, fontSize: 12, fontWeight: "900" },
  badgeVerified: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.18)",
  },
  badgeVerifiedText: { color: COLORS.green, fontSize: 12, fontWeight: "900" },

  section: { paddingHorizontal: 16, paddingTop: 18 },
  sectionTitle: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    color: "#fff",
    opacity: 0.55,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    overflow: "hidden",
  },

  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 18 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  rowIconWrap: { width: 44, height: 44, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  rowTitleWrap: { flex: 1, justifyContent: "center" },
  rowTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  rowRightWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowRightText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "800" },
  chevWrap: { width: 26, alignItems: "flex-end", justifyContent: "center" },

  logoutWrap: { paddingHorizontal: 16, paddingTop: 26, alignItems: "center", gap: 14 },
  logoutBtn: {
    width: "100%",
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  logoutText: { color: "#f87171", fontSize: 16, fontWeight: "900" },
  versionText: { color: COLORS.textMuted2, fontSize: 12, fontWeight: "700" },

  navWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: Platform.OS === "ios" ? 20 : 14,
    paddingTop: 12,
    paddingHorizontal: 18,
    backgroundColor: "rgba(21,28,42,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  navInner: {
    width: "100%",
    maxWidth: MAX_W,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  navItem: { alignItems: "center", gap: 6, width: (CONTAINER_W - 36) / 5 },
  navLabel: { color: COLORS.textMuted2, fontSize: 10, fontWeight: "700" },

  qrBtn: { width: (CONTAINER_W - 36) / 5, alignItems: "center", marginTop: -34 },
  qrBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
});
