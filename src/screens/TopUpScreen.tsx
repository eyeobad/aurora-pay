// src/screens/TopUpScreen.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Platform,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { notifyLocal } from "../lib/notifications";

const COLORS = {
  bg: "#101622",
  surface: "#1c2533",
  surface2: "#232f48",
  primary: "#135bec",
  primaryDark: "#0c40a8",
  white: "#ffffff",
  slate: "#92a4c9",
  overlay: "rgba(0,0,0,0.55)",
  border: "rgba(255,255,255,0.06)",
};

type FundingSourceType = "wallet" | "card" | "bank" | "ussd";

type FundingSource = {
  id: string;
  type: FundingSourceType;
  label: string; // "Chase Bank"
  detail: string; // "•••• 1234" or "Aurora Wallet"
  subtitle?: string; // "Instant" / "Visa" / "1-2 days"
};

const FUNDING_SOURCES: FundingSource[] = [
  { id: "wallet", type: "wallet", label: "Wallet", detail: "Aurora Wallet", subtitle: "Instant" },
  { id: "chase", type: "card", label: "Chase Bank", detail: "•••• 1234", subtitle: "Visa" },
  { id: "visa4242", type: "card", label: "Visa", detail: "•••• 4242", subtitle: "Card" },
  { id: "bank", type: "bank", label: "Bank Transfer", detail: "ACH / Local", subtitle: "1–2 days" },
  { id: "ussd", type: "ussd", label: "USSD", detail: "*123#", subtitle: "Mobile banking" },
];

