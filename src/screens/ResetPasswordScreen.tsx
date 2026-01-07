// src/screens/ResetPasswordScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { notifyLocal } from "../lib/notifications";

type Nav = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

const COLORS = {
  primary: "#135bec",
  bg: "#101622",
  surface2: "#192233",
  textMuted2: "#637588",
  white: "#ffffff",
};

function parseParams(url: string) {
  const out: Record<string, string> = {};
  const [base, hashPart] = url.split("#");
  const queryPart = base.split("?")[1] ?? "";
  const combined = [queryPart, hashPart ?? ""].filter(Boolean).join("&");
  combined.split("&").forEach((pair) => {
    if (!pair) return;
    const [k, v] = pair.split("=");
    if (!k) return;
    out[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  });
  return out;
}

export default function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const handleUrl = useCallback(async (url: string) => {
    const params = parseParams(url);
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    if (!accessToken || !refreshToken) return;

    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) {
      await notifyLocal("Reset failed", error.message);
      return;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const init = async () => {
      const initial = await Linking.getInitialURL();
      if (initial) {
        await handleUrl(initial);
      }
    };
    init();

    const sub = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });
    return () => sub.remove();
  }, [handleUrl]);

  const onReset = async () => {
    if (!ready) {
      await notifyLocal("Reset link required", "Open the password reset link sent to your email.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      await notifyLocal("Weak password", "Use at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      await notifyLocal("Passwords do not match", "Please confirm your new password.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await notifyLocal("Password updated", "You can now log in with your new password.");
      await supabase.auth.signOut();
      navigation.navigate("Login");
    } catch (e: any) {
      await notifyLocal("Reset failed", e?.message ?? "Unable to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.topBar}>
          <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios-new" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>RESET PASSWORD</Text>
          <View style={{ width: 48, height: 48 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.h1}>Create a new password</Text>
          <Text style={styles.sub}>Use a strong password you haven&apos;t used before.</Text>

          {!ready ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>Open the reset link sent to your email to continue.</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted2} style={styles.icon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password"
                placeholderTextColor={COLORS.textMuted2}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Confirm Password</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted2} style={styles.icon} />
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirm new password"
                placeholderTextColor={COLORS.textMuted2}
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
            onPress={onReset}
            disabled={loading}
          >
            <Text style={styles.ctaText}>{loading ? "Updating..." : "Update Password"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  shell: { flex: 1, backgroundColor: COLORS.bg, maxWidth: 420, width: "100%", alignSelf: "center" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  topTitle: { color: COLORS.white, fontSize: 12, fontWeight: "900", letterSpacing: 1.2, opacity: 0.9 },

  content: { flex: 1, paddingHorizontal: 24, paddingBottom: 120 },
  h1: { color: COLORS.white, fontSize: 28, fontWeight: "900", letterSpacing: -0.4, textAlign: "center", marginTop: 10 },
  sub: {
    marginTop: 10,
    color: "rgba(154,167,189,0.95)",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
  notice: {
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  noticeText: { color: "rgba(154,167,189,0.95)", fontSize: 13, fontWeight: "700", textAlign: "center" },

  form: { marginTop: 26 },
  label: { color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "800", marginBottom: 10, marginLeft: 6 },
  inputWrap: {
    height: 56,
    borderRadius: 999,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.white, fontSize: 16, fontWeight: "600" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: "rgba(16,22,34,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  ctaBtn: {
    height: 56,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  ctaText: { color: COLORS.white, fontSize: 16, fontWeight: "900", letterSpacing: 0.2 },
});
