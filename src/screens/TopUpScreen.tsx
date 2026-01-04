// src/screens/TopUpScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  Text,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppText, Input, Button, IconButton } from "../components";
import { colors, spacing, radius } from "../components/tokens";

import { useApp } from "../context/AppContext";

type Nav = {
  goBack: () => void;
  navigate: (name: string, params?: any) => void;
};

export default function TopUpScreen() {
  const nav = useNavigation<Nav>();
  const { state, topUp, refresh } = useApp();

  // entrance
  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(appear, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [appear]);

  // small top spacer so header doesn't overlap status bar
  const topSpacer = Platform.OS === "android" ? (StatusBar.currentHeight ?? 14) : 14;

  // form
  const [amountRaw, setAmountRaw] = useState<string>(""); // raw numeric string
  const [method, setMethod] = useState<"card" | "bank" | "ussd">("card");
  const [note, setNote] = useState<string>("Top up wallet");

  // UI state
  // balance and loading come from context state
  const balance = state.balance ?? null;
  const loading = state.loading ?? false;

  // modals
  const [showSummary, setShowSummary] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultSuccess, setResultSuccess] = useState<boolean | null>(null);
  const [lastTx, setLastTx] = useState<any | null>(null);

  // pin
  const [pin, setPin] = useState(["", "", "", ""]);
  const pinInputs = [useRef<TextInput | null>(null), useRef<TextInput | null>(null), useRef<TextInput | null>(null), useRef<TextInput | null>(null)];

  // animations for modals
  const summaryAnim = useRef(new Animated.Value(0)).current;
  const pinAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  // presets
  const presets = [10, 25, 50, 100, 200];

  // utils
  function numericValueFromRaw(raw: string) {
    const numeric = parseFloat(String(raw).replace(/[^0-9.-]+/g, ""));
    return Number.isNaN(numeric) ? 0 : numeric;
  }
  function formatCurrency(n: number) {
    try {
      return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
    } catch {
      return String(n);
    }
  }

  const amount = numericValueFromRaw(amountRaw);
  const fee = Math.max(0, Math.round(amount * 0.01 * 100) / 100); // small example fee 1%
  const total = +(amount + fee).toFixed(2);

  // keep local balance in sync if need be to render derived UI besides `balance`
  // (not strictly necessary since we read `balance` directly from context)
  useEffect(() => {
    // no-op; placeholder in case we might later want to sync derived local state
  }, [balance]);

  // presets behavior
  function pickPreset(v: number) {
    setAmountRaw(String(v));
  }

  // method selector
  function selectMethod(m: "card" | "bank" | "ussd") {
    setMethod(m);
  }

  // validation
  function validate() {
    if (amount <= 0) return "Enter an amount greater than 0.";
    return null;
  }

  // open/close helpers with small animations
  function openSummary() {
    setShowSummary(true);
    summaryAnim.setValue(0);
    Animated.timing(summaryAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }
  function closeSummary(cb?: () => void) {
    Animated.timing(summaryAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setShowSummary(false);
      if (cb) cb();
    });
  }

  function openPin() {
    setShowPin(true);
    pinAnim.setValue(0);
    Animated.timing(pinAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }
  function closePin(cb?: () => void) {
    Animated.timing(pinAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setShowPin(false);
      if (cb) cb();
    });
  }

  function openResult(success: boolean) {
    setResultSuccess(success);
    setShowResult(true);
    resultAnim.setValue(0);
    Animated.timing(resultAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }
  function closeResult(cb?: () => void) {
    Animated.timing(resultAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setShowResult(false);
      setResultSuccess(null);
      if (cb) cb();
    });
  }

  // confirm CTA
  function onContinue() {
    const err = validate();
    if (err) {
      Alert.alert("Validation", err);
      return;
    }
    openSummary();
  }

  // pin helpers
  function onPinChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    const next = [...pin];
    next[index] = value.replace(/[^0-9]/g, "");
    setPin(next);
    if (value && index < 3) pinInputs[index + 1].current?.focus();
    if (!value && index > 0) pinInputs[index - 1].current?.focus();
  }
  function clearPin() {
    setPin(["", "", "", ""]);
    pinInputs[0].current?.focus();
  }

  // after confirming summary -> close summary then open pin
  function onSummaryConfirm() {
    closeSummary(() => {
      setTimeout(() => {
        clearPin();
        openPin();
      }, 120);
    });
  }

  // perform top up using context topUp()
  async function handleTopUp() {
    const code = pin.join("");
    if (code.length !== 4) {
      Alert.alert("Invalid PIN", "Enter your 4-digit PIN to confirm.");
      return;
    }

    try {
      // call topUp from context — it will update storage and app state
      const created = await topUp({ amount, fee, note });

      setLastTx(created);

      // close pin -> show result
      closePin(() => {
        setTimeout(() => openResult(true), 140);
      });

      // ensure state is current (topUp should already update context but refresh is safe)
      await refresh();
    } catch (e: any) {
      console.warn("topup failed", e);
      closePin(() => {
        setTimeout(() => openResult(false), 140);
      });
    } finally {
      clearPin();
    }
  }

  function onDownloadReceipt() {
    Alert.alert("Download", "Receipt download started (demo).");
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.View
          style={[
            styles.container,
            {
              paddingTop: topSpacer, // <-- safe spacer so header doesn't overlap status bar
              opacity: appear,
              transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => nav.goBack()} accessibilityRole="button" style={styles.backBtn}>
              <AppText variant="button" style={{ color: colors.primary }}>
                ◀
              </AppText>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <AppText variant="h1" style={styles.title}>
                Top up
              </AppText>
              <AppText variant="caption" style={styles.subtitle}>
                Add funds to your wallet
              </AppText>
            </View>

            <View style={styles.balanceWrap}>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                Balance
              </AppText>
              <AppText variant="body">{balance !== null ? formatCurrency(balance) : "—"}</AppText>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <AppText variant="caption" style={styles.sectionLabel}>
              Amount
            </AppText>
            <Input placeholder="0.00" value={amountRaw} onChangeText={setAmountRaw} keyboardType="numeric" isCurrency currency="USD" />
            <View style={{ height: 8 }} />
            <View style={styles.presetRow}>
              {presets.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetBtn, numericValueFromRaw(amountRaw) === p && styles.presetBtnActive]}
                  onPress={() => pickPreset(p)}
                  accessibilityRole="button"
                >
                  <AppText variant="button" style={numericValueFromRaw(amountRaw) === p ? { color: "#fff" } : undefined}>
                    {formatCurrency(p)}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
            <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 8 }}>
              Fee estimate: {formatCurrency(fee)} • Total: {formatCurrency(total)}
            </AppText>
          </View>

          {/* Method */}
          <View style={styles.section}>
            <AppText variant="caption" style={styles.sectionLabel}>
              Payment method
            </AppText>
            <View style={styles.methodRow}>
              <TouchableOpacity style={[styles.methodCard, method === "card" && styles.methodCardActive]} onPress={() => selectMethod("card")} accessibilityRole="button">
                <AppText variant="body">Card</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>
                  Visa •••• 4242
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.methodCard, method === "bank" && styles.methodCardActive]} onPress={() => selectMethod("bank")} accessibilityRole="button">
                <AppText variant="body">Bank</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>
                  Bank transfer
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.methodCard, method === "ussd" && styles.methodCardActive]} onPress={() => selectMethod("ussd")} accessibilityRole="button">
                <AppText variant="body">USSD</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>
                  Mobile banking
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <AppText variant="caption" style={styles.sectionLabel}>
              Reference (optional)
            </AppText>
            <Input placeholder="Reference or note" value={note} onChangeText={setNote} />
          </View>

          {/* CTA */}
          <View style={styles.ctaRow}>
            <Button title="Continue" variant="primary" onPress={onContinue} loading={loading} />
            <View style={{ height: 10 }} />
            <Button title="Cancel" variant="secondary" onPress={() => nav.goBack()} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* SUMMARY MODAL */}
      <Modal visible={showSummary} transparent onRequestClose={() => closeSummary()}>
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: summaryAnim,
                transform: [
                  { scale: summaryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                  { translateY: summaryAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                ],
              },
            ]}
          >
            <AppText variant="h2">Top up summary</AppText>
            <View style={{ height: 12 }} />
            <View style={styles.summaryRow}>
              <AppText variant="caption">Amount</AppText>
              <AppText variant="caption">{formatCurrency(amount)}</AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="caption">Fee</AppText>
              <AppText variant="caption">{formatCurrency(fee)}</AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="caption">Total</AppText>
              <AppText variant="caption">{formatCurrency(total)}</AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="caption">Method</AppText>
              <AppText variant="caption">{method.toUpperCase()}</AppText>
            </View>
            {note ? (
              <View style={{ marginTop: 10 }}>
                <AppText variant="caption">Reference</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>
                  {note}
                </AppText>
              </View>
            ) : null}

            <View style={{ height: 18 }} />
            <Button title="Confirm & Enter PIN" variant="primary" onPress={onSummaryConfirm} />
            <View style={{ height: 12 }} />
            <Button title="Cancel" variant="secondary" onPress={() => closeSummary()} />
          </Animated.View>
        </View>
      </Modal>

      {/* PIN MODAL */}
      <Modal visible={showPin} transparent onRequestClose={() => closePin()}>
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.pinCard,
              {
                opacity: pinAnim,
                transform: [
                  { scale: pinAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                  { translateY: pinAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                ],
              },
            ]}
          >
            <AppText variant="h2">Enter PIN</AppText>
            <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 8 }}>
              Enter your 4-digit PIN to authorize the top-up
            </AppText>

            <View style={styles.pinRow}>
              {pin.map((p, i) => (
                <TextInput
                  key={i}
                  ref={(r) => (pinInputs[i].current = r)}
                  value={p}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(v) => onPinChange(i, v)}
                  style={styles.pinBox}
                  secureTextEntry
                  returnKeyType={i === 3 ? "done" : "next"}
                  textContentType="oneTimeCode"
                />
              ))}
            </View>

            <View style={{ height: 12 }} />
            <Button title="Top up" variant="primary" onPress={handleTopUp} loading={loading} />
            <View style={{ height: 12 }} />
            <Button title="Cancel" variant="secondary" onPress={() => closePin(() => openSummary())} />
          </Animated.View>
        </View>
      </Modal>

      {/* RESULT MODAL */}
      <Modal visible={showResult} transparent onRequestClose={() => closeResult()}>
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: resultAnim,
                transform: [
                  { scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                  { translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                ],
              },
            ]}
          >
            {resultSuccess ? (
              <>
                <View style={{ alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 36 }}>✅</Text>
                </View>
                <AppText variant="h2">Top-up successful</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 6 }}>
                  Your wallet has been topped up.
                </AppText>

                <View style={{ height: 12 }} />
                <View style={styles.summaryRow}>
                  <AppText variant="caption">Amount</AppText>
                  <AppText variant="caption">{lastTx ? formatCurrency(lastTx.amount) : formatCurrency(amount)}</AppText>
                </View>
                <View style={styles.summaryRow}>
                  <AppText variant="caption">Fee</AppText>
                  <AppText variant="caption">{lastTx ? formatCurrency(lastTx.fee) : formatCurrency(fee)}</AppText>
                </View>

                <View style={{ height: 18 }} />
                <Button title="Download receipt" variant="primary" onPress={onDownloadReceipt} />
                <View style={{ height: 12 }} />
                <Button
                  title="Done"
                  variant="secondary"
                  onPress={() => {
                    closeResult(() => {
                      // reset form and ensure balance is refreshed
                      setAmountRaw("");
                      setNote("Top up wallet");
                      setMethod("card");
                      setLastTx(null);
                      refresh();
                    });
                  }}
                />
              </>
            ) : (
              <>
                <View style={{ alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 36 }}>❌</Text>
                </View>
                <AppText variant="h2">Top-up failed</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 6 }}>
                  Something went wrong. Try again or contact support.
                </AppText>

                <View style={{ height: 18 }} />
                <Button
                  title="Retry"
                  variant="primary"
                  onPress={() => {
                    closeResult(() => {
                      setTimeout(() => openSummary(), 120);
                    });
                  }}
                />
                <View style={{ height: 12 }} />
                <Button title="Close" variant="secondary" onPress={() => closeResult()} />
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  balanceWrap: {
    alignItems: "flex-end",
    marginLeft: 12,
  },

  section: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    marginBottom: 8,
    color: colors.textSecondary,
  },

  presetRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
    gap: 10,
    flexWrap: "wrap",
  },
  presetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 6,
  },
  presetBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  methodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: spacing.sm,
  },
  methodCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(111,23,255,0.06)",
  },

  ctaRow: {
    marginTop: spacing.lg,
  },

  /* modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(16,16,24,0.48)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 24,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  pinCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 24,
    alignItems: "center",
  },
  pinRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  pinBox: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: "center",
    fontSize: 24,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
});
