// src/screens/TransactionScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { notifyLocal } from "../lib/notifications";

const COLORS = {
  bg: "#101622",
  surface: "#192233",
  surface2: "#252f45",
  surface3: "#0f1521",
  primary: "#135bec",
  primaryDark: "#0c40a8",
  white: "#ffffff",
  slate: "#92a4c9",
  muted: "rgba(255,255,255,0.55)",
  muted2: "rgba(255,255,255,0.35)",
  border: "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.06)",
  overlay: "rgba(0,0,0,0.55)",
  green: "#4ade80",
};

type RecentPerson = {
  id: string;
  name: string; // display short name like "Alice"
  fullName: string; // "Alice Johnson"
  initials: string;
  online?: boolean;
};

type Bank = {
  id: string;
  name: string;
};

type RecentItem = { id: string; type: "add" } | (RecentPerson & { type: "person" });

const RECENTS: RecentPerson[] = [
  { id: "alice", name: "Alice", fullName: "Alice Johnson", initials: "AJ", online: true },
  { id: "robert", name: "Robert", fullName: "Robert Miles", initials: "RM" },
  { id: "sarah", name: "Sarah", fullName: "Sarah Jenkins", initials: "SJ" },
  { id: "david", name: "David", fullName: "David Park", initials: "DP" },
];

const BANKS: Bank[] = [
  { id: "chase", name: "Chase Bank" },
  { id: "boa", name: "Bank of America" },
  { id: "wells", name: "Wells Fargo" },
  { id: "citi", name: "Citi Bank" },
  { id: "usbank", name: "US Bank" },
];

const ACCOUNT_LEN = 10;
const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Avery", "Casey", "Riley", "Parker", "Cameron", "Reese"];
const LAST_NAMES = ["Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Anderson", "Thomas", "Clark"];

const normalizeAccountNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length >= ACCOUNT_LEN) return digits.slice(-ACCOUNT_LEN);
  return digits.padStart(ACCOUNT_LEN, "0");
};

const isAccountInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const compact = trimmed.replace(/\s/g, "");
  return /^\d+$/.test(compact);
};

const deriveAccountFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 10000000000;
  }
  const raw = Math.abs(hash) % 10000000000;
  return String(raw).padStart(ACCOUNT_LEN, "0");
};

const deriveNameFromAccount = (account: string) => {
  const digits = account.replace(/\D/g, "");
  if (!digits) return "";
  const seed = parseInt(digits.slice(-6), 10);
  const first = FIRST_NAMES[seed % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(seed / FIRST_NAMES.length) % LAST_NAMES.length];
  return `${first} ${last}`;
};

