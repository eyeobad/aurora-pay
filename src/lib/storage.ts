// src/lib/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/**
 * UUID helper with multiple fallbacks to keep Snack/Expo and local RN working.
 * - Preferred: react-native-get-random-values + uuid (CJS: uuid@8.x)
 * - Fallback: globalThis.crypto.randomUUID()
 * - Final fallback: simple timestamp+random generator (sufficient for demos)
 */
let uuidv4: () => string;

(function initUuid() {
  try {
    // try to require the RN shim + uuid (CJS style). Use require() to avoid ESM import errors in Snack.
    // This will succeed if you've added react-native-get-random-values and uuid@8.x to dependencies.
    // @ts-ignore
    require("react-native-get-random-values");
    // @ts-ignore
    const uuidPkg = require("uuid");
    if (uuidPkg) {
      // uuid v8 exposes v4 directly; some bundlers may put it on default
      const candidate = uuidPkg.v4 || uuidPkg.default?.v4;
      if (typeof candidate === "function") {
        uuidv4 = () => candidate();
        return;
      }
    }
  } catch (e) {
    // ignore and try next fallback
    // console.warn("uuid via react-native-get-random-values not available:", e);
  }

  // fallback to global crypto.randomUUID if available
  if (typeof (globalThis as any)?.crypto?.randomUUID === "function") {
    uuidv4 = () => (globalThis as any).crypto.randomUUID();
    return;
  }

  // final simple fallback for demos (non-crypto)
  uuidv4 = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
})();

/**
 * Data model (simple demo)
 */
export type User = {
  id: string;
  name: string;
  identifier: string; // email or phone
  balance: number; // stored here for quick read (kept in sync with transactions)
  createdAt: string;
};

export type Transaction = {
  id: string;
  userId: string; // owner
  type: "send" | "receive" | "topup" | "refund";
  counterparty?: string; // name or id
  amount: number; // positive numbers for credit/receive, negative for debit/send
  fee: number;
  total: number; // amount + fee for send (can be redundant)
  note?: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
};

/* Keys */
const USERS_KEY = "DEMO_USERS_V1";
const CURRENT_USER_KEY = "DEMO_CURRENT_USER_ID";
const TX_KEY_PREFIX = "DEMO_TXS_USER_"; // append userId

/* Helpers */
async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}
async function writeJson(key: string, value: any) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/* --- User / Auth --- */

/**
 * Creates a new demo user and stores their secret in SecureStore.
 * For secrets (password/pin) we use SecureStore under key `USER_SECRET_{userId}`.
 * Returns created user.
 */
export async function signupUser({
  name,
  identifier, // email or phone
  password, // plaintext only for demo — use SecureStore
}: {
  name: string;
  identifier: string;
  password: string;
}): Promise<User> {
  // load users
  const users = (await readJson<User[]>(USERS_KEY)) ?? [];

  // ensure unique identifier for demo
  const exists = users.find((u) => u.identifier === identifier);
  if (exists) throw new Error("A user with that identifier already exists.");

  const id = uuidv4();
  const user: User = {
    id,
    name,
    identifier,
    balance: 0,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeJson(USERS_KEY, users);

  // store secret securely (do not store password in AsyncStorage)
  // note: SecureStore options differ by platform; using default options is fine for demo
  await SecureStore.setItemAsync(`USER_SECRET_${id}`, password, {});

  // make user current
  await AsyncStorage.setItem(CURRENT_USER_KEY, id);

  // initialize empty tx list
  await writeJson(`${TX_KEY_PREFIX}${id}`, []);

  return user;
}

/**
 * Demo login: find user by identifier and check password in SecureStore
 */
export async function loginUser({
  identifier,
  password,
}: {
  identifier: string;
  password: string;
}): Promise<User> {
  const users = (await readJson<User[]>(USERS_KEY)) ?? [];
  const user = users.find((u) => u.identifier === identifier);
  if (!user) throw new Error("No user found with that identifier.");

  const secret = await SecureStore.getItemAsync(`USER_SECRET_${user.id}`);
  if (!secret || secret !== password) throw new Error("Incorrect password.");

  await AsyncStorage.setItem(CURRENT_USER_KEY, user.id);
  return user;
}

export async function logout() {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
}

/* --- Current user helpers --- */

export async function getCurrentUser(): Promise<User | null> {
  const id = await AsyncStorage.getItem(CURRENT_USER_KEY);
  if (!id) return null;
  const users = (await readJson<User[]>(USERS_KEY)) ?? [];
  return users.find((u) => u.id === id) ?? null;
}

/* --- Transactions --- */

/**
 * Return transaction list for a user (most recent first).
 */
export async function getTransactionsForUser(userId: string): Promise<Transaction[]> {
  const txs = (await readJson<Transaction[]>(`${TX_KEY_PREFIX}${userId}`)) ?? [];
  // newest first
  return txs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Add a transaction and update user's balance atomically (demo).
 * For "send" transaction amount should be positive (we will subtract).
 */
export async function createTransactionForCurrentUser(params: {
  type: Transaction["type"];
  counterparty?: string;
  amount: number; // positive value
  fee?: number;
  note?: string;
}): Promise<Transaction> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No logged-in user.");

  const fee = params.fee ?? Math.max(10, Math.round(params.amount * 0.015 * 100) / 100);
  const total = params.type === "send" ? params.amount + fee : params.amount - fee; // demo logic

  // compute new balance (simple rules for demo)
  let newBalance = user.balance;
  if (params.type === "send") {
    newBalance = +(user.balance - total).toFixed(2);
  } else if (params.type === "receive" || params.type === "topup" || params.type === "refund") {
    newBalance = +(user.balance + params.amount - fee).toFixed(2);
  }

  // build transaction
  const tx: Transaction = {
    id: uuidv4(),
    userId: user.id,
    type: params.type,
    counterparty: params.counterparty,
    amount: params.amount,
    fee,
    total,
    note: params.note,
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  // persist tx
  const key = `${TX_KEY_PREFIX}${user.id}`;
  const txs = (await readJson<Transaction[]>(key)) ?? [];
  txs.unshift(tx);
  await writeJson(key, txs);

  // update user balance in users list
  const users = (await readJson<User[]>(USERS_KEY)) ?? [];
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], balance: newBalance };
    await writeJson(USERS_KEY, users);
  }

  return tx;
}

/* Convenience: get current user's balance */
export async function getBalanceForCurrentUser(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return user.balance ?? 0;
}
