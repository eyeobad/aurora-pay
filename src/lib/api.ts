// src/lib/api.ts
import { supabase } from "./supabase";

export type User = {
  id: string;
  name: string;
  identifier: string;
  balance: number;
  accountNumber?: string;
  createdAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  type: "send" | "receive" | "topup" | "refund" | "request";
  counterparty?: string;
  amount: number;
  fee: number;
  total: number;
  note?: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
};

function toUser(row: any): User {
  return {
    id: row?.id ?? "",
    name: row?.name ?? "",
    identifier: row?.identifier ?? "",
    balance: Number(row?.balance ?? 0),
    accountNumber: row?.account_number ?? row?.accountNumber ?? undefined,
    createdAt: row?.created_at ?? row?.createdAt ?? new Date().toISOString(),
  };
}

function toTransaction(row: any): Transaction {
  return {
    id: row?.id ?? "",
    userId: row?.user_id ?? row?.userId ?? "",
    type: row?.type ?? "send",
    counterparty: row?.counterparty ?? undefined,
    amount: Number(row?.amount ?? 0),
    fee: Number(row?.fee ?? 0),
    total: Number(row?.total ?? row?.amount ?? 0),
    note: row?.note ?? undefined,
    status: row?.status ?? "completed",
    createdAt: row?.created_at ?? row?.createdAt ?? new Date().toISOString(),
  };
}

const MIN_FEE = 10;
const FEE_RATE = 0.015;
const ACCOUNT_LEN = 10;

function deriveAccountNumber(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 10000000000;
  }
  const raw = Math.abs(hash) % 10000000000;
  return String(raw).padStart(ACCOUNT_LEN, "0");
}

async function ensureAccountNumber(userId: string, current?: string | null): Promise<string> {
  if (current && String(current).trim()) return String(current);
  const next = deriveAccountNumber(userId);
  try {
    await supabase.from("users").update({ account_number: next }).eq("id", userId);
  } catch {
    // best-effort: return derived value even if update fails
  }
  return next;
}

async function getUserRow(userId: string) {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export async function signupUser({
  name,
  identifier,
  password,
}: {
  name: string;
  identifier: string;
  password: string;
}): Promise<User> {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: identifier,
    password,
    options: {
      data: { name },
    },
  });
  if (signUpError) throw signUpError;

  const userId = authData?.user?.id;
  if (!userId) throw new Error("Supabase signup did not return a user ID.");
  const accountNumber = deriveAccountNumber(userId);

  // If we already have a session (email confirmation off), create the profile row now.
  if (authData.session) {
    await supabase
      .from("users")
      .upsert(
        {
          id: userId,
          name,
          identifier,
          balance: 0,
          account_number: accountNumber,
        },
        { onConflict: "id" },
      )
      .select()
      .maybeSingle();
  }

  return {
    id: userId,
    name,
    identifier,
    balance: 0,
    accountNumber,
    createdAt: new Date().toISOString(),
  };
}

export async function loginUser({
  identifier,
  password,
}: {
  identifier: string;
  password: string;
}): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  });
  if (error) throw error;

  const userId = data?.user?.id;
  if (!userId) throw new Error("Missing user ID after login.");
  const row = await getUserRow(userId);
  if (row) {
    const accountNumber = await ensureAccountNumber(userId, row?.account_number ?? row?.accountNumber);
    return { ...toUser(row), accountNumber };
  }

  // Create profile row if missing (e.g., email confirmation flow or trigger not run)
  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      id: userId,
      name: data.user?.user_metadata?.name ?? data.user?.email ?? identifier,
      identifier: data.user?.email ?? identifier,
      balance: 0,
      account_number: deriveAccountNumber(userId),
    })
    .select()
    .single();
  if (insertError) throw insertError;
  return toUser(created);
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  if (!userId) return null;
  const row = await getUserRow(userId);
  if (row) {
    const accountNumber = await ensureAccountNumber(userId, row?.account_number ?? row?.accountNumber);
    return { ...toUser(row), accountNumber };
  }

  // If profile row is missing but session exists, create it on the fly
  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      id: userId,
      name: data.user?.user_metadata?.name ?? data.user?.email ?? "",
      identifier: data.user?.email ?? "",
      balance: 0,
      account_number: deriveAccountNumber(userId),
    })
    .select()
    .maybeSingle();
  if (insertError || !created) return null;
  return toUser(created);
}

export async function getTransactionsForUser(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toTransaction(row));
}

export async function getBalanceForCurrentUser(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return user.balance;
}

export async function createTransactionForCurrentUser(params: {
  type: Transaction["type"];
  counterparty?: string;
  amount: number;
  fee?: number;
  note?: string;
}): Promise<Transaction> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = authData?.user?.id;
  if (!userId) throw new Error("No logged-in user.");

  const userRow = await getUserRow(userId);
  const currentBalance = Number(userRow?.balance ?? 0);

  const fee = params.fee ?? Math.max(MIN_FEE, Math.round(params.amount * FEE_RATE * 100) / 100);
  const total = params.type === "send" ? params.amount + fee : params.amount - fee;

  let newBalance = currentBalance;
  if (params.type === "send") {
    newBalance = +(currentBalance - total).toFixed(2);
  } else if (params.type === "receive" || params.type === "topup" || params.type === "refund") {
    newBalance = +(currentBalance + params.amount - fee).toFixed(2);
  } else if (params.type === "request") {
    newBalance = currentBalance; // do not change balance for pending requests
  }

  const { data: txData, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      type: params.type,
      counterparty: params.counterparty,
      amount: params.amount,
      fee,
      total,
      note: params.note,
      status: params.type === "request" ? "pending" : "completed",
    })
    .select()
    .single();

  if (txError) throw txError;

  if (params.type !== "request") {
    const { error: balanceError } = await supabase.from("users").update({ balance: newBalance }).eq("id", userId);
    if (balanceError) throw balanceError;
  }

  return toTransaction(txData);
}
