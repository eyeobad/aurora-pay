// src/context/AppContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import {
  signupUser,
  loginUser,
  logout as storageLogout,
  getCurrentUser,
  getTransactionsForUser,
  createTransactionForCurrentUser,
  getBalanceForCurrentUser,
  type User as StorageUser,
  type Transaction as StorageTransaction,
} from "../lib/storage";

/**
 * App context types
 */
type AppState = {
  initialized: boolean;
  loading: boolean;
  user: StorageUser | null;
  balance: number | null;
  transactions: StorageTransaction[]; // newest first
  error?: string | null;
};

type AppAction =
  | { type: "INIT_START" }
  | { type: "INIT_SUCCESS"; payload: { user: StorageUser | null; balance: number | null; transactions: StorageTransaction[] } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload?: string | null }
  | { type: "LOGIN_SUCCESS"; payload: { user: StorageUser; balance: number | null; transactions: StorageTransaction[] } }
  | { type: "LOGOUT" }
  | { type: "ADD_TRANSACTION"; payload: StorageTransaction }
  | { type: "REFRESH_BALANCE"; payload: number }
  | { type: "REFRESH_TRANSACTIONS"; payload: StorageTransaction[] };

type AppContextValue = {
  state: AppState;
  // actions
  signup: (opts: { name: string; identifier: string; password: string }) => Promise<StorageUser>;
  login: (opts: { identifier: string; password: string }) => Promise<StorageUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  topUp: (opts: { amount: number; fee?: number; note?: string }) => Promise<StorageTransaction>;
  send: (opts: { amount: number; fee?: number; counterparty?: string; note?: string }) => Promise<StorageTransaction>;
  // convenience getters
  getTransactions: () => StorageTransaction[];
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

  // load current user + balance + transactions from storage on mount
  const loadFromStorage = useCallback(async () => {
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
      console.warn("AppProvider: loadFromStorage failed", e);
      dispatch({ type: "SET_ERROR", payload: (e && e.message) || String(e) });
    }
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

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
      await storageLogout();
      dispatch({ type: "LOGOUT" });
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Logout failed" });
      throw e;
    }
  }

  // refresh in-memory state from storage (useful after external changes)
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
      // create transaction via storage helper (which also updates stored user balance)
      const created = await createTransactionForCurrentUser({
        type: "topup",
        counterparty: "TopUp",
        amount: opts.amount,
        fee: opts.fee,
        note: opts.note ?? "Top up",
      });

      // Optimistically add to in-memory list and refresh balance from storage
      dispatch({ type: "ADD_TRANSACTION", payload: created });
      const bal = await getBalanceForCurrentUser();
      dispatch({ type: "REFRESH_BALANCE", payload: bal ?? 0 });

      dispatch({ type: "SET_LOADING", payload: false });
      return created;
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Top-up failed" });
      dispatch({ type: "SET_LOADING", payload: false });
      throw e;
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

      // add to list and refresh balance
      dispatch({ type: "ADD_TRANSACTION", payload: created });
      const bal = await getBalanceForCurrentUser();
      dispatch({ type: "REFRESH_BALANCE", payload: bal ?? 0 });

      dispatch({ type: "SET_LOADING", payload: false });
      return created;
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e?.message ?? "Send failed" });
      dispatch({ type: "SET_LOADING", payload: false });
      throw e;
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