export default function TransactionScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { state, send, refresh, confirmBiometric } = useApp();

  const balance = state.balance ?? 0;

  // UI state
  const [toQuery, setToQuery] = useState("");
  const [selected, setSelected] = useState<RecentPerson | null>(null);
  const prefill = route.params?.accountNumber ?? route.params?.recipient ?? "";
  const [bankOpen, setBankOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  useEffect(() => {
    if (prefill) {
      setToQuery(prefill);
      setSelected(null);
    }
  }, [prefill]);

  const recipientInput = toQuery.trim() || selected?.fullName || "";
  const derivedRecipient = useMemo(() => {
    if (!recipientInput) return { name: "", accountNumber: "" };
    if (isAccountInput(recipientInput)) {
      const normalized = normalizeAccountNumber(recipientInput);
      return {
        name: deriveNameFromAccount(normalized),
        accountNumber: normalized,
      };
    }
    return {
      name: recipientInput,
      accountNumber: deriveAccountFromName(recipientInput),
    };
  }, [recipientInput]);

  const recentsData = useMemo<RecentItem[]>(
    () => [{ id: "add", type: "add" }, ...RECENTS.map((p) => ({ ...p, type: "person" as const }))],
    [],
  );

  // keypad amount
  const [amountStr, setAmountStr] = useState<string>("150"); // matches your screenshot default
  const amount = useMemo(() => {
    const n = parseFloat(amountStr || "0");
    return Number.isFinite(n) ? n : 0;
  }, [amountStr]);

  const whole = useMemo(() => String(Math.floor(amount)), [amount]);
  const cents = useMemo(() => {
    const dec = Math.round((amount - Math.floor(amount)) * 100);
    return `.${String(dec).padStart(2, "0")}`;
  }, [amount]);

  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);

  // PIN + result
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const pinRefs = [
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
    useRef<TextInput | null>(null),
  ];

  const [resultOpen, setResultOpen] = useState(false);
  const [resultSuccess, setResultSuccess] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);

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

  // keypad logic (max 2 decimals)
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

      if (prev.includes(".")) {
        const [a, b = ""] = prev.split(".");
        if (b.length >= 2) return prev;
        return `${a}.${b}${key}`;
      }

      // limit length so it doesn't overflow
      if (prev.length >= 7) return prev;
      return prev + key;
    });
  };

  const onPickRecent = async (p: RecentPerson) => {
    await hapticLight();
    setSelected(p);
    setToQuery(p.fullName);
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

  const validate = () => {
    if (!selected && !toQuery.trim()) return "Please enter a recipient or pick from recent.";
    if (!selectedBank) return "Select a bank to continue.";
    if (amount <= 0) return "Enter an amount greater than 0.";
    if (amount > balance) return "Insufficient wallet balance.";
    return null;
  };

  const performSend = async (skipBiometric: boolean) => {
    setSending(true);
    try {
      await hapticSuccess();

      await send({
        amount,
        fee: 0,
        counterparty: derivedRecipient.name || recipientInput,
        note: note.trim(),
        skipBiometric,
      });

      await refresh();

      setResultSuccess(true);
      setResultOpen(true);
    } catch (e) {
      console.warn("Send failed:", e);
      setResultSuccess(false);
      setResultOpen(true);
    } finally {
      setPinOpen(false);
      clearPin();
      setSending(false);
    }
  };

  const onSendPress = async () => {
    const err = validate();
    if (err) {
      await notifyLocal("Validation", err);
      return;
    }

    setConfirmOpen(true);
  };

  const onConfirmPress = async () => {
    setConfirmOpen(false);
    const ok = await confirmBiometric("Confirm payment");
    if (ok) {
      await performSend(true);
      return;
    }

    await hapticLight();
    clearPin();
    setPinOpen(true);
  };

  const doSend = async () => {
    const code = pin.join("");
    if (code.length !== 4) {
      await notifyLocal("Invalid PIN", "Enter your 4-digit PIN.");
      return;
    }
    await performSend(true);
  };

  const topSpacer = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: 16 + topSpacer }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back-ios-new" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scroll content */}
      <View style={styles.content}>
        {/* To */}
        <Text style={styles.label}>To</Text>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.35)" />
          <TextInput
            value={toQuery}
            onChangeText={(t) => {
              setToQuery(t);
              if (!t) setSelected(null);
            }}
            placeholder="Name, $Cashtag, or Phone"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => nav.navigate?.("Scanner")}
            activeOpacity={0.85}
          >
            <MaterialIcons name="qr-code-scanner" size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Bank</Text>
        <TouchableOpacity style={styles.bankRow} activeOpacity={0.85} onPress={() => setBankOpen(true)}>
          <View style={styles.bankLeft}>
            <MaterialIcons name="account-balance" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={[styles.bankText, !selectedBank && styles.bankPlaceholder]}>
              {selectedBank?.name ?? "Select bank"}
            </Text>
          </View>
          <MaterialIcons name="expand-more" size={22} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* Recent */}
        <Text style={[styles.label, { marginTop: 18 }]}>Recent</Text>
        <FlatList
          horizontal
          data={recentsData}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentsRow}
          ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
          renderItem={({ item }) => {
            if (item.type === "add") {
              return (
                <View style={styles.recentItem}>
                  <TouchableOpacity
                    style={styles.addCircle}
                    activeOpacity={0.85}
                    onPress={() => notifyLocal("Add", "Add new contact (demo).")}
                  >
                    <MaterialIcons name="add" size={26} color="rgba(255,255,255,0.35)" />
                  </TouchableOpacity>
                  <Text style={[styles.recentName, { opacity: 0 }]}>Add</Text>
                </View>
              );
            }

            const active = selected?.id === item.id;
            return (
              <View style={styles.recentItem}>
                <TouchableOpacity
                  style={[styles.avatarCircle, active && styles.avatarActive]}
                  onPress={() => onPickRecent(item)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.avatarText}>{item.initials}</Text>
                  {item.online ? <View style={styles.onlineDot} /> : null}
                </TouchableOpacity>
                <Text style={styles.recentName}>{item.name}</Text>
              </View>
            );
          }}
        />

        {/* Currency pill */}
        <TouchableOpacity
          style={styles.currencyPill}
          activeOpacity={0.9}
          onPress={() => notifyLocal("Currency", "USD only (demo).")}
        >
          <View style={styles.currencyDot}>
            <Text style={styles.currencyDotText}>$</Text>
          </View>
          <Text style={styles.currencyText}>USD</Text>
          <MaterialIcons name="expand-more" size={18} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>

        {/* Big amount */}
        <View style={styles.amountWrap}>
          <Text style={styles.amountDollar}>$</Text>
          <Text style={styles.amountWhole}>{whole}</Text>
          <Text style={styles.amountCents}>{cents}</Text>
        </View>

        {/* Add note */}
        <TouchableOpacity style={styles.noteBtn} activeOpacity={0.85} onPress={() => setNoteOpen(true)}>
          <MaterialCommunityIcons name="note-edit-outline" size={18} color={COLORS.primary} />
          <Text style={styles.noteText}>{note ? "Edit note" : "Add note"}</Text>
        </TouchableOpacity>

        {/* Available balance */}
        <Text style={styles.balanceText}>
          Available Balance: <Text style={{ color: "#fff", fontWeight: "900" }}>{formatMoney(balance)}</Text>
        </Text>
      </View>

      {/* Bottom keypad + action */}
      <View style={styles.bottomPanel}>
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

        <View style={styles.sendWrap}>
          <TouchableOpacity style={styles.sendBtn} onPress={onSendPress} activeOpacity={0.92}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Text style={styles.sendText}>Send</Text>
              <Text style={styles.sendAmount}>{formatMoney(amount)}</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* LOADING MODAL */}
      <Modal visible={sending} transparent animationType="fade">
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingTitle}>Processing transfer</Text>
            <Text style={styles.loadingSub}>Finalizing your payment...</Text>
          </View>
        </View>
      </Modal>

      {/* BANK SHEET */}
      <Modal visible={bankOpen} transparent animationType="fade" onRequestClose={() => setBankOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setBankOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choose bank</Text>
            {BANKS.map((bank) => {
              const active = selectedBank?.id === bank.id;
              return (
                <TouchableOpacity
                  key={bank.id}
                  style={[styles.bankItem, active && styles.bankItemActive]}
                  onPress={() => {
                    setSelectedBank(bank);
                    setBankOpen(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bankItemText}>{bank.name}</Text>
                  {active ? (
                    <MaterialIcons name="check-circle" size={20} color={COLORS.green} />
                  ) : (
                    <MaterialIcons name="radio-button-unchecked" size={20} color="rgba(255,255,255,0.3)" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CONFIRM BANK INFO */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setConfirmOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Confirm bank info</Text>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Recipient</Text>
              <Text style={styles.confirmValue}>{derivedRecipient.name || recipientInput}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Bank</Text>
              <Text style={styles.confirmValue}>{selectedBank?.name ?? "—"}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Account Number</Text>
              <Text style={styles.confirmValue}>{derivedRecipient.accountNumber || "—"}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Amount</Text>
              <Text style={styles.confirmValue}>{formatMoney(amount)}</Text>
            </View>

            <TouchableOpacity style={styles.sheetDone} onPress={onConfirmPress} activeOpacity={0.9}>
              <Text style={styles.sheetDoneText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pinCancel} onPress={() => setConfirmOpen(false)} activeOpacity={0.85}>
              <Text style={styles.pinCancelText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* NOTE MODAL */}
      <Modal visible={noteOpen} transparent animationType="fade" onRequestClose={() => setNoteOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setNoteOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.noteInput}
              multiline
            />
            <TouchableOpacity style={styles.sheetDone} onPress={() => setNoteOpen(false)} activeOpacity={0.9}>
              <Text style={styles.sheetDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PIN MODAL */}
      <Modal visible={pinOpen} transparent animationType="fade" onRequestClose={() => setPinOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPinOpen(false)}>
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

            <View style={{ height: 12 }} />

            <TouchableOpacity style={styles.pinConfirm} onPress={doSend} activeOpacity={0.92}>
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

      {/* RESULT MODAL */}
      <Modal visible={resultOpen} transparent animationType="fade" onRequestClose={() => setResultOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setResultOpen(false)}>
          <View style={styles.resultCard}>
            <Text style={{ fontSize: 36, textAlign: "center" }}>{resultSuccess ? "✅" : "❌"}</Text>
            <Text style={styles.resultTitle}>{resultSuccess ? "Sent successfully" : "Send failed"}</Text>
            <Text style={styles.resultSub}>
              {resultSuccess ? "Your transfer was completed." : "Something went wrong. Please try again."}
            </Text>

            <View style={{ height: 14 }} />

            <TouchableOpacity
              style={styles.sheetDone}
              onPress={() => {
                setResultOpen(false);
                if (resultSuccess) {
                  // reset
                  setToQuery("");
                  setSelected(null);
                  setNote("");
                  setAmountStr("0");
                }
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.sheetDoneText}>Done</Text>
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
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  label: {
    color: COLORS.slate,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 4,
    marginBottom: 8,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(50,68,103,0.75)",
    paddingLeft: 14,
    paddingRight: 6,
    height: 54,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 10,
  },
  qrBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },

  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(50,68,103,0.75)",
    paddingHorizontal: 14,
    height: 52,
  },
  bankLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bankText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  bankPlaceholder: {
    color: "rgba(255,255,255,0.45)",
  },

  recentsRow: {
    flexDirection: "row",
    paddingBottom: 6,
    alignItems: "flex-start",
  },
  recentItem: {
    alignItems: "center",
    width: 70,
  },
  addCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(50,68,103,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarActive: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "900",
  },
  onlineDot: {
    position: "absolute",
    right: 3,
    bottom: 3,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  recentName: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },

  currencyPill: {
    alignSelf: "center",
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currencyDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyDotText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
  currencyText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },

  amountWrap: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amountDollar: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 40,
    fontWeight: "900",
    marginRight: 6,
    marginBottom: 10,
  },
  amountWhole: {
    color: "#fff",
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 82,
  },
  amountCents: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 48,
    fontWeight: "900",
    marginBottom: 8,
    marginLeft: 6,
  },

  noteBtn: {
    alignSelf: "center",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  noteText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 14,
  },

  balanceText: {
    textAlign: "center",
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },

  bottomPanel: {
    backgroundColor: COLORS.surface3,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: -10 },
    elevation: 16,
  },
  keypad: {
    paddingHorizontal: 22,
    paddingTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  key: {
    width: "30%",
    height: 62,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },

  sendWrap: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
  },
  sendBtn: {
    height: 56,
    borderRadius: 999,
    overflow: "hidden",
  },
  sendGradient: {
    flex: 1,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  sendText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  sendAmount: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    fontWeight: "700",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  noteInput: {
    backgroundColor: "rgba(25,34,51,0.92)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: 14,
    minHeight: 90,
    fontSize: 14,
    fontWeight: "600",
  },
  sheetDone: {
    marginTop: 12,
    height: 52,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDoneText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(25,34,51,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 10,
  },
  bankItemActive: {
    borderColor: "rgba(19,91,236,0.7)",
    backgroundColor: "rgba(19,91,236,0.12)",
  },
  bankItemText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  confirmLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  confirmValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    maxWidth: "70%",
    textAlign: "right",
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

  resultCard: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  resultTitle: {
    marginTop: 8,
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  resultSub: {
    marginTop: 6,
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  loadingBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    gap: 10,
  },
  loadingTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 6,
  },
  loadingSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
