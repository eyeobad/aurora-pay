// src/context/AppContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as LocalAuthentication from "expo-local-authentication";
import {
  signupUser,
  loginUser,
  logout as apiLogout,
  getCurrentUser,
  getTransactionsForUser,
  createTransactionForCurrentUser,
  getBalanceForCurrentUser,
  type User,
  type Transaction,
} from "../lib/api";
import { notifyLocal } from "../lib/notifications";

/**
 * App context types
 */
type AppState = {
  initialized: boolean;
  loading: boolean;
  user: User | null;
  balance: number | null;
  transactions: Transaction[]; // newest first
  preferences: Preferences;
  error?: string | null;
};

type Preferences = {
  biometricsEnabled: boolean;
  showCardNumbers: boolean;
  showAccountNumber: boolean;
  showBalance: boolean;
};

type AppAction =
  | { type: "INIT_START" }
  | { type: "INIT_SUCCESS"; payload: { user: User | null; balance: number | null; transactions: Transaction[] } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload?: string | null }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; balance: number | null; transactions: Transaction[] } }
  | { type: "LOGOUT" }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "REFRESH_BALANCE"; payload: number }
  | { type: "REFRESH_TRANSACTIONS"; payload: Transaction[] }
  | { type: "SET_PREFS"; payload: Preferences }
  | { type: "UPDATE_PREFS"; payload: Partial<Preferences> };

type AppContextValue = {
  state: AppState;
  // actions
  signup: (opts: { name: string; identifier: string; password: string }) => Promise<User>;
  login: (opts: { identifier: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  topUp: (opts: { amount: number; fee?: number; note?: string; skipBiometric?: boolean }) => Promise<Transaction>;
  send: (opts: {
    amount: number;
    fee?: number;
    counterparty?: string;
    note?: string;
    skipBiometric?: boolean;
  }) => Promise<Transaction>;
  request: (opts: { amount: number; note?: string; counterparty?: string }) => Promise<Transaction>;
  confirmBiometric: (reason: string) => Promise<boolean>;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  setShowCardNumbers: (show: boolean) => Promise<boolean>;
  setShowAccountNumber: (show: boolean) => Promise<void>;
  setShowBalance: (show: boolean) => Promise<void>;
  // convenience getters
  getTransactions: () => Transaction[];
};

const PREFS_KEY_PREFIX = "AURORA_PREFS_V1_";
const DEFAULT_PREFS: Preferences = {
  biometricsEnabled: true,
  showCardNumbers: false,
  showAccountNumber: false,
  showBalance: true,
};

const initialState: AppState = {
  initialized: false,
  loading: false,
  user: null,
  balance: null,
  transactions: [],
  preferences: DEFAULT_PREFS,
  error: null,
};

/* ---------------- reducer ---------------- */
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "INIT_START":
      return { ...state, loading: true, error: null };
    case "INIT_SUCCESS":
      return {
        ...state,
        initialized: true,
        loading: false,
        user: action.payload.user,
        balance: action.payload.balance,
        transactions: action.payload.transactions,
        error: null,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload ?? null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        balance: action.payload.balance,
        transactions: action.payload.transactions,
        loading: false,
        error: null,
      };
    case "LOGOUT":
      return { ...initialState, initialized: true }; // keep initialized flag true
    case "ADD_TRANSACTION":
      // keep newest-first ordering (unshift equivalent)
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case "REFRESH_BALANCE":
      return { ...state, balance: action.payload };
    case "REFRESH_TRANSACTIONS":
      return { ...state, transactions: action.payload };
    case "SET_PREFS":
      return { ...state, preferences: action.payload };
    case "UPDATE_PREFS":
      return { ...state, preferences: { ...state.preferences, ...action.payload } };
    default:
      return state;
  }
}

/* ---------------- context ---------------- */
const AppContext = createContext<AppContextValue | undefined>(undefined);

