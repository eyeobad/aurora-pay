// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "https://nkhogqggmmfzhlcnyjer.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5raG9ncWdnbW1memhsY255amVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODg1NTQsImV4cCI6MjA4MzI2NDU1NH0.ZfISgO7l1_156-FUX7LCuH_u6uXj1DxSpzWqLES_sts";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
});