export default function TopUpScreen() {
  const nav = useNavigation<any>();
  const { state, topUp, refresh, confirmBiometric } = useApp();

  const balance = state.balance ?? 0;

  // amount string composed by keypad
  const [amountStr, setAmountStr] = useState<string>("50");
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<FundingSource>(FUNDING_SOURCES[1]); // default Chase
  const [processing, setProcessing] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const pinRefs = [
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
  ];

  // ---- Amount helpers
  const parsedAmount = useMemo(() => {
    const n = parseFloat(amountStr || "0");
    return Number.isFinite(n) ? n : 0;
  }, [amountStr]);

  const dollars = useMemo(() => {
    const whole = Math.floor(parsedAmount);
    return String(whole);
  }, [parsedAmount]);

  const cents = useMemo(() => {
    const dec = Math.round((parsedAmount - Math.floor(parsedAmount)) * 100);
    return `.${String(dec).padStart(2, "0")}`;
  }, [parsedAmount]);

  const formatMoney = (n: number) => {
    try {
      return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
    } catch {
      return `$${n.toFixed(2)}`;
    }
  };

  const hapticLight = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const hapticSuccess = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const setPreset = async (v: number) => {
    await hapticLight();
    setAmountStr(String(v));
  };

  const onKeyPress = async (key: string) => {
    await hapticLight();

    if (key === "back") {
      setAmountStr((prev) => {
        const next = prev.length <= 1 ? "0" : prev.slice(0, -1);
        return next === "" ? "0" : next;
      });
      return;
    }

    if (key === ".") {
      setAmountStr((prev) => (prev.includes(".") ? prev : `${prev}.`));
      return;
    }

    // digit
    setAmountStr((prev) => {
      if (prev === "0") return key;
      // max 2 decimals
      if (prev.includes(".")) {
        const [a, b = ""] = prev.split(".");
        if (b.length >= 2) return prev;
        return `${a}.${b}${key}`;
      }
      // limit length a bit
      if (prev.length >= 7) return prev;
      return prev + key;
    });
  };

  const pickSource = async (src: FundingSource) => {
    await hapticLight();
    setSelectedSource(src);
    setShowSourceModal(false);
  };

  const clearPin = () => {
    setPin(["", "", "", ""]);
    setTimeout(() => pinRefs[0].current?.focus(), 60);
  };

  const onPinChange = (idx: number, v: string) => {
    const value = v.slice(-1).replace(/[^0-9]/g, "");
    const next = [...pin];
    next[idx] = value;
    setPin(next);

    if (value && idx < 3) pinRefs[idx + 1].current?.focus();
    if (!value && idx > 0) pinRefs[idx - 1].current?.focus();
  };

  const performTopUp = async (skipBiometric: boolean) => {
    if (parsedAmount <= 0) {
      await notifyLocal("Invalid amount", "Enter an amount greater than 0.");
      return;
    }

    try {
      setProcessing(true);
      await hapticSuccess();
      await topUp({
        amount: parsedAmount,
        fee: 0,
        note: `Top up from ${selectedSource.label} ${selectedSource.detail}`,
        skipBiometric,
      });
      await refresh();
      setPinOpen(false);
      nav.goBack();
    } catch (e) {
      await notifyLocal("Top-up failed", "Unable to complete this top up.");
    } finally {
      setProcessing(false);
      clearPin();
    }
  };

  const onAddFundsPress = async () => {
    if (parsedAmount <= 0) {
      await notifyLocal("Invalid amount", "Enter an amount greater than 0.");
      return;
    }

    const ok = await confirmBiometric("Confirm top up");
    if (ok) {
      await performTopUp(true);
      return;
    }

    await hapticLight();
    clearPin();
    setPinOpen(true);
  };

  const doTopUp = async () => {
    const code = pin.join("");
    if (code.length !== 4) {
      await notifyLocal("Invalid PIN", "Enter your 4-digit PIN.");
      return;
    }
    await performTopUp(true);
  };

  const topSpacer = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: 16 + topSpacer }]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => nav.goBack()} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Top Up</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.balanceWrap}>
          <Text style={styles.balanceText}>Current Balance: {formatMoney(balance)}</Text>
        </View>

        {/* Big amount */}
        <View style={styles.amountRow}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.amountWhole}>{dollars}</Text>
          <Text style={styles.amountCents}>{cents}</Text>
          <View style={styles.caret} />
        </View>

        {/* Presets */}
        <View style={styles.pillsRow}>
          <TouchableOpacity style={[styles.pill, styles.pillActive]} onPress={() => setPreset(50)} activeOpacity={0.9}>
            <Text style={styles.pillTextActive}>+$50</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pill} onPress={() => setPreset(10)} activeOpacity={0.9}>
            <Text style={styles.pillText}>+$10</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pill} onPress={() => setPreset(20)} activeOpacity={0.9}>
            <Text style={styles.pillText}>+$20</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pill} onPress={() => setPreset(100)} activeOpacity={0.9}>
            <Text style={styles.pillText}>+$100</Text>
          </TouchableOpacity>
        </View>

        {/* FROM selector */}
        <View style={{ width: "100%", marginTop: 14 }}>
          <TouchableOpacity
            style={styles.fromRow}
            activeOpacity={0.85}
            onPress={() => setShowSourceModal(true)}
          >
            <View style={styles.fromLeft}>
              {/* card preview block */}
              <LinearGradient
                colors={["#3b82f6", "#1e40af"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fromIcon}
              >
                <View style={styles.cardDots1} />
                <View style={styles.cardDots2} />
              </LinearGradient>

              <View>
                <Text style={styles.fromLabel}>FROM</Text>
                <Text style={styles.fromValue}>
                  {selectedSource.label} {selectedSource.detail ? ` ${selectedSource.detail}` : ""}
                </Text>
                {!!selectedSource.subtitle && <Text style={styles.fromSub}>{selectedSource.subtitle}</Text>}
              </View>
            </View>

            <MaterialIcons name="expand-more" size={26} color={COLORS.slate} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom panel: CTA + keypad */}
      <View style={styles.bottomPanel}>
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.ctaBtn, (processing || parsedAmount <= 0) && { opacity: 0.7 }]}
            onPress={onAddFundsPress}
            activeOpacity={0.92}
            disabled={processing || parsedAmount <= 0}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{processing ? "Processing..." : "Add Funds"}</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.keypad}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map((k) => {
            const isBack = k === "back";
            return (
              <TouchableOpacity key={k} style={styles.key} onPress={() => onKeyPress(k)} activeOpacity={0.75}>
                {isBack ? (
                  <MaterialIcons name="backspace" size={26} color="#fff" />
                ) : (
                  <Text style={styles.keyText}>{k}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Funding source modal */}
      <Modal
        visible={showSourceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSourceModal(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowSourceModal(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choose funding source</Text>

            {FUNDING_SOURCES.map((src) => {
              const active = src.id === selectedSource.id;
              return (
                <TouchableOpacity
                  key={src.id}
                  style={[styles.sourceItem, active && styles.sourceItemActive]}
                  onPress={() => pickSource(src)}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourceTitle}>
                      {src.label} {src.detail ? ` ${src.detail}` : ""}
                    </Text>
                    {!!src.subtitle && <Text style={styles.sourceSub}>{src.subtitle}</Text>}
                  </View>

                  {active ? (
                    <MaterialIcons name="check-circle" size={22} color="#4ade80" />
                  ) : (
                    <MaterialIcons name="radio-button-unchecked" size={22} color="rgba(255,255,255,0.25)" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={pinOpen} transparent animationType="fade" onRequestClose={() => setPinOpen(false)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setPinOpen(false)}>
          <View style={styles.pinCard}>
            <Text style={styles.sheetTitle}>Enter PIN</Text>
            <Text style={styles.pinSub}>Enter your 4-digit PIN to authorize</Text>

            <View style={styles.pinRow}>
              {pin.map((p, i) => (
                <TextInput
                  key={i}
                  ref={(r) => (pinRefs[i].current = r)}
                  value={p}
                  onChangeText={(v) => onPinChange(i, v)}
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                  style={styles.pinBox}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.pinConfirm} onPress={doTopUp} activeOpacity={0.92}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pinConfirmGrad}
              >
                <Text style={styles.pinConfirmText}>Confirm</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pinCancel} onPress={() => setPinOpen(false)} activeOpacity={0.85}>
              <Text style={styles.pinCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cancelText: {
    color: "rgba(148,163,184,0.9)",
    fontSize: 15,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  balanceWrap: {
    marginTop: 12,
    alignItems: "center",
  },
  balanceText: {
    color: COLORS.slate,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  amountRow: {
    marginTop: 26,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  currency: {
    fontSize: 36,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "900",
    marginRight: 6,
    marginBottom: 10,
  },
  amountWhole: {
    fontSize: 72,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 80,
  },
  amountCents: {
    fontSize: 34,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "900",
    marginBottom: 14,
    marginLeft: 4,
  },
  caret: {
    width: 4,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    marginLeft: 8,
    marginBottom: 16,
    opacity: 0.95,
  },

  pillsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  pill: {
    height: 40,
    minWidth: 80,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 18,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    borderColor: "rgba(255,255,255,0)",
  },
  pillText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  pillTextActive: { color: "#fff", fontSize: 13, fontWeight: "900" },

  fromRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fromLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fromIcon: {
    height: 40,
    width: 56,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDots1: {
    position: "absolute",
    top: 10,
    right: 10,
    height: 8,
    width: 8,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  cardDots2: {
    position: "absolute",
    top: 10,
    right: 22,
    height: 8,
    width: 8,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  fromLabel: {
    color: "rgba(146,164,201,0.9)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  fromValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  fromSub: {
    color: "rgba(146,164,201,0.9)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  bottomPanel: {
    backgroundColor: COLORS.bg,
    paddingBottom: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 18,
  },
  ctaWrap: {
    paddingHorizontal: 16,
    marginTop: -18,
    marginBottom: 10,
  },
  ctaBtn: {
    height: 56,
    borderRadius: 999,
    overflow: "hidden",
  },
  ctaGradient: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  ctaText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },

  keypad: {
    paddingHorizontal: 18,
    paddingTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  key: {
    width: "30%",
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },
  sourceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(28,37,51,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  sourceItemActive: {
    borderColor: "rgba(19,91,236,0.7)",
    backgroundColor: "rgba(19,91,236,0.12)",
  },
  sourceTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  sourceSub: {
    color: "rgba(146,164,201,0.9)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  pinCard: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pinSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 6,
  },
  pinBox: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(25,34,51,0.92)",
    color: "#fff",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
  },
  pinConfirm: {
    height: 52,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 14,
  },
  pinConfirmGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pinConfirmText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  pinCancel: {
    height: 48,
    borderRadius: 999,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(25,34,51,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pinCancelText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
  },
});