/* ---------------- provider ---------------- */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const formatCurrency = (value: number) => {
    try {
      return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  const readPrefs = useCallback(async (userId: string) => {
    const raw = await AsyncStorage.getItem(`${PREFS_KEY_PREFIX}${userId}`);
    if (!raw) return DEFAULT_PREFS;
    try {
      const parsed = JSON.parse(raw) as Partial<Preferences>;
      return { ...DEFAULT_PREFS, ...parsed };
    } catch {
      return DEFAULT_PREFS;
    }
  }, []);

  const writePrefs = useCallback(async (userId: string, prefs: Preferences) => {
    await AsyncStorage.setItem(`${PREFS_KEY_PREFIX}${userId}`, JSON.stringify(prefs));
  }, []);

  const confirmBiometric = useCallback(
    async (reason: string) => {
      const prefs = state.preferences;
      if (!prefs.biometricsEnabled) return false;

      if (Platform.OS === "web") {
        await notifyLocal("Biometrics unavailable", "Biometric authentication is not supported on web.");
        return false;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !enrolled) {
        await notifyLocal("Biometrics disabled", "No biometrics are enrolled on this device.");
        if (state.user) {
          const next = { ...prefs, biometricsEnabled: false };
          dispatch({ type: "SET_PREFS", payload: next });
          await writePrefs(state.user.id, next);
        }
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: "Cancel",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: true,
      });

      if (!result.success) {
        await notifyLocal("Authentication failed", "Biometric verification did not complete.");
      }
      return result.success;
    },
    [state.preferences, state.user, writePrefs],
  );

  // ask notification permission once
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          await Notifications.requestPermissionsAsync();
        }
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
      } catch {
        // ignore; user may decline
      }
    })();
  }, []);

  // load current user + balance + transactions from Supabase on mount
  const loadSession = useCallback(async () => {
    dispatch({ type: "INIT_START" });
    try {
      const user = await getCurrentUser();
      if (!user) {
        // no logged-in user
        dispatch({ type: "INIT_SUCCESS", payload: { user: null, balance: null, transactions: [] } });
        dispatch({ type: "SET_PREFS", payload: DEFAULT_PREFS });
        return;
      }

      // get transactions & balance
      const [txs, bal] = await Promise.all([getTransactionsForUser(user.id), getBalanceForCurrentUser()]);
      dispatch({ type: "INIT_SUCCESS", payload: { user, balance: bal, transactions: txs } });
      const prefs = await readPrefs(user.id);
      dispatch({ type: "SET_PREFS", payload: prefs });
    } catch (e: any) {
      console.warn("AppProvider: loadSession failed", e);
      dispatch({ type: "SET_ERROR", payload: (e && e.message) || String(e) });
    }
  }, [readPrefs]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  /* ---------- actions ---------- */

  async function signup(opts: { name: string; identifier: string; password: string }) {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const user = await signupUser({ name: opts.name, identifier: opts.identifier, password: opts.password });
      // after signup, load user data
      const txs = await getTransactionsForUser(user.id);
      const bal = await getBalanceForCurrentUser();
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, balance: bal, transactions: txs } });
      const prefs = await readPrefs(user.id);
      dispatch({ type: "SET_PREFS", payload: prefs });
      return user;
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Signup failed" });
      throw e;
    }
  }

  async function login(opts: { identifier: string; password: string }) {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const user = await loginUser({ identifier: opts.identifier, password: opts.password });
      const txs = await getTransactionsForUser(user.id);
      const bal = await getBalanceForCurrentUser();
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, balance: bal, transactions: txs } });
      const prefs = await readPrefs(user.id);
      dispatch({ type: "SET_PREFS", payload: prefs });
      return user;
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Login failed" });
      throw e;
    }
  }

  async function logout() {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await apiLogout();
      dispatch({ type: "LOGOUT" });
      dispatch({ type: "SET_PREFS", payload: DEFAULT_PREFS });
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Logout failed" });
      throw e;
    }
  }

  // refresh in-memory state from Supabase (useful after external changes)
  const refresh = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const user = await getCurrentUser();
      if (!user) {
        dispatch({ type: "INIT_SUCCESS", payload: { user: null, balance: null, transactions: [] } });
        dispatch({ type: "SET_PREFS", payload: DEFAULT_PREFS });
        return;
      }
      const [txs, bal] = await Promise.all([getTransactionsForUser(user.id), getBalanceForCurrentUser()]);
      dispatch({ type: "REFRESH_TRANSACTIONS", payload: txs });
      dispatch({ type: "REFRESH_BALANCE", payload: bal ?? 0 });
      // ensure user object in state (in case it changed)
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, balance: bal ?? 0, transactions: txs } });
      const prefs = await readPrefs(user.id);
      dispatch({ type: "SET_PREFS", payload: prefs });
    } catch (e: any) {
      console.warn("AppContext.refresh error:", e);
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Refresh failed" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [readPrefs]);

  /**
   * topUp action - optimistic UI update then persist via storage
   * returns created transaction
   */
  async function topUp(opts: { amount: number; fee?: number; note?: string; skipBiometric?: boolean }) {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      if (!opts.skipBiometric) {
        const ok = await confirmBiometric("Confirm top up");
        if (!ok) throw new Error("Biometric authentication required.");
      }
      const created = await createTransactionForCurrentUser({
        type: "topup",
        counterparty: "TopUp",
        amount: opts.amount,
        fee: opts.fee,
        note: opts.note ?? "Top up",
      });

      dispatch({ type: "ADD_TRANSACTION", payload: created });
      const bal = await getBalanceForCurrentUser();
      dispatch({ type: "REFRESH_BALANCE", payload: bal ?? 0 });
      await notifyLocal("Top-up complete", `Added ${formatCurrency(created.amount)} to your wallet.`);
      return created;
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Top-up failed" });
      throw e;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  /**
   * send action - create a 'send' transaction
   */
  async function send(opts: {
    amount: number;
    fee?: number;
    counterparty?: string;
    note?: string;
    skipBiometric?: boolean;
  }) {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      if (!opts.skipBiometric) {
        const ok = await confirmBiometric("Confirm payment");
        if (!ok) throw new Error("Biometric authentication required.");
      }
      const created = await createTransactionForCurrentUser({
        type: "send",
        counterparty: opts.counterparty,
        amount: opts.amount,
        fee: opts.fee,
        note: opts.note,
      });

      dispatch({ type: "ADD_TRANSACTION", payload: created });
      const bal = await getBalanceForCurrentUser();
      dispatch({ type: "REFRESH_BALANCE", payload: bal ?? 0 });
      await notifyLocal("Payment sent", `Sent ${formatCurrency(created.amount)} successfully.`);
      return created;
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Send failed" });
      throw e;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  async function request(opts: { amount: number; note?: string; counterparty?: string }) {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const created = await createTransactionForCurrentUser({
        type: "request",
        counterparty: opts.counterparty,
        amount: opts.amount,
        fee: 0,
        note: opts.note,
      });
      dispatch({ type: "ADD_TRANSACTION", payload: created });
      await notifyLocal("Request sent", `Requested ${formatCurrency(created.amount)}.`);
      return created;
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Request failed" });
      throw e;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  // local getter for transactions
  function getTransactions() {
    return state.transactions;
  }

  async function setBiometricsEnabled(enabled: boolean) {
    if (!state.user) {
      dispatch({ type: "UPDATE_PREFS", payload: { biometricsEnabled: enabled } });
      return;
    }
    const next = { ...state.preferences, biometricsEnabled: enabled };
    dispatch({ type: "SET_PREFS", payload: next });
    await writePrefs(state.user.id, next);
  }

  async function setShowCardNumbers(show: boolean) {
    if (!state.user) return false;
    if (show) {
      const ok = await confirmBiometric("Reveal card numbers");
      if (!ok) return false;
    }
    const next = { ...state.preferences, showCardNumbers: show };
    dispatch({ type: "SET_PREFS", payload: next });
    await writePrefs(state.user.id, next);
    return true;
  }

  async function setShowAccountNumber(show: boolean) {
    if (!state.user) return;
    const next = { ...state.preferences, showAccountNumber: show };
    dispatch({ type: "SET_PREFS", payload: next });
    await writePrefs(state.user.id, next);
  }

  async function setShowBalance(show: boolean) {
    if (!state.user) return;
    const next = { ...state.preferences, showBalance: show };
    dispatch({ type: "SET_PREFS", payload: next });
    await writePrefs(state.user.id, next);
  }

  const contextValue: AppContextValue = {
    state,
    signup,
    login,
    logout,
    refresh,
    topUp,
    send,
    request,
    confirmBiometric,
    setBiometricsEnabled,
    setShowCardNumbers,
    setShowAccountNumber,
    setShowBalance,
    getTransactions,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

/* ---------------- hook ---------------- */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
