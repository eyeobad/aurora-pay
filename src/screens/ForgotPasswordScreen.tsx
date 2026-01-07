// src/screens/ForgotPasswordScreen.tsx
import React, { useState } from "react";
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
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  surface: "#151c2a",
  surface2: "#192233",
  ring: "rgba(255,255,255,0.08)",
  textMuted: "#92a4c9",
  textMuted2: "#637588",
  white: "#ffffff",
  gray: "#9aa7bd",
};

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSend = async () => {
    if (!email.trim()) {
      await notifyLocal("Email required", "Please enter your email address.");
      return;
    }

    const looksValid = /\S+@\S+\.\S+/.test(email.trim());
    if (!looksValid) {
      await notifyLocal("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const redirectTo = Linking.createURL("reset-password");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      await notifyLocal("Sent!", "Password reset instructions have been sent to your email.");
    } catch (e: any) {
      await notifyLocal("Reset failed", e?.message ?? "Unable to send reset instructions.");
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

          <Text style={styles.topTitle}>PASSWORD RECOVERY</Text>

          <View style={{ width: 48, height: 48 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.heroWrap}>
            <View style={styles.heroCircle}>
              <MaterialIcons name="lock-reset" size={64} color={COLORS.primary} />
              <View style={styles.dot1} />
              <View style={styles.dot2} />
            </View>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.h1}>Forgot Password?</Text>
            <Text style={styles.sub}>
              Don&apos;t worry, it happens. Please enter the email address associated with your account.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="email-outline" size={22} color={COLORS.textMuted2} style={styles.mailIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={COLORS.textMuted2}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={onSend}
                style={styles.input}
              />
            </View>

            <View style={styles.helpRow}>
              <Text style={styles.helpText}>Remember your password? </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate("Login")}>
                <Text style={styles.helpLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
            onPress={onSend}
            disabled={loading}
          >
            <Text style={styles.ctaText}>{loading ? "Sending..." : "Send Instructions"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => notifyLocal("Try another way", "Hook this up to alternate recovery methods.")}
          >
            <Text style={styles.tryAnother}>Try another way</Text>
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
  heroWrap: { paddingTop: 18, paddingBottom: 10, alignItems: "center" },
  heroCircle: {
    width: 128,
    height: 128,
    borderRadius: 999,
    backgroundColor: "rgba(19,91,236,0.14)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dot1: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    opacity: 0.25,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  dot2: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#60a5fa",
    opacity: 0.18,
    shadowColor: "#60a5fa",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },

  headerText: { alignItems: "center", marginTop: 6 },
  h1: { color: COLORS.white, fontSize: 32, fontWeight: "900", letterSpacing: -0.4, textAlign: "center" },
  sub: {
    marginTop: 10,
    color: "rgba(154,167,189,0.95)",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },

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
  mailIcon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.white, fontSize: 16, fontWeight: "600" },

  helpRow: { marginTop: 18, flexDirection: "row", justifyContent: "center", flexWrap: "wrap" },
  helpText: { color: "rgba(154,167,189,0.9)", fontSize: 13, fontWeight: "600" },
  helpLink: { color: COLORS.primary, fontSize: 13, fontWeight: "900" },

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

  tryAnother: { marginTop: 14, textAlign: "center", color: "rgba(154,167,189,0.9)", fontSize: 13, fontWeight: "700" },
});
