// src/context/AppContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
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

/**
 * App context types
 */
type AppState = {
  initialized: boolean;
  loading: boolean;
  user: User | null;
  balance: number | null;
  transactions: Transaction[]; // newest first
  error?: string | null;
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
  | { type: "REFRESH_TRANSACTIONS"; payload: Transaction[] };

type AppContextValue = {
  state: AppState;
  // actions
  signup: (opts: { name: string; identifier: string; password: string }) => Promise<User>;
  login: (opts: { identifier: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  topUp: (opts: { amount: number; fee?: number; note?: string }) => Promise<Transaction>;
  send: (opts: { amount: number; fee?: number; counterparty?: string; note?: string }) => Promise<Transaction>;
  request: (opts: { amount: number; note?: string; counterparty?: string }) => Promise<Transaction>;
  // convenience getters
  getTransactions: () => Transaction[];
};

const initialState: AppState = {
  initialized: false,
  loading: false,
  user: null,
  balance: null,
  transactions: [],
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

  const notify = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const notifyLocal = async (title: string, body: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    } catch (e) {
      // best-effort: ignore if permissions not granted yet
    }
  };

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
        return;
      }

      // get transactions & balance
      const [txs, bal] = await Promise.all([getTransactionsForUser(user.id), getBalanceForCurrentUser()]);
      dispatch({ type: "INIT_SUCCESS", payload: { user, balance: bal, transactions: txs } });
    } catch (e: any) {
      console.warn("AppProvider: loadSession failed", e);
      dispatch({ type: "SET_ERROR", payload: (e && e.message) || String(e) });
    }
  }, []);

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
        return;
      }
      const [txs, bal] = await Promise.all([getTransactionsForUser(user.id), getBalanceForCurrentUser()]);
      dispatch({ type: "REFRESH_TRANSACTIONS", payload: txs });
      dispatch({ type: "REFRESH_BALANCE", payload: bal ?? 0 });
      // ensure user object in state (in case it changed)
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, balance: bal ?? 0, transactions: txs } });
    } catch (e: any) {
      console.warn("AppContext.refresh error:", e);
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Refresh failed" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  /**
   * topUp action - optimistic UI update then persist via storage
   * returns created transaction
   */
  async function topUp(opts: { amount: number; fee?: number; note?: string }) {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
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
      notify("Top-up complete", `Added ${formatCurrency(created.amount)} to your wallet.`);
      notifyLocal("Top-up complete", `Added ${formatCurrency(created.amount)} to your wallet.`);
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
  async function send(opts: { amount: number; fee?: number; counterparty?: string; note?: string }) {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
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
      notify(
        "Payment sent",
        `Sent ${formatCurrency(created.amount)} to ${created.counterparty ?? "your recipient"}.`,
      );
      notifyLocal("Payment sent", `Sent ${formatCurrency(created.amount)} successfully.`);
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
      notify("Request sent", `Requested ${formatCurrency(created.amount)} from ${created.counterparty ?? "recipient"}.`);
      notifyLocal("Request sent", `Requested ${formatCurrency(created.amount)}.`);
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

  const contextValue: AppContextValue = {
    state,
    signup,
    login,
    logout,
    refresh,
    topUp,
    send,
    request,
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
