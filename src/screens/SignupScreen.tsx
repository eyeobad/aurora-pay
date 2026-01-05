import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useNavigation, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "../context/AppContext";

const GoogleLogo = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22.56 12.25C22.56 11.47 22.49 10.72 22.38 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.73 17.57V20.32H19.29C21.37 18.41 22.56 15.59 22.56 12.25Z"
      fill="#4285F4"
    />
    <Path
      d="M12 23C14.97 23 17.46 22.01 19.29 20.32L15.73 17.57C14.75 18.23 13.49 18.63 12 18.63C9.14 18.63 6.71 16.7 5.85 14.11H2.17V16.96C4.01 20.61 7.78 23 12 23Z"
      fill="#34A853"
    />
    <Path
      d="M5.85 14.11C5.63 13.33 5.51 12.51 5.51 11.67C5.51 10.83 5.63 10.01 5.85 9.23V6.38H2.17C1.42 7.87 1 9.57 1 11.67C1 13.77 1.42 15.47 2.17 16.96L5.85 14.11Z"
      fill="#FBBC05"
    />
    <Path
      d="M12 4.71C13.62 4.71 15.07 5.27 16.21 6.36L19.38 3.19C17.45 1.39 14.97 0.33 12 0.33C7.78 0.33 4.01 2.72 2.17 6.38L5.85 9.23C6.71 6.63 9.14 4.71 12 4.71Z"
      fill="#EA4335"
    />
  </Svg>
);

const AppleLogo = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      fill={color}
      d="M17.05 20.28C15.69 22.25 14.15 22.21 12.65 22.21C11.15 22.21 10.7 21.33 9.05 21.33C7.4 21.33 6.9 22.16 5.55 22.21C4.05 22.26 2.5 20.66 1.35 18.66C-1 14.61 0.7 8.76 4.95 8.56C6.35 8.51 7.35 9.46 8.3 9.46C9.25 9.46 10.55 8.36 12.25 8.41C12.95 8.41 14.85 8.66 16.05 10.41C15.95 10.46 13.9 11.66 13.95 14.96C14 17.66 16.35 18.66 16.4 18.66C16.35 18.81 15.95 20.16 15.4 21.11L17.05 20.28ZM11.9 6.11C12.55 5.31 13 4.21 12.9 3.11C11.95 3.21 10.85 3.76 10.2 4.56C9.6 5.31 9.1 6.46 9.25 7.51C10.25 7.61 11.3 7.01 11.9 6.11Z"
    />
  </Svg>
);

const T = {
  primary: "#135bec",
  bgLight: "#f6f6f8",
  bgDark: "#101622",
  textLight: "#ffffff",
  textDark: "#111418",
  subLight: "#637588",
  subDark: "#93a2b7",
  surfaceLight: "#ffffff",
  surfaceDark: "#192233",
  borderLight: "#dce0e5",
  borderDark: "#324467",
  placeholderLight: "#637588",
  placeholderDark: "#92a4c9",
  dividerDark: "#2a3649",
};

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Dashboard: undefined;
  Terms?: undefined;
  Privacy?: undefined;
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Signup">;

