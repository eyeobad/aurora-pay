// src/screens/TransactionScreen.tsx
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
  Alert,
  StatusBar,
  Modal,
  TextInput,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppText, Input, Button, IconButton } from "../components";
import { colors, spacing, radius } from "../components/tokens";

import { useApp } from "../context/AppContext";

type Nav = {
  navigate: (name: string, params?: any) => void;
};

type Recipient = {
  id: string;
  name: string;
  subtitle?: string;
  avatarUri?: string;
};

const SAMPLE_RECIPIENTS: Recipient[] = [
  { id: "r1", name: "Alice Johnson", subtitle: "Bank transfer" },
  { id: "r2", name: "John Doe", subtitle: "Saved contact" },
  { id: "r3", name: "Shopmart", subtitle: "Merchant" },
];

export default function TransactionScreen() {
  const nav = useNavigation<Nav>();
  const { state, send, refresh } = useApp();

  // entrance anim
  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [appear]);

  // form state
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  const [amountRaw, setAmountRaw] = useState<string>(""); // unformatted
  const [note, setNote] = useState<string>("");
  const [method, setMethod] = useState<"wallet" | "card" | "bank">("wallet");

  // modal state
  const [showSummary, setShowSummary] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultSuccess, setResultSuccess] = useState<boolean | null>(null);
  const [lastTxSummary, setLastTxSummary] = useState<any | null>(null); // store returned tx

  // pin inputs
  const [pin, setPin] = useState(["", "", "", ""]);
  const pinInputs = [
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
  ];

  // animations for modals
  const summaryAnim = useRef(new Animated.Value(0)).current; // 0 hidden -> 1 visible
  const pinAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  // fee params
  const FEE_PERCENT = 0.015; // 1.5%
  const MIN_FEE = 10; // currency units

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
  const fee = Math.max(MIN_FEE, Math.round((amount * FEE_PERCENT) * 100) / 100);
  const total = amount > 0 ? amount + fee : 0;

  // presets
  const presets = [10, 25, 50, 100];

  // wallet balance comes from context state
  const walletBalance = state.balance ?? null;
  const loading = state.loading ?? false;

  // recipient helpers
  function toggleRecipientDropdown() {
    setShowRecipientDropdown((s) => !s);
  }

  function pickRecipient(r: Recipient) {
    setRecipient(r);
    setShowRecipientDropdown(false);
  }

  function onPressPreset(value: number) {
    setAmountRaw(String(value));
  }

  function selectMethod(m: "wallet" | "card" | "bank") {
    setMethod(m);
  }

  function onConfirmCTA() {
    const err = validate();
    if (err) {
      Alert.alert("Validation", err);
      return;
    }
    openSummaryModal();
  }

  function validate() {
    if (!recipient) return "Please choose a recipient.";
    if (amount <= 0) return "Enter an amount greater than 0.";
    if (method === "wallet" && walletBalance !== null && total > walletBalance) return "Insufficient wallet balance.";
    return null;
  }

  // Modal animation helpers
  function openSummaryModal() {
    setShowSummary(true);
    summaryAnim.setValue(0);
    Animated.timing(summaryAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }
  function closeSummaryModal(cb?: () => void) {
    Animated.timing(summaryAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setShowSummary(false);
      if (cb) cb();
    });
  }

  function openPinModal() {
    setShowPinModal(true);
    pinAnim.setValue(0);
    Animated.timing(pinAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }
  function closePinModal(cb?: () => void) {
    Animated.timing(pinAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setShowPinModal(false);
      if (cb) cb();
    });
  }

  function openResultModal(success: boolean) {
    setResultSuccess(success);
    setShowResultModal(true);
    resultAnim.setValue(0);
    Animated.timing(resultAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }
  function closeResultModal(cb?: () => void) {
    Animated.timing(resultAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setShowResultModal(false);
      setResultSuccess(null);
      if (cb) cb();
    });
  }

  // PIN handling helpers
  function onPinChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1); // only last char
    const next = [...pin];
    next[index] = value.replace(/[^0-9]/g, "");
    setPin(next);
    if (value && index < 3) {
      const nextInput = pinInputs[index + 1].current;
      nextInput?.focus();
    }
    if (!value && index > 0) {
      const prevInput = pinInputs[index - 1].current;
      prevInput?.focus();
    }
  }

  function clearPin() {
    setPin(["", "", "", ""]);
    pinInputs[0].current?.focus();
  }

  // handle confirm inside summary -> close summary then open PIN with transition
  function onSummaryConfirm() {
    closeSummaryModal(() => {
      // small delay so closing animation finishes
      setTimeout(() => {
        clearPin();
        openPinModal();
      }, 110);
    });
  }

  // perform send using context's send()
  async function handleSend() {
    const code = pin.join("");
    if (code.length !== 4) {
      Alert.alert("Invalid PIN", "Enter your 4-digit PIN to confirm.");
      return;
    }

    try {
      // call send action from context — it updates storage and app state
      const created = await send({
        amount,
        fee,
        counterparty: recipient?.name,
        note,
      });

      setLastTxSummary(created);

      // close pin modal then show success
      closePinModal(() => {
        setTimeout(() => {
          openResultModal(true);
        }, 140);
      });

      // ensure context state is fully refreshed (transactions & balance)
      // refresh() is safe to call — AppContext already updates state; this is idempotent 
      await refresh();
    } catch (e: any) {
      console.warn("Transaction failed:", e);
      // close pin modal then show failure modal
      closePinModal(() => {
        setTimeout(() => {
          openResultModal(false);
        }, 140);
      });
    } finally {
      clearPin();
    }
  }

  function onDownloadReceipt() {
    // demo alert — implement actual file generation if needed
    Alert.alert("Download", "Receipt download started (demo).");
  }

  // small top spacer amount — use StatusBar.currentHeight on Android for safe offset
  const topSpacer = Platform.OS === "android" ? (StatusBar.currentHeight ?? 12) : 12;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Add a tiny spacer so header text doesn't overlap the status bar */}
        <View style={{ paddingTop: topSpacer, backgroundColor: "transparent", flex: 1 }}>
          <Animated.View
            style={[
              styles.container,
              {
                opacity: appear,
                transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              },
            ]}
          >
            <AppText variant="h1" style={styles.title}>
              Send Money
            </AppText>
            <AppText variant="caption" style={styles.subtitle}>
              Securely transfer funds to your contacts or merchants.
            </AppText>

            {/* Recipient selector */}
            <View style={styles.section}>
              <AppText variant="caption" style={styles.sectionLabel}>
                Recipient
              </AppText>

              <View>
                <TouchableOpacity style={styles.recipientPicker} onPress={toggleRecipientDropdown} accessibilityRole="button">
                  {recipient ? (
                    <View style={{ flex: 1 }}>
                      <AppText variant="body">{recipient.name}</AppText>
                      <AppText variant="caption" style={{ color: colors.textSecondary }}>
                        {recipient.subtitle}
                      </AppText>
                    </View>
                  ) : (
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>
                      Tap to choose a recipient
                    </AppText>
                  )}
                  <IconButton size={36} onPress={toggleRecipientDropdown}>
                    <AppText variant="button" style={{ color: colors.primary }}>
                      ➕
                    </AppText>
                  </IconButton>
                </TouchableOpacity>

                {/* Dropdown */}
                {showRecipientDropdown && (
                  <View style={styles.dropdown}>
                    {SAMPLE_RECIPIENTS.map((r) => (
                      <TouchableOpacity key={r.id} style={styles.dropdownItem} onPress={() => pickRecipient(r)} accessibilityRole="button">
                        <View>
                          <AppText variant="body">{r.name}</AppText>
                          <AppText variant="caption" style={{ color: colors.textSecondary }}>
                            {r.subtitle}
                          </AppText>
                        </View>
                        <AppText variant="caption" style={{ color: colors.primary }}>
                          Select
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* quick picks */}
              <View style={styles.presetRow}>
                {presets.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.presetBtn, amount === p && styles.presetBtnActive]}
                    onPress={() => onPressPreset(p)}
                    accessibilityRole="button"
                  >
                    <AppText variant="button" style={amount === p ? { color: "#fff" } : undefined}>
                      {formatCurrency(p)}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount input */}
            <View style={styles.section}>
              <AppText variant="caption" style={styles.sectionLabel}>
                Amount
              </AppText>
              <Input placeholder="0.00" value={amountRaw} onChangeText={setAmountRaw} keyboardType="numeric" isCurrency currency="USD" />
              <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 6 }}>
                Fee: {formatCurrency(fee)} • Total: {formatCurrency(total)}
              </AppText>
            </View>

            {/* Payment method */}
            <View style={styles.section}>
              <AppText variant="caption" style={styles.sectionLabel}>
                Payment method
              </AppText>

              <View style={styles.methodRow}>
                <TouchableOpacity
                  style={[styles.methodCard, method === "wallet" && styles.methodCardActive]}
                  onPress={() => selectMethod("wallet")}
                  accessibilityRole="button"
                >
                  <AppText variant="body">Wallet</AppText>
                  <AppText variant="caption" style={{ color: colors.textSecondary }}>
                    Balance: {walletBalance !== null ? formatCurrency(walletBalance) : "—"}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.methodCard, method === "card" && styles.methodCardActive]}
                  onPress={() => selectMethod("card")}
                  accessibilityRole="button"
                >
                  <AppText variant="body">Card</AppText>
                  <AppText variant="caption" style={{ color: colors.textSecondary }}>
                    Visa •••• 4242
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.methodCard, method === "bank" && styles.methodCardActive]}
                  onPress={() => selectMethod("bank")}
                  accessibilityRole="button"
                >
                  <AppText variant="body">Bank</AppText>
                  <AppText variant="caption" style={{ color: colors.textSecondary }}>
                    ACH / Bank transfer
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Note */}
            <View style={styles.section}>
              <AppText variant="caption" style={styles.sectionLabel}>
                Note (optional)
              </AppText>
              <Input placeholder="Add a note (e.g., Rent, Groceries)" value={note} onChangeText={setNote} />
            </View>

            {/* Confirm CTA */}
            <View style={styles.ctaRow}>
              <Button title="Confirm & Continue" variant="primary" onPress={onConfirmCTA} loading={loading} />
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* SUMMARY MODAL */}
      <Modal visible={showSummary} transparent onRequestClose={() => closeSummaryModal()}>
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: summaryAnim,
                transform: [
                  {
                    scale: summaryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }),
                  },
                  {
                    translateY: summaryAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
                  },
                ],
              },
            ]}
          >
            <AppText variant="h2">Confirm transfer</AppText>
            <View style={{ height: 12 }} />
            <AppText variant="caption">You are about to send</AppText>

            <View style={{ marginTop: 12, marginBottom: 12 }}>
              <AppText variant="h1" style={{ color: colors.textPrimary }}>
                {formatCurrency(amount)}
              </AppText>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                To {recipient?.name ?? "—"}
              </AppText>
            </View>

            <View style={styles.summaryRow}>
              <AppText variant="caption">Method</AppText>
              <AppText variant="caption">{method.toUpperCase()}</AppText>
            </View>

            <View style={styles.summaryRow}>
              <AppText variant="caption">Fee</AppText>
              <AppText variant="caption">{formatCurrency(fee)}</AppText>
            </View>

            <View style={styles.summaryRow}>
              <AppText variant="caption">Total</AppText>
              <AppText variant="caption">{formatCurrency(total)}</AppText>
            </View>

            {note ? (
              <View style={{ marginTop: 12 }}>
                <AppText variant="caption">Note</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>
                  {note}
                </AppText>
              </View>
            ) : null}

            <View style={{ height: 18 }} />

            <Button
              title="Confirm"
              variant="primary"
              onPress={() => {
                // close summary (animated) then open PIN modal
                onSummaryConfirm();
              }}
            />
            <View style={{ height: 12 }} />
            <Button title="Cancel" variant="secondary" onPress={() => closeSummaryModal()} />
          </Animated.View>
        </View>
      </Modal>

      {/* PIN MODAL */}
      <Modal visible={showPinModal} transparent onRequestClose={() => closePinModal()}>
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.pinCard,
              {
                opacity: pinAnim,
                transform: [
                  { scale: pinAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
                  { translateY: pinAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                ],
              },
            ]}
          >
            <AppText variant="h2">Enter PIN</AppText>
            <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 8 }}>
              Enter your 4-digit PIN to authorize the transfer
            </AppText>

            <View style={styles.pinRow}>
              {pin.map((p, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => (pinInputs[i].current = ref)}
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

            <Button title="Send" variant="primary" onPress={handleSend} loading={loading} />
            <View style={{ height: 12 }} />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => {
                closePinModal(() => {
                  // reopen summary so user can edit if they want
                  setTimeout(() => openSummaryModal(), 120);
                });
              }}
            />
          </Animated.View>
        </View>
      </Modal>

      {/* RESULT MODAL (success / failure) */}
      <Modal visible={showResultModal} transparent onRequestClose={() => closeResultModal()}>
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
                <AppText variant="h2">Transfer successful</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 6 }}>
                  Your transfer was completed.
                </AppText>

                <View style={{ height: 12 }} />

                <View style={styles.summaryRow}>
                  <AppText variant="caption">Recipient</AppText>
                  <AppText variant="caption">{lastTxSummary?.counterparty ?? recipient?.name}</AppText>
                </View>
                <View style={styles.summaryRow}>
                  <AppText variant="caption">Amount</AppText>
                  <AppText variant="caption">{lastTxSummary ? formatCurrency(lastTxSummary.amount) : formatCurrency(amount)}</AppText>
                </View>
                <View style={styles.summaryRow}>
                  <AppText variant="caption">Fee</AppText>
                  <AppText variant="caption">{lastTxSummary ? formatCurrency(lastTxSummary.fee) : formatCurrency(fee)}</AppText>
                </View>
                {lastTxSummary?.note || note ? (
                  <View style={{ marginTop: 8 }}>
                    <AppText variant="caption">Note</AppText>
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>
                      {lastTxSummary?.note ?? note}
                    </AppText>
                  </View>
                ) : null}

                <View style={{ height: 18 }} />
                <Button title="Download receipt" variant="primary" onPress={onDownloadReceipt} />
                <View style={{ height: 12 }} />
                <Button
                  title="Done"
                  variant="secondary"
                  onPress={() => {
                    closeResultModal(() => {
                      // reset form
                      setRecipient(null);
                      setAmountRaw("");
                      setNote("");
                      setMethod("wallet");
                      setLastTxSummary(null);
                    });
                  }}
                />
              </>
            ) : (
              <>
                <View style={{ alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 36 }}>❌</Text>
                </View>
                <AppText variant="h2">Transfer failed</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 6 }}>
                  Something went wrong. Try again later or contact support.
                </AppText>

                <View style={{ height: 18 }} />
                <Button
                  title="Retry"
                  variant="primary"
                  onPress={() => {
                    closeResultModal(() => {
                      setTimeout(() => openSummaryModal(), 120);
                    });
                  }}
                />
                <View style={{ height: 12 }} />
                <Button title="Close" variant="secondary" onPress={() => closeResultModal()} />
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
    paddingBottom: 24,
  },
  title: {
    marginBottom: 6,
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  section: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    marginBottom: 8,
    color: colors.textSecondary,
  },

  recipientPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "space-between",
  },

  dropdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  dropdownItem: {
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  presetRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
    gap: 10,
  },
  presetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
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

  /* modal styles */
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