export default function SignupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { signup } = useApp();

  // Safe area insets to pad top and bottom
  const insets = useSafeAreaInsets();

  // Always dark theme to match your HTML design
  const isDark = true;
  const theme = {
    background: isDark ? T.bgDark : T.bgLight,
    surface: isDark ? T.surfaceDark : T.surfaceLight,
    text: isDark ? T.textLight : T.textDark,
    subtext: isDark ? T.subDark : T.subLight,
    border: isDark ? T.borderDark : T.borderLight,
    placeholder: isDark ? T.placeholderDark : T.placeholderLight,
    divider: isDark ? T.dividerDark : T.borderLight,
    primary: T.primary,
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) return "Enter your full name.";
    if (!email.trim()) return "Enter your email address.";
    if (!password.trim()) return "Enter your password.";
    if (password.length < 6) return "Password should be at least 6 characters.";
    if (password !== confirm) return "Passwords must match.";
    if (!agree) return "You must agree to the terms.";
    return null;
  };

  const handleSignup = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Validation", error);
      return;
    }
    setLoading(true);
    try {
      await signup({ name: name.trim(), identifier: email.trim(), password });
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Dashboard" }],
        })
      );
    } catch (e: any) {
      Alert.alert("Signup failed", e?.message ?? "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top app bar with blur */}
      <BlurView
        intensity={30}
        tint="dark"
        style={[styles.topBarBlur, { paddingTop: insets.top, backgroundColor: "rgba(16,22,34,0.90)" }]}
      >
        <View style={styles.topBarInner}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back-ios-new" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.appBarTitle, { color: theme.text }]}>Aurora Pay</Text>
          <View style={{ width: 40 }} />
        </View>
      </BlurView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.main}>
            {/* Headline */}
            <View style={styles.headline}>
              <Text style={[styles.h1, { color: theme.text }]}>Start your journey.</Text>
              <Text style={[styles.p, { color: theme.subtext }]}>
                Sign up to send, spend, and save with Aurora.
              </Text>
            </View>

            {/* Form fields */}
            <View style={styles.form}>
              {/* Full Name */}
              <View>
                <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. Alex Smith"
                  placeholderTextColor={theme.placeholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View>
                <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View>
                <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.text,
                        paddingRight: 48,
                      },
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible((prev) => !prev)}
                    style={styles.eyeBtn}
                  >
                    <MaterialIcons
                      name={isPasswordVisible ? "visibility" : "visibility-off"}
                      size={20}
                      color={theme.placeholder}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View>
                <Text style={[styles.label, { color: theme.text }]}>Confirm Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.placeholder}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* Terms checkbox */}
              <View style={styles.termsRow}>
                <TouchableOpacity
                  onPress={() => setAgree((a) => !a)}
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: theme.surface,
                      borderColor: agree ? theme.primary : theme.border,
                    },
                  ]}
                >
                  {agree ? (
                    <MaterialIcons name="check" size={16} color={theme.primary} />
                  ) : null}
                </TouchableOpacity>
                <Text style={[styles.termsText, { color: theme.subtext }]}>
                  I agree to the{" "}
                  <Text
                    style={{ color: theme.primary, textDecorationLine: "underline" }}
                    onPress={() => navigation.navigate("Terms" as any)}
                  >
                    Terms &amp; Conditions
                  </Text>{" "}
                  and{" "}
                  <Text
                    style={{ color: theme.primary, textDecorationLine: "underline" }}
                    onPress={() => navigation.navigate("Privacy" as any)}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>

              {/* Primary button */}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                onPress={handleSignup}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? "Creating..." : "Create Account"}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
                <Text style={[styles.dividerText, { color: theme.subtext }]}>Or sign up with</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <AppleLogo color={theme.text} />
                  <Text style={[styles.socialText, { color: theme.text }]}>Apple</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <GoogleLogo />
                  <Text style={[styles.socialText, { color: theme.text }]}>Google</Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.subtext }]}>
                  Already a member?{" "}
                  <Text
                    style={{ color: theme.primary, fontWeight: "800", textDecorationLine: "underline" }}
                    onPress={() => navigation.navigate("Login")}
                  >
                    Log in
                  </Text>
                </Text>
              </View>

              {/* Face ID hint */}
              <View style={styles.faceId}>
                <MaterialIcons name="face" size={32} color={theme.text} style={{ opacity: 0.4 }} />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBarBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    flex: 1,
    textAlign: "center",
    paddingRight: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: T.bgDark,
  },
  scrollContent: {
    paddingTop: 88,
    paddingBottom: 24,
    flexGrow: 1,
  },
  main: {
    paddingHorizontal: 16,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    marginTop: 8,
  },
  headline: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  h1: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  p: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  form: {
    gap: 16,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    paddingBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 9999,
    paddingHorizontal: 24,
    fontSize: 16,
    borderWidth: 1,
  },
  passwordWrap: {
    position: "relative",
    justifyContent: "center",
  },
  eyeBtn: {
    position: "absolute",
    right: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    width: 36,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 9999,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#135bec",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 5,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  socialRow: {
    flexDirection: "row",
    gap: 16,
  },
  socialBtn: {
    flex: 1,
    height: 56,
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  socialText: {
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    fontWeight: "400",
  },
  faceId: {
    marginTop: 32,
    paddingBottom: 32,
    alignItems: "center",
    opacity: 0,
  },
});
